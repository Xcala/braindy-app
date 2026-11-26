// When a cuenta or recibo reaches the client: a notice in the app (the bell reads brands/{id}/billingNotices,
// only billing people and admin can) and an alert on the phones of the people who see Billing.
// Never throws: a notice must not break the send. Never logs names, amounts or contacts.
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { sectionsOf } from '../access.js';
import { adminUids, pushTo } from '../push/send.js';
import { money, monthLabelL } from './money.js';
import type { BillingDoc } from './store.js';

/** Members of the brand (or of a group above it) who see Billing, minus admins. */
export async function billingPeople(brandId: string) {
  const brand = await db.doc(`brands/${brandId}`).get();
  if ((((brand.get('sectionsOff') as string[] | undefined) ?? [])).includes('billing')) return [];
  const chain = [brandId, ...((brand.get('ancestors') as string[]) ?? [])];
  const out = new Set<string>();
  for (const id of chain) {
    const m = await db.collection(`brands/${id}/members`).get();
    m.docs.forEach((d) => { if (sectionsOf(d.data()).includes('billing')) out.add(d.id); });
  }
  const adm = new Set(await adminUids());
  return [...out].filter((u) => !adm.has(u));
}

export async function notifyBilling(brandId: string, docId: string, d: BillingDoc) {
  try {
    const cur = d.currency ?? 'COP';
    const recibo = d.type === 'recibo';
    await db.doc(`brands/${brandId}/billingNotices/${docId}`).set({
      docId, number: d.number, type: d.type, amount: d.amount, currency: cur, billingMonth: d.billingMonth ?? null, at: FieldValue.serverTimestamp(),
    });
    const uids = await billingPeople(brandId);
    if (!uids.length) return { people: 0 };
    const amt = money(d.amount, cur);
    await pushTo(uids, {
      kind: 'billing', tag: `billing-${docId}`, url: '/plan?tab=payments',
      title: { es: recibo ? `Recibo de pago ${d.number}` : `Nueva cuenta de cobro ${d.number}`, en: recibo ? `Payment receipt ${d.number}` : `New invoice ${d.number}` },
      body: {
        es: recibo ? `Recibimos ${amt}. El recibo está en Pagos.` : `${monthLabelL(d.billingMonth, 'es')} · ${amt}. Descárgala en Pagos.`,
        en: recibo ? `We received ${amt}. The receipt is in Payments.` : `${monthLabelL(d.billingMonth, 'en')} · ${amt}. Download it in Payments.`,
      },
    });
    return { people: uids.length };
  } catch (e) {
    console.warn('billing notice failed', String(e).slice(0, 80));
    return { people: 0 };
  }
}
