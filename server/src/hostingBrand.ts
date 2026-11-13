// Website hosting paid from Mi plan by a brand that already exists (e.g. a site Braindy built). Unlike the public
// checkout (hosting.ts), the payment is tied to the brand: Stripe customer of the brand, metadata.brandId and
// kind 'hosting'. The state lives next to the design plan in brands/{id}/billing/plan with hosting* fields, so a
// hosting payment never touches the design plan's status, subscription or onboarding.
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { stripe, stripeConfigured, toMinor } from './stripe.js';
import { HOSTING_PLANS, hostingPrice } from './hosting.js';
import { customerFor, ownerOrAdmin, planRef } from './billing.js';
import type { AuthEnv } from './auth.js';
import { onHostingPayment, pauseSite, resumeSite } from './sitePause.js';
import { brandAccess } from './access.js';

const PUBLIC_BASE = process.env.PUBLIC_BASE_URL ?? 'https://braindy-app-staging.web.app';
const now = () => FieldValue.serverTimestamp();
type PlanKey = keyof typeof HOSTING_PLANS;
type Cur = 'usd' | 'cop';
type Bill = 'm' | 'y';

const lineFor = (plan: PlanKey, cur: Cur, bill: Bill) => ({
  currency: cur, unit_amount: toMinor(hostingPrice(plan, cur, bill)), recurring: { interval: bill === 'y' ? 'year' : 'month' },
});
const productName = (plan: PlanKey) => `Braindy · Plan ${HOSTING_PLANS[plan].name} (sitio web)`;

export const brandHosting = new Hono<AuthEnv>();

/** Pay the hosting plan (Stripe Checkout), or switch an active one (prorated on the next invoice). */
brandHosting.post('/brands/:brandId/billing/hosting', async (c) => {
  const { brandId } = c.req.param();
  const uid = c.get('user').uid;
  if (!(await ownerOrAdmin(uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const b = await c.req.json<{ plan?: string; cur?: string; bill?: string }>();
  if (!b.plan || !Object.hasOwn(HOSTING_PLANS, b.plan)) return c.json({ error: 'invalid_plan' }, 400);
  const plan = b.plan as PlanKey, cur: Cur = b.cur === 'cop' ? 'cop' : 'usd', bill: Bill = b.bill === 'y' ? 'y' : 'm';
  if (!stripeConfigured()) return c.json({ error: 'stripe_not_configured' }, 503);
  const meta = { brandId, kind: 'hosting', plan, cur, bill };
  const current = (await planRef(brandId).get()).data() ?? {};

  try {
    // Unpaid charge on the same plan: the Stripe portal updates the card and pays the open invoice (the webhook resumes the site).
    if (current.hostingSubscriptionId && current.hostingStatus === 'past_due' && current.hosting === plan && current.stripeCustomerId) {
      const p = await stripe<{ url: string }>('POST', 'billing_portal/sessions', { customer: current.stripeCustomerId, return_url: `${PUBLIC_BASE}/plan` });
      return c.json({ url: p.url });
    }
    if (current.hostingSubscriptionId && ['active', 'past_due'].includes(current.hostingStatus)) {
      // Stripe cannot change a subscription's currency: that one goes through Nicolas.
      if (current.hostingCur && current.hostingCur !== cur) return c.json({ error: 'currency_change' }, 409);
      const sub = await stripe<{ items: { data: Array<{ id: string }> } }>('GET', `subscriptions/${current.hostingSubscriptionId}`);
      const product = await stripe<{ id: string }>('POST', 'products', { name: productName(plan), metadata: { brandId } });
      await stripe('POST', `subscriptions/${current.hostingSubscriptionId}`, {
        items: [{ id: sub.items.data[0].id, price_data: { ...lineFor(plan, cur, bill), product: product.id } }],
        proration_behavior: 'create_prorations', metadata: meta,
      });
      await planRef(brandId).set({ hosting: plan, hostingBill: bill, hostingUpdatedAt: now() }, { merge: true });
      await db.collection('audit').doc().set({ type: 'hosting_switched', brandId, plan, bill, by: uid, at: now() });
      return c.json({ switched: true });
    }
    const customer = await customerFor(brandId, current);
    const session = await stripe<{ url: string }>('POST', 'checkout/sessions', {
      mode: 'subscription', customer, locale: 'auto', allow_promotion_codes: true,
      success_url: `${PUBLIC_BASE}/plan?hosting=ok`, cancel_url: `${PUBLIC_BASE}/plan?hosting=canceled`,
      metadata: meta, subscription_data: { metadata: meta },
      line_items: [{ quantity: 1, price_data: { ...lineFor(plan, cur, bill), product_data: { name: productName(plan) } } }],
    });
    return c.json({ url: session.url });
  } catch (e) {
    return c.json({ error: String((e as Error).message) }, 502);
  }
});

/** The hosting kind travels in the session, subscription or (via its parent) invoice metadata. */
export function isHostingEvent(o: Record<string, any>, plan: Record<string, any>) {
  const kind = o.metadata?.kind ?? o.subscription_details?.metadata?.kind ?? o.parent?.subscription_details?.metadata?.kind;
  if (kind) return kind === 'hosting';
  const sub = o.subscription ?? o.parent?.subscription_details?.subscription;
  return !!sub && sub === plan.hostingSubscriptionId;
}

/** Webhook side for a brand's hosting: keeps hosting* fields in billing/plan current. Invoices are recorded by the caller. */
export async function onHostingEvent(brandId: string, type: string, o: Record<string, any>) {
  const ref = planRef(brandId);
  if (type === 'checkout.session.completed' && o.payment_status === 'paid') {
    const m = o.metadata ?? {};
    await ref.set({
      hosting: m.plan ?? null, hostingCur: m.cur ?? o.currency ?? null, hostingBill: m.bill ?? 'm', hostingStatus: 'active',
      hostingSubscriptionId: o.subscription ?? null, hostingActivatedAt: now(), ...(o.customer ? { stripeCustomerId: o.customer } : {}),
    }, { merge: true });
    if (o.customer) await db.doc(`stripeCustomers/${o.customer}`).set({ brandId });
    await db.collection('audit').doc().set({ type: 'hosting_paid', brandId, plan: m.plan ?? null, at: now() });
    await onHostingPayment(brandId, true);
  }
  if (type === 'invoice.paid' || type === 'invoice.payment_failed') {
    await ref.set({ hostingStatus: type === 'invoice.paid' ? 'active' : 'past_due', ...(o.period_end ? { hostingNextChargeAt: new Date(o.period_end * 1000) } : {}) }, { merge: true });
    // A $0 invoice (e.g. a proration credit) is not a payment that should start or stop the clock.
    if (type === 'invoice.payment_failed' || (o.amount_paid ?? 0) > 0) await onHostingPayment(brandId, type === 'invoice.paid');
  }
  if (type === 'customer.subscription.updated' || type === 'customer.subscription.deleted') {
    await ref.set({
      hostingStatus: type === 'customer.subscription.deleted' ? 'canceled' : o.status === 'past_due' ? 'past_due' : 'active',
      ...(o.metadata?.plan && type === 'customer.subscription.updated' ? { hosting: o.metadata.plan } : {}),
      ...(o.current_period_end ? { hostingNextChargeAt: new Date(o.current_period_end * 1000) } : {}),
    }, { merge: true });
    // Hosting ended without a payment failure (canceled): the same clock starts, so the site pauses 15 days later.
    if (type === 'customer.subscription.deleted' && !(await ref.get()).get('hostingFailedAt')) await ref.set({ hostingFailedAt: now(), hostingDunning: 0 }, { merge: true });
  }
}

// ---------- admin: which Firebase Hosting site is the brand's, and pause / resume by hand ----------
export const adminSite = new Hono<AuthEnv>();
adminSite.use('/brands/:brandId/site/*', async (c, next) => {
  if (!(await brandAccess(c.get('user').uid, c.req.param('brandId')!)).admin) return c.json({ error: 'forbidden' }, 403);
  await next();
});
adminSite.put('/brands/:brandId/site/hosting', async (c) => {
  const { site } = await c.req.json<{ site?: string }>();
  const id = String(site ?? '').trim().toLowerCase();
  if (id && !/^[a-z0-9-]{3,63}$/.test(id)) return c.json({ error: 'invalid_site' }, 400);
  await planRef(c.req.param('brandId')).set({ hostingSite: id || null, hostingSiteUpdatedAt: now() }, { merge: true });
  return c.json({ ok: true });
});
adminSite.post('/brands/:brandId/site/pause', async (c) => {
  try { return c.json(await pauseSite(c.req.param('brandId'), c.get('user').uid)); } catch (e) { return c.json({ error: String((e as Error).message) }, 502); }
});
adminSite.post('/brands/:brandId/site/resume', async (c) => {
  try { return c.json(await resumeSite(c.req.param('brandId'), c.get('user').uid)); } catch (e) { return c.json({ error: String((e as Error).message) }, 502); }
});
