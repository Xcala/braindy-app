// Activating an agreement, issuing cuentas (PDF frozen at issue: an issued cuenta never changes, it can only be
// voided), sending them (email with the PDF from the connected mailbox + WhatsApp link), and the daily job.
import type { DocumentReference } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { adminUids, pushTo } from '../push/send.js';
import { mailReady, sendWithAttachment } from '../mail/gmail.js';
import { normalizePhone, sendText, waMeLink } from '../whatsapp.js';
import { getContact, windowOpen } from '../wa/contacts.js';
import { pdfUrl } from '../contracts/store.js';
import { amountInWords, isLate, money, monthLabelL, planOf, todayBogota } from './money.js';
import { renderBillingPdf, type PdfInput } from './pdf.js';
import { notifyBilling } from './notifyBilling.js';
import {
  agreementsCol, audit, docsCol, issuerRef, newToken, now, profileRef, readFile, saveFile, sha256,
  type Agreement, type BillingDoc, type Issuer, type Profile,
} from './store.js';

export const PUBLIC_API = process.env.PUBLIC_API_URL ?? 'https://braindy-api-283103160183.us-central1.run.app';
export const OVERDUE_DAYS = 30;

export async function loadIssuer(id: string): Promise<Issuer> {
  const s = await issuerRef(id).get();
  if (!s.exists) throw new Error('no_issuer');
  return s.data() as Issuer;
}
export async function loadProfile(brandId: string): Promise<Profile> {
  const s = await profileRef(brandId).get();
  if (!s.exists || !s.get('legalName')) throw new Error('no_profile');
  return s.data() as Profile;
}

/** One number per issuer, ever: claimed on issue, never released (void keeps it). */
async function claimNumber(issuerId: string, number: string, docPath: string) {
  await issuerRef(issuerId).collection('numbers').doc(number).create({ docPath, at: now() }).catch(() => { throw new Error('number_taken'); });
}

/** Turns the agreement into its cuentas: past and current months issue now (dated today), the rest wait. */
export async function activate(brandId: string, agreementId: string, by: string) {
  const ref = agreementsCol(brandId).doc(agreementId);
  const a = (await ref.get()).data() as Agreement | undefined;
  if (!a) throw new Error('not_found');
  if (a.status !== 'draft') throw new Error('not_draft');
  await loadIssuer(a.issuerId); await loadProfile(brandId);
  const rows = planOf(a);
  if (rows.reduce((n, r) => n + r.amount, 0) !== a.totalAmount) throw new Error('sum_mismatch');
  // Numbers first, so a clash stops everything before a cuenta exists.
  for (const r of rows) {
    const taken = await issuerRef(a.issuerId).collection('numbers').doc(r.number).get();
    if (taken.exists) throw new Error('number_taken');
  }
  const batch = db.batch();
  const refs: DocumentReference[] = [];
  for (const r of rows) {
    const d = docsCol(brandId).doc(r.number);
    refs.push(d);
    const doc: BillingDoc = {
      agreementId, type: 'cuenta_cobro', number: r.number, index: r.index, of: r.of, billingMonth: r.billingMonth, scheduledDate: r.scheduledDate,
      issueDate: null, amount: r.amount, amountWords: amountInWords(r.amount, a.currency ?? 'COP'), currency: a.currency ?? 'COP', status: 'scheduled', payments: [], paid: 0, held: !a.autoSend,
    };
    batch.set(d, { ...doc, createdAt: now(), createdBy: by });
  }
  batch.update(ref, { status: 'active', activatedAt: now(), activatedBy: by });
  await batch.commit();
  await audit('billing_agreement_active', brandId, by, { agreementId, cuentas: rows.length });
  const issued: string[] = [];
  for (const [i, r] of rows.entries()) if (r.issueNow) { await issueDoc(brandId, refs[i].id, by); issued.push(r.number); }
  return { issued, scheduled: rows.filter((r) => !r.issueNow).map((r) => r.number) };
}

/** The PDF input of a cuenta from its agreement, issuer and client (snapshotted on the doc when issued). */
async function inputFor(brandId: string, d: BillingDoc, issueDate: string): Promise<PdfInput & { issuerId: string }> {
  const a = (await agreementsCol(brandId).doc(d.agreementId!).get()).data() as Agreement;
  const issuer = await loadIssuer(a.issuerId);
  const client = await loadProfile(brandId);
  const signature = issuer.signatureStoragePath ? await readFile(issuer.signatureStoragePath).catch(() => null) : null;
  return {
    issuerId: a.issuerId, type: 'cuenta_cobro', number: d.number, index: d.index, of: d.of, billingMonth: d.billingMonth, issueDate,
    amount: d.amount, amountWords: d.amountWords, issuer, client, signature, title: a.title, concept: a.concept, packs: a.packs,
    servicePeriod: a.servicePeriod, executionPlace: a.executionPlace, projectClose: a.projectClose, totalAmount: a.totalAmount, distributionNote: a.distributionNote,
  };
}

/** Issues one scheduled cuenta: claims its number, renders and stores the PDF. Held for Nico unless the agreement auto-sends. */
export async function issueDoc(brandId: string, docId: string, by: string) {
  const ref = docsCol(brandId).doc(docId);
  const d = (await ref.get()).data() as BillingDoc | undefined;
  if (!d) throw new Error('not_found');
  if (d.status !== 'scheduled') throw new Error('already_issued');
  const issueDate = todayBogota();
  const input = await inputFor(brandId, d, issueDate);
  if (!input.signature) throw new Error('no_signature');
  await claimNumber(input.issuerId, d.number, ref.path);
  const pdf = await renderBillingPdf(input);
  const path = await saveFile(`brands/${brandId}/billing/${d.number}.pdf`, pdf, 'application/pdf');
  const { issuer, signature: _s, ...snap } = input;
  await ref.update({
    status: (d.paid ?? 0) >= d.amount ? 'paid' : 'issued', issueDate, pdfStoragePath: path, pdfHash: sha256(pdf), issuedAt: now(), issuedBy: by,
    snapshot: { ...snap, issuer: { name: issuer.name, docType: issuer.docType, docNumber: issuer.docNumber } },
  });
  await audit('billing_doc_issued', brandId, by, { docId, number: d.number, amount: d.amount });
  const a = (await agreementsCol(brandId).doc(d.agreementId!).get()).data() as Agreement;
  if (a.autoSend) await sendDoc(brandId, docId, by).catch(() => undefined);
  return { number: d.number, pdfHash: sha256(pdf) };
}

export const kindOf = (d: Pick<BillingDoc, 'type' | 'currency'>) =>
  d.currency === 'USD' ? (d.type === 'recibo' ? 'Payment receipt' : 'Invoice') : (d.type === 'recibo' ? 'Recibo de pago' : 'Cuenta de cobro');
export const fileNameOf = (d: Pick<BillingDoc, 'type' | 'number' | 'currency'>, brand: string) => `${kindOf(d)} ${d.number} · ${brand}.pdf`;

/** Email (PDF attached) to accounting + WhatsApp with a private link. Returns what went out and a wa.me fallback. */
export async function sendDoc(brandId: string, docId: string, by: string) {
  const ref = docsCol(brandId).doc(docId);
  const d = (await ref.get()).data() as BillingDoc | undefined;
  if (!d || !d.pdfStoragePath || d.status === 'scheduled' || d.status === 'void') throw new Error('not_sendable');
  const p = await loadProfile(brandId);
  const brand = String((await db.doc(`brands/${brandId}`).get()).get('name') ?? brandId);
  const { token, hash } = newToken();
  await ref.update({ publicTokenHash: hash });
  const link = `${PUBLIC_API}/public/billing/${token}`;
  const en = d.currency === 'USD';
  const what = en
    ? (d.type === 'recibo' ? `payment receipt ${d.number}` : `invoice ${d.number} (${monthLabelL(d.billingMonth, 'en')})`)
    : (d.type === 'recibo' ? `el recibo de pago ${d.number}` : `la cuenta de cobro ${d.number} (${monthLabelL(d.billingMonth)})`);
  const body = en
    ? `Hello. Here is ${what} for ${brand}, ${money(d.amount, 'USD')}.\n\nDownload it here: ${link}\n\nNicolás Márquez · Braindy`
    : `Hola. Te comparto ${what} de ${brand} por ${money(d.amount)}.\n\nDescárgala aquí: ${link}\n\nNicolás Márquez · Braindy`;
  const via: string[] = [];
  let waMe: string | null = null;
  if (p.accountingEmail && mailReady()) {
    const ok = await sendWithAttachment(p.accountingEmail, `${kindOf(d)} ${d.number} · ${brand}`, body,
      { name: fileNameOf(d, brand), type: 'application/pdf', bytes: await readFile(d.pdfStoragePath) }).then(() => true, () => false);
    if (ok) via.push('email');
  }
  const phone = p.accountingWhatsApp ? normalizePhone(p.accountingWhatsApp) : null;
  if (phone) {
    const sent = windowOpen(await getContact(phone)) && (await sendText(phone, body)).sent;
    if (sent) via.push('whatsapp'); else waMe = waMeLink(phone, body);
  }
  // Sending always releases it to the client's app (Pagos), even when no email or WhatsApp went out.
  await ref.update({ status: d.status === 'issued' ? 'sent' : d.status, held: false, sentAt: now(), sentVia: [...via, 'app'] });
  const { people } = await notifyBilling(brandId, docId, d);
  await audit('billing_doc_sent', brandId, by, { docId, number: d.number, via, people });
  return { via, waMe, link, people, email: via.includes('email') ? p.accountingEmail ?? null : null, whatsapp: via.includes('whatsapp') || waMe ? p.accountingWhatsApp ?? null : null };
}

/** Private download: a short signed URL to the frozen PDF. */
export async function pdfLink(brandId: string, docId: string) {
  const d = (await docsCol(brandId).doc(docId).get()).data() as BillingDoc | undefined;
  if (!d?.pdfStoragePath) throw new Error('not_found');
  const brand = String((await db.doc(`brands/${brandId}`).get()).get('name') ?? brandId);
  return pdfUrl(d.pdfStoragePath, fileNameOf(d, brand));
}

/** Daily: issue what is due today, then mark unpaid cuentas overdue OVERDUE_DAYS after issue (or after their planned day if issued early). */
export async function billingDaily() {
  const today = todayBogota();
  let issued = 0, overdue = 0, failed = 0;
  const due = await db.collectionGroup('billingDocs').where('status', '==', 'scheduled').where('scheduledDate', '<=', today).get();
  for (const s of due.docs) {
    const brandId = s.ref.parent.parent!.id;
    try { await issueDoc(brandId, s.id, 'cron'); issued++; } catch (e) { failed++; console.warn('billing issue failed', s.ref.path, String(e).slice(0, 80)); }
  }
  const cutoff = new Date(Date.now() - OVERDUE_DAYS * 864e5).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  for (const st of ['issued', 'sent'] as const) {
    const late = await db.collectionGroup('billingDocs').where('status', '==', st).where('issueDate', '<=', cutoff).get();
    for (const s of late.docs) {
      const d = s.data() as BillingDoc;
      // A cuenta issued before its month counts from its planned day, not from the day it went out.
      if (d.type === 'cuenta_cobro' && !s.get('overdueOff') && isLate(d, today, OVERDUE_DAYS)) { await s.ref.update({ status: 'overdue' }); overdue++; }
    }
  }
  // Held cuentas wait for Nico («Para tu ojo»): one alert with how many.
  if (issued) await pushTo(await adminUids(), {
    kind: 'decisions', tag: 'billing-issued', url: '/admin/billing',
    title: { es: 'Cuentas de cobro emitidas', en: 'Cuentas de cobro issued' },
    body: { es: `${issued} lista(s) para revisar y enviar.`, en: `${issued} ready to review and send.` },
  }).catch(() => undefined);
  return { billingIssued: issued, billingOverdue: overdue, billingFailed: failed };
}
