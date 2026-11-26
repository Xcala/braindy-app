// Payments: Nico records one (it may cover several cuentas or part of one, e.g. a 50% advance); the client says
// «Ya pagué» with a proof (pending until Nico confirms). A confirmed payment can produce a recibo (RC-0001…).
// Voiding keeps the cuenta and its number, with the reason.
import { randomUUID } from 'node:crypto';
import { db } from '../firebase.js';
import { allocate, amountInWords, todayBogota } from './money.js';
import { renderBillingPdf } from './pdf.js';
import { loadIssuer, loadProfile } from './issue.js';
import { agreementsCol, audit, docsCol, issuerRef, issuerStyle, now, readFile, saveFile, sha256, type Agreement, type BillingDoc, type Payment } from './store.js';

const OPEN = ['issued', 'sent', 'overdue'];
// An advance may reach cuentas that are not issued yet: they keep their schedule and come out already paid.
const PAYABLE = [...OPEN, 'scheduled'];
const owed = (d: BillingDoc) => d.amount - (d.paid ?? 0);

/** Spreads a confirmed payment over the agreement's open cuentas in order (or the ones named). */
export async function recordPayment(brandId: string, by: string, p: { agreementId?: string; docIds?: string[]; date: string; amount: number; method: string; proofStoragePath?: string | null; receipt?: boolean }) {
  if (!(p.amount > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(p.date)) throw new Error('bad_payment');
  let q = docsCol(brandId).where('type', '==', 'cuenta_cobro');
  if (p.agreementId) q = q.where('agreementId', '==', p.agreementId);
  const all = (await q.get()).docs.map((s) => ({ id: s.id, ref: s.ref, d: s.data() as BillingDoc }));
  const open = all.filter((x) => PAYABLE.includes(x.d.status) && owed(x.d) > 0 && (!p.docIds?.length || p.docIds.includes(x.id))).sort((a, b) => a.d.index - b.d.index);
  const parts = allocate(open.map((x) => ({ id: x.id, owed: owed(x.d) })), p.amount);
  const applied = parts.reduce((n, x) => n + x.applied, 0);
  if (!parts.length || applied < Math.round(p.amount)) throw new Error(parts.length ? 'more_than_owed' : 'nothing_open');
  const paymentId = randomUUID();
  const batch = db.batch();
  for (const part of parts) {
    const x = open.find((o) => o.id === part.id)!;
    const pay: Payment = { id: paymentId, date: p.date, amount: part.applied, method: p.method, proofStoragePath: p.proofStoragePath ?? null, status: 'confirmed', by };
    batch.update(x.ref, { payments: [...(x.d.payments ?? []), pay], paid: (x.d.paid ?? 0) + part.applied, ...(part.settles && x.d.status !== 'scheduled' ? { status: 'paid', paidAt: now() } : {}) });
  }
  await batch.commit();
  await audit('billing_payment', brandId, by, { paymentId, amount: applied, cuentas: parts.map((x) => x.id) });
  const receipt = p.receipt ? await issueReceipt(brandId, by, { paymentId, date: p.date, method: p.method, covers: parts.map((x) => ({ docId: x.id, number: open.find((o) => o.id === x.id)!.d.number, amount: x.applied })) }) : null;
  return { paymentId, covers: parts, receipt };
}

/** The client's «Ya pagué»: a proof waiting for Nico on one cuenta. */
export async function claimPaid(brandId: string, docId: string, by: string, p: { date: string; amount: number; method: string; proofStoragePath: string }) {
  const ref = docsCol(brandId).doc(docId);
  const d = (await ref.get()).data() as BillingDoc | undefined;
  if (!d || d.type !== 'cuenta_cobro' || !OPEN.includes(d.status)) throw new Error('not_open');
  const pay: Payment = { id: randomUUID(), date: p.date, amount: Math.round(p.amount) || owed(d), method: p.method || 'Transferencia', proofStoragePath: p.proofStoragePath, status: 'pending', by };
  await ref.update({ payments: [...(d.payments ?? []), pay], pendingProof: true });
  await audit('billing_paid_claim', brandId, by, { docId, amount: pay.amount });
  return pay;
}

/** Nico confirms a pending proof: it becomes a confirmed payment on that cuenta (and optionally a recibo). */
export async function confirmClaim(brandId: string, docId: string, paymentId: string, by: string, receipt: boolean) {
  const ref = docsCol(brandId).doc(docId);
  const d = (await ref.get()).data() as BillingDoc | undefined;
  const claim = d?.payments?.find((x) => x.id === paymentId && x.status === 'pending');
  if (!d || !claim) throw new Error('not_found');
  await ref.update({ payments: d.payments!.filter((x) => x.id !== paymentId), pendingProof: d.payments!.some((x) => x.id !== paymentId && x.status === 'pending') });
  return recordPayment(brandId, by, { docIds: [docId], date: claim.date, amount: Math.min(claim.amount, owed(d)), method: claim.method, proofStoragePath: claim.proofStoragePath, receipt });
}

/** A recibo for a payment: its own number RC-0001… per issuer, PDF frozen like a cuenta. */
export async function issueReceipt(brandId: string, by: string, r: { paymentId: string; date: string; method: string; covers: Array<{ docId: string; number: string; amount: number }> }) {
  const first = (await docsCol(brandId).doc(r.covers[0].docId).get()).data() as BillingDoc;
  const a = (await agreementsCol(brandId).doc(first.agreementId!).get()).data() as Agreement;
  const issuer = await loadIssuer(a.issuerId);
  const client = await loadProfile(brandId);
  const n = await db.runTransaction(async (tx) => {
    const s = await tx.get(issuerRef(a.issuerId));
    const next = Number(s.get('nextReceipt') ?? 1);
    tx.update(issuerRef(a.issuerId), { nextReceipt: next + 1 });
    return next;
  });
  const style = issuerStyle(issuer);
  const number = `${style.receiptPrefix}-${String(n).padStart(4, '0')}`;
  await issuerRef(a.issuerId).collection('numbers').doc(number).create({ docPath: `brands/${brandId}/billingDocs/${number}`, at: now() });
  const amount = r.covers.reduce((x, c) => x + c.amount, 0);
  const issueDate = todayBogota();
  const signature = issuer.signatureStoragePath ? await readFile(issuer.signatureStoragePath).catch(() => null) : null;
  const pdf = await renderBillingPdf({
    type: 'recibo', number, index: 1, of: 1, billingMonth: r.date.slice(0, 7), issueDate, amount, amountWords: amountInWords(amount, style.currency), issuer, client, signature,
    title: a.title, concept: a.concept, packs: [], receipt: { method: r.method, paidOn: r.date, covers: r.covers },
  });
  const path = await saveFile(`brands/${brandId}/billing/${number}.pdf`, pdf, 'application/pdf');
  const doc: BillingDoc = {
    agreementId: first.agreementId, type: 'recibo', number, index: n, of: 0, billingMonth: r.date.slice(0, 7), scheduledDate: issueDate, issueDate, paidOn: r.date,
    amount, amountWords: amountInWords(amount, style.currency), currency: style.currency, status: 'issued', pdfStoragePath: path, pdfHash: sha256(pdf), covers: r.covers, payments: [], paid: amount, held: true,
  };
  await docsCol(brandId).doc(number).set({ ...doc, paymentId: r.paymentId, issuedAt: now(), issuedBy: by });
  await audit('billing_receipt_issued', brandId, by, { number, amount });
  return { number, amount };
}

/** Voids an issued cuenta (or a scheduled one): kept with its reason; the number is never reused. */
export async function voidDoc(brandId: string, docId: string, by: string, reason: string) {
  const ref = docsCol(brandId).doc(docId);
  const d = (await ref.get()).data() as BillingDoc | undefined;
  if (!d || d.status === 'void') throw new Error('not_found');
  if ((d.paid ?? 0) > 0 && d.type === 'cuenta_cobro') throw new Error('has_payments');
  if (!reason.trim()) throw new Error('reason');
  // A scheduled cuenta has not claimed its number yet: claim it now so it is never reused.
  if (d.status === 'scheduled' && d.agreementId) {
    const a = (await agreementsCol(brandId).doc(d.agreementId).get()).data() as Agreement;
    await issuerRef(a.issuerId).collection('numbers').doc(d.number).create({ docPath: ref.path, at: now(), void: true }).catch(() => undefined);
  }
  await ref.update({ status: 'void', voidReason: reason.trim().slice(0, 300), voidedAt: now(), voidedBy: by });
  await audit('billing_doc_void', brandId, by, { docId, number: d.number, reason: reason.trim().slice(0, 300) });
}
