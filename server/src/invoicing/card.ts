// Paying a cuenta de cobro by card: Stripe Checkout for what is still owed on that cuenta plus the card fee, which the
// client pays (Nicolas, 2026-11-26) as its own line. Only the cuenta amount is recorded as paid; the fee is not income.
// When Stripe confirms (checkout.session.completed, paid), the payment is recorded on the cuenta, the recibo comes out
// and goes to the client (app, email, WhatsApp) and NickMark gets an alert. Card data never touches Braindy.
// Transfers keep working as before: the client uploads the proof and NickMark confirms it.
import { db } from '../firebase.js';
import { stripe, stripeConfigured } from '../stripe.js';
import { adminUids, pushTo } from '../push/send.js';
import { money } from './money.js';
import { recordPayment } from './payments.js';
import { sendDoc } from './issue.js';
import { audit, docsCol, type BillingDoc } from './store.js';

const PUBLIC_BASE = process.env.PUBLIC_BASE_URL ?? 'https://braindy-app-staging.web.app';
const OPEN = ['issued', 'sent', 'overdue'];
/** The card fee the client pays on top, in % (CARD_FEE_PCT, default 5: Stripe card + international + conversion). */
export const cardFeePct = () => { const v = Number(process.env.CARD_FEE_PCT); return Number.isFinite(v) && v >= 0 && v < 20 ? v : 5; };
export const cardFee = (owed: number) => Math.round((owed * cardFeePct()) / 100);

/** COP is kept in pesos and USD in cents; Stripe wants hundredths for both. */
const stripeAmount = (n: number, cur: 'COP' | 'USD') => (cur === 'USD' ? Math.round(n) : Math.round(n) * 100);
const fromStripe = (n: number, cur: 'COP' | 'USD') => (cur === 'USD' ? Math.round(n) : Math.round(n / 100));

export async function cuentaCheckout(brandId: string, docId: string, uid: string, lang: 'es' | 'en') {
  const d = (await docsCol(brandId).doc(docId).get()).data() as BillingDoc | undefined;
  if (!d || d.held || d.type !== 'cuenta_cobro' || !OPEN.includes(d.status)) throw new Error('not_open');
  const owed = d.amount - (d.paid ?? 0);
  if (owed <= 0) throw new Error('not_open');
  if (!stripeConfigured()) throw new Error('stripe_not_configured');
  const cur = d.currency ?? 'COP';
  const [brand, profile] = await Promise.all([db.doc(`brands/${brandId}`).get(), db.doc(`brands/${brandId}/billing/profile`).get()]);
  const name = String(brand.get('name') ?? '');
  const what = cur === 'USD' ? `Invoice ${d.number}` : `Cuenta de cobro ${d.number}`;
  const fee = cardFee(owed);
  const meta = { kind: 'cuenta', brandId, docId, amount: String(owed), fee: String(fee), currency: cur };
  const back = `${PUBLIC_BASE}/plan?brand=${encodeURIComponent(brandId)}&tab=payments`;
  const s = await stripe<{ id: string; url: string }>('POST', 'checkout/sessions', {
    mode: 'payment',
    line_items: [
      { quantity: 1, price_data: { currency: cur.toLowerCase(), unit_amount: stripeAmount(owed, cur), product_data: { name: `${what} · ${name}` } } },
      ...(fee > 0 ? [{ quantity: 1, price_data: { currency: cur.toLowerCase(), unit_amount: stripeAmount(fee, cur), product_data: { name: lang === 'en' ? `Card fee (${cardFeePct()}%)` : `Comisión por pago con tarjeta (${cardFeePct()} %)` } } }] : []),
    ],
    metadata: meta, payment_intent_data: { metadata: meta, description: `${what} · ${name}` },
    customer_email: (profile.get('accountingEmail') as string) || undefined,
    locale: lang, success_url: `${back}&card=paid`, cancel_url: `${back}&card=canceled`,
  });
  await audit('billing_card_checkout', brandId, uid, { docId, amount: owed });
  return { url: s.url, fee };
}

/** From the Stripe webhook, once per event. Never throws: Stripe must get its 200 either way. */
export async function onCuentaPaid(o: Record<string, any>) {
  const { brandId, docId } = (o.metadata ?? {}) as { brandId?: string; docId?: string };
  if (!brandId || !docId || o.payment_status !== 'paid') return;
  try {
    const d = (await docsCol(brandId).doc(docId).get()).data() as BillingDoc | undefined;
    if (!d) throw new Error('not_found');
    const cur = d.currency ?? 'COP';
    // What Stripe charged minus the card fee line is what goes to the cuenta.
    const got = fromStripe(Number(o.amount_total ?? 0), cur) - (Number(o.metadata?.fee) || 0);
    const owed = d.amount - (d.paid ?? 0);
    const date = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const r = await recordPayment(brandId, 'stripe', { docIds: [docId], date, amount: Math.min(got, owed), method: cur === 'USD' ? 'Card (Stripe)' : 'Tarjeta (Stripe)', receipt: true });
    if (r.receipt) await sendDoc(brandId, r.receipt.number, 'stripe').catch((e) => console.warn('card receipt send failed', String(e).slice(0, 60)));
    if (got > owed) await audit('billing_card_overpaid', brandId, 'stripe', { docId, extra: got - owed, session: o.id });
    const name = String((await db.doc(`brands/${brandId}`).get()).get('name') ?? '');
    await pushTo(await adminUids(), {
      kind: 'decisions', tag: `billing-card-${docId}`, url: `/plan?brand=${brandId}&tab=payments`,
      title: { es: `${name} pagó ${d.number} con tarjeta`, en: `${name} paid ${d.number} by card` },
      body: { es: `${money(Math.min(got, owed), cur)}. El recibo ya salió.`, en: `${money(Math.min(got, owed), cur)}. The receipt went out.` },
    }).catch(() => undefined);
  } catch (e) {
    // Paid in Stripe but not recorded here (already paid, voided…): leave a trace for NickMark to settle by hand.
    await audit('billing_card_unrecorded', brandId, 'stripe', { docId, session: o.id, reason: String((e as Error).message).slice(0, 60) });
    console.warn('card payment not recorded', String((e as Error).message).slice(0, 60));
  }
}
