// «Enviar todo en un solo correo»: every cuenta and recibo still waiting, in ONE email from the connected mailbox
// (all PDFs attached, a private link for each) and ONE WhatsApp message; one phone alert to billing people.
// Never logs addresses, phones or bodies.
import { db } from '../firebase.js';
import { mailReady, sendWithAttachments } from '../mail/gmail.js';
import { pushTo } from '../push/send.js';
import { normalizePhone, sendText, waMeLink } from '../whatsapp.js';
import { getContact, windowOpen } from '../wa/contacts.js';
import { PUBLIC_API, fileNameOf, kindOf, loadProfile } from './issue.js';
import { money, monthLabelL } from './money.js';
import { billingPeople, notifyBilling } from './notifyBilling.js';
import { audit, docsCol, newToken, now, readFile, type BillingDoc } from './store.js';

export async function sendBatch(brandId: string, docIds: string[], by: string) {
  const ids = [...new Set(docIds)].slice(0, 40);
  const snaps = await Promise.all(ids.map((id) => docsCol(brandId).doc(id).get()));
  const docs = snaps.map((s) => ({ id: s.id, ref: s.ref, d: s.data() as BillingDoc | undefined }))
    .filter((x): x is typeof x & { d: BillingDoc } => !!x.d && !!x.d.pdfStoragePath && x.d.status !== 'scheduled' && x.d.status !== 'void')
    .sort((a, b) => (a.d.type === b.d.type ? a.d.number.localeCompare(b.d.number) : a.d.type === 'cuenta_cobro' ? -1 : 1));
  if (!docs.length) throw new Error('not_sendable');
  const p = await loadProfile(brandId);
  const brand = String((await db.doc(`brands/${brandId}`).get()).get('name') ?? brandId);
  const en = docs[0].d.currency === 'USD';

  const lines: string[] = [];
  for (const x of docs) {
    const { token, hash } = newToken();
    await x.ref.update({ publicTokenHash: hash });
    const month = x.d.type === 'recibo' ? '' : ` · ${monthLabelL(x.d.billingMonth, en ? 'en' : 'es')}`;
    lines.push(`• ${kindOf(x.d)} ${x.d.number}${month} · ${money(x.d.amount, x.d.currency ?? 'COP')}\n  ${PUBLIC_API}/public/billing/${token}`);
  }
  const totals = new Map<string, number>();
  docs.filter((x) => x.d.type === 'cuenta_cobro').forEach((x) => totals.set(x.d.currency ?? 'COP', (totals.get(x.d.currency ?? 'COP') ?? 0) + x.d.amount));
  const total = [...totals].map(([cur, v]) => money(v, cur as 'COP')).join(' + ');
  const body = en
    ? `Hello. Here are the documents for ${brand}${total ? ` (invoices total ${total})` : ''}. Each PDF is attached and can also be downloaded here:\n\n${lines.join('\n\n')}\n\nNicolás Márquez · Braindy`
    : `Hola. Te comparto los documentos de ${brand}${total ? ` (las cuentas suman ${total})` : ''}. Van adjuntos en PDF y también puedes descargarlos aquí:\n\n${lines.join('\n\n')}\n\nNicolás Márquez · Braindy`;
  const n = docs.length;
  const subject = en ? `${n} documents · ${brand}` : `${n} documentos de cobro · ${brand}`;

  const via: string[] = [];
  let waMe: string | null = null;
  if (p.accountingEmail && mailReady()) {
    const files = await Promise.all(docs.map(async (x) => ({ name: fileNameOf(x.d, brand), type: 'application/pdf', bytes: await readFile(x.d.pdfStoragePath!) })));
    if (await sendWithAttachments(p.accountingEmail, subject, body, files).then(() => true, () => false)) via.push('email');
  }
  const phone = p.accountingWhatsApp ? normalizePhone(p.accountingWhatsApp) : null;
  if (phone) {
    const sent = windowOpen(await getContact(phone)) && (await sendText(phone, body)).sent;
    if (sent) via.push('whatsapp'); else waMe = waMeLink(phone, body);
  }
  for (const x of docs) {
    await x.ref.update({ status: x.d.status === 'issued' ? 'sent' : x.d.status, held: false, sentAt: now(), sentVia: [...via, 'app'] });
    await notifyBilling(brandId, x.id, x.d, true);
  }
  const uids = await billingPeople(brandId).catch(() => [] as string[]);
  if (uids.length) await pushTo(uids, {
    kind: 'billing', tag: `billing-batch-${brandId}`, url: '/plan?tab=payments',
    title: { es: `${n} documentos de cobro nuevos`, en: `${n} new billing documents` },
    body: { es: 'Están en Pagos para descargar.', en: 'They are in Payments to download.' },
  }).catch(() => undefined);
  await audit('billing_docs_sent_batch', brandId, by, { docIds: docs.map((x) => x.id), numbers: docs.map((x) => x.d.number), via, people: uids.length });
  return { sent: docs.map((x) => x.d.number), via, waMe, people: uids.length, email: via.includes('email') ? p.accountingEmail ?? null : null };
}
