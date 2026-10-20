// Payments and billing (design 20). Nicolas sets each brand's plan; the client pays on Stripe Checkout
// (or by transfer, confirmed by Nicolas); the webhook records invoices. The first payment starts onboarding.
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { brandAccess } from './access.js';
import { stripe, stripeConfigured, toMinor, verifyWebhook } from './stripe.js';
import { notify } from './notify.js';
import type { AuthEnv } from './auth.js';

const PUBLIC_BASE = process.env.PUBLIC_BASE_URL ?? 'https://braindy-app-staging.web.app';
const now = () => FieldValue.serverTimestamp();
const PATHS = ['transform', 'continuity', 'launch'] as const;
type Plan = {
  path?: (typeof PATHS)[number]; monthly?: number; project?: number; currency?: string; addons?: string[]; agentsMonthly?: number;
  status?: 'pending' | 'active' | 'past_due' | 'transfer_review' | 'canceled'; stripeCustomerId?: string; stripeSubscriptionId?: string;
  invoiceDetails?: { company?: string; taxId?: string; email?: string; whatsapp?: string };
};
const planRef = (b: string) => db.doc(`brands/${b}/billing/plan`);
const txt = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max);

async function ownerOrAdmin(uid: string, brandId: string) {
  const a = await brandAccess(uid, brandId);
  return a.admin || a.role === 'client_owner';
}

/** First payment (or confirmed transfer): onboarding starts if it had not. */
async function activate(brandId: string, via: string) {
  const brand = await db.doc(`brands/${brandId}`).get();
  const patch: Record<string, unknown> = {};
  if (!brand.get('onboarding')) patch.onboarding = { step: 'brief', startedAt: now(), startedBy: via };
  await Promise.all([
    planRef(brandId).set({ status: 'active', activatedAt: now() }, { merge: true }),
    Object.keys(patch).length ? brand.ref.set(patch, { merge: true }) : null,
    db.collection('audit').doc().set({ type: 'billing_active', brandId, via, at: now() }),
  ]);
  if (Object.keys(patch).length) await notify(brandId, 'welcome');
}

async function customerFor(brandId: string, plan: Plan) {
  if (plan.stripeCustomerId) return plan.stripeCustomerId;
  const brand = await db.doc(`brands/${brandId}`).get();
  const c = await stripe<{ id: string }>('POST', 'customers', {
    name: plan.invoiceDetails?.company || brand.get('name'), email: plan.invoiceDetails?.email || undefined,
    metadata: { brandId, taxId: plan.invoiceDetails?.taxId || '' },
  });
  await Promise.all([planRef(brandId).set({ stripeCustomerId: c.id }, { merge: true }), db.doc(`stripeCustomers/${c.id}`).set({ brandId })]);
  return c.id;
}

export const billing = new Hono<AuthEnv>();

billing.get('/brands/:brandId/billing', async (c) => {
  const { brandId } = c.req.param();
  if (!(await ownerOrAdmin(c.get('user').uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  return c.json({ stripe: stripeConfigured() });
});

billing.put('/brands/:brandId/billing/details', async (c) => {
  const { brandId } = c.req.param();
  if (!(await ownerOrAdmin(c.get('user').uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const b = await c.req.json<Record<string, unknown>>();
  const invoiceDetails = { company: txt(b.company), taxId: txt(b.taxId, 40), email: txt(b.email), whatsapp: txt(b.whatsapp, 30) };
  await planRef(brandId).set({ invoiceDetails, detailsUpdatedAt: now() }, { merge: true });
  return c.json({ ok: true });
});

/** Stripe Checkout for the plan: monthly subscription, or the project (50% now) and then the subscription. */
export async function createCheckout(brandId: string, option: 'monthly' | 'project', urls: { success: string; cancel: string }) {
  const plan = ((await planRef(brandId).get()).data() ?? {}) as Plan;
  if (!plan.monthly && !plan.project) throw new Error('no_plan');
  const brand = await db.doc(`brands/${brandId}`).get();
  const currency = (plan.currency || 'usd').toLowerCase();
  const customer = await customerFor(brandId, plan);
  const name = `${brand.get('name')} · ${plan.path === 'continuity' ? 'Continuity' : plan.path === 'launch' ? 'Launch' : 'Transform'}`;
  const useProject = option === 'project' ? !!plan.project : !plan.monthly;
  const session = useProject
    ? await stripe<{ url: string }>('POST', 'checkout/sessions', {
      mode: 'payment', customer, success_url: urls.success, cancel_url: urls.cancel, metadata: { brandId, kind: 'project' },
      payment_intent_data: { metadata: { brandId, kind: 'project' } }, invoice_creation: { enabled: true, invoice_data: { metadata: { brandId } } },
      line_items: [{ quantity: 1, price_data: { currency, unit_amount: toMinor(plan.project! * 0.5), product_data: { name: `${name} · 50%` } } }],
    })
    : await stripe<{ url: string }>('POST', 'checkout/sessions', {
      mode: 'subscription', customer, success_url: urls.success, cancel_url: urls.cancel, metadata: { brandId, kind: 'subscription' },
      subscription_data: { metadata: { brandId } },
      line_items: [{ quantity: 1, price_data: { currency, unit_amount: toMinor(plan.monthly!), recurring: { interval: 'month' }, product_data: { name } } }],
    });
  return session.url;
}

/** Plan from the option the prospect signed (amounts entered by Nicolas on the proposal). */
export async function planFromProposal(brandId: string, option: string, amounts: { project?: number | null; monthly?: number | null; currency?: string }, email: string) {
  const path = (PATHS as readonly string[]).includes(option) ? option : 'transform';
  await planRef(brandId).set({
    path, project: Number(amounts.project) || null, monthly: Number(amounts.monthly) || null, currency: (amounts.currency || 'usd').toLowerCase(),
    status: 'pending', invoiceDetails: { email }, updatedAt: now(), updatedBy: 'proposal',
  }, { merge: true });
}

billing.post('/brands/:brandId/billing/checkout', async (c) => {
  const { brandId } = c.req.param();
  if (!(await ownerOrAdmin(c.get('user').uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const { option } = await c.req.json<{ option?: 'monthly' | 'project' }>();
  if (!stripeConfigured()) return c.json({ error: 'stripe_not_configured' }, 503);
  try {
    const url = await createCheckout(brandId, option === 'project' ? 'project' : 'monthly', {
      success: `${PUBLIC_BASE}/pay/success?session={CHECKOUT_SESSION_ID}`, cancel: `${PUBLIC_BASE}/pay?state=canceled`,
    });
    return c.json({ url });
  } catch (e) {
    return c.json({ error: String((e as Error).message) }, String(e).includes('no_plan') ? 400 : 502);
  }
});

billing.post('/brands/:brandId/billing/portal', async (c) => {
  const { brandId } = c.req.param();
  if (!(await ownerOrAdmin(c.get('user').uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const plan = ((await planRef(brandId).get()).data() ?? {}) as Plan;
  if (!stripeConfigured() || !plan.stripeCustomerId) return c.json({ error: 'no_customer' }, 400);
  const s = await stripe<{ url: string }>('POST', 'billing_portal/sessions', { customer: plan.stripeCustomerId, return_url: `${PUBLIC_BASE}/settings?tab=billing` });
  return c.json({ url: s.url });
});

billing.post('/brands/:brandId/billing/transfer', async (c) => {
  const { brandId } = c.req.param();
  const uid = c.get('user').uid;
  if (!(await ownerOrAdmin(uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const b = await c.req.json<{ reference?: string; amount?: number }>();
  if (!txt(b.reference)) return c.json({ error: 'reference_required' }, 400);
  await db.collection(`brands/${brandId}/transfers`).doc().set({ reference: txt(b.reference, 300), amount: Number(b.amount) || null, status: 'review', by: uid, at: now() });
  await planRef(brandId).set({ status: 'transfer_review' }, { merge: true });
  return c.json({ ok: true });
});

/** Add AI Agents (design 20): a new subscription item, prorated and charged today. Without Stripe, a request for Nicolas. */
billing.post('/brands/:brandId/billing/addon', async (c) => {
  const { brandId } = c.req.param();
  const uid = c.get('user').uid;
  if (!(await ownerOrAdmin(uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const plan = ((await planRef(brandId).get()).data() ?? {}) as Plan;
  if ((plan.addons ?? []).includes('agents')) return c.json({ ok: true, already: true });
  if (!plan.agentsMonthly || !stripeConfigured() || !plan.stripeSubscriptionId) {
    await planRef(brandId).set({ addonRequests: FieldValue.arrayUnion('agents'), addonRequestedAt: now() }, { merge: true });
    await db.collection('audit').doc().set({ type: 'addon_requested', brandId, addon: 'agents', by: uid, at: now() });
    return c.json({ ok: true, requested: true });
  }
  const brand = await db.doc(`brands/${brandId}`).get();
  const product = await stripe<{ id: string }>('POST', 'products', { name: `${brand.get('name')} · AI Agents`, metadata: { brandId } });
  await stripe('POST', 'subscription_items', {
    subscription: plan.stripeSubscriptionId, quantity: 1, proration_behavior: 'always_invoice',
    price_data: { currency: (plan.currency || 'usd').toLowerCase(), unit_amount: toMinor(plan.agentsMonthly), recurring: { interval: 'month' }, product: product.id },
  });
  await planRef(brandId).set({ addons: FieldValue.arrayUnion('agents'), updatedAt: now() }, { merge: true });
  return c.json({ ok: true, added: true });
});

billing.post('/brands/:brandId/billing/cancel-request', async (c) => {
  const { brandId } = c.req.param();
  const uid = c.get('user').uid;
  if (!(await ownerOrAdmin(uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  await planRef(brandId).set({ cancelRequestedAt: now(), cancelRequestedBy: uid }, { merge: true });
  await db.collection('audit').doc().set({ type: 'cancel_requested', brandId, by: uid, at: now() });
  return c.json({ ok: true });
});

// ---------- admin ----------
export const adminBilling = new Hono<AuthEnv>();
adminBilling.use('/brands/:brandId/billing/*', async (c, next) => {
  if (!(await brandAccess(c.get('user').uid, c.req.param('brandId')!)).admin) return c.json({ error: 'forbidden' }, 403);
  await next();
});

adminBilling.put('/brands/:brandId/billing/plan', async (c) => {
  const { brandId } = c.req.param();
  const b = await c.req.json<Plan>();
  if (!PATHS.includes(b.path as (typeof PATHS)[number])) return c.json({ error: 'invalid_path' }, 400);
  await planRef(brandId).set({
    path: b.path, monthly: Number(b.monthly) || null, project: Number(b.project) || null, currency: txt(b.currency, 3).toLowerCase() || 'usd',
    addons: (b.addons ?? []).map((x) => txt(x, 40)).slice(0, 10), agentsMonthly: Number(b.agentsMonthly) || null, status: (await planRef(brandId).get()).get('status') ?? 'pending',
    updatedBy: c.get('user').uid, updatedAt: now(),
  }, { merge: true });
  return c.json({ ok: true });
});

adminBilling.post('/brands/:brandId/billing/transfers/:id/confirm', async (c) => {
  const { brandId, id } = c.req.param();
  const ref = db.doc(`brands/${brandId}/transfers/${id}`);
  const t = await ref.get();
  if (!t.exists) return c.json({ error: 'not_found' }, 404);
  await ref.update({ status: 'confirmed', confirmedBy: c.get('user').uid, confirmedAt: now() });
  await db.collection(`brands/${brandId}/invoices`).doc(`transfer-${id}`).set({
    concept: 'Transfer', amount: t.get('amount') ?? null, currency: ((await planRef(brandId).get()).get('currency') as string) ?? 'usd',
    status: 'paid', date: now(), source: 'transfer', reference: t.get('reference'),
  });
  await activate(brandId, 'transfer');
  return c.json({ ok: true });
});

// ---------- webhook (public, signed) ----------
export const stripeWebhook = new Hono();

async function brandOfCustomer(customer?: string | null) {
  if (!customer) return null;
  return ((await db.doc(`stripeCustomers/${customer}`).get()).get('brandId') as string) ?? null;
}

stripeWebhook.post('/stripe', async (c) => {
  const raw = await c.req.text();
  if (!verifyWebhook(raw, c.req.header('stripe-signature'))) return c.json({ error: 'bad_signature' }, 400);
  const evt = JSON.parse(raw) as { id: string; type: string; data: { object: Record<string, any> } };
  const seen = db.doc(`stripeEvents/${evt.id}`);
  if ((await seen.get()).exists) return c.json({ ok: true, duplicate: true });
  const o = evt.data.object;
  const brandId = (o.metadata?.brandId as string) || (await brandOfCustomer(o.customer));
  if (brandId) {
    if (evt.type === 'checkout.session.completed' && o.payment_status === 'paid') {
      if (o.subscription) await planRef(brandId).set({ stripeSubscriptionId: o.subscription }, { merge: true });
      if (o.customer) await Promise.all([planRef(brandId).set({ stripeCustomerId: o.customer }, { merge: true }), db.doc(`stripeCustomers/${o.customer}`).set({ brandId })]);
      await activate(brandId, 'stripe');
    }
    if (evt.type === 'invoice.paid' || evt.type === 'invoice.payment_failed') {
      await db.doc(`brands/${brandId}/invoices/${o.id}`).set({
        concept: o.lines?.data?.[0]?.description ?? 'Braindy', amount: (o.amount_paid || o.amount_due || 0) / 100, currency: o.currency,
        status: evt.type === 'invoice.paid' ? 'paid' : 'failed', date: new Date((o.created ?? Date.now() / 1000) * 1000),
        pdfUrl: o.invoice_pdf ?? null, hostedUrl: o.hosted_invoice_url ?? null, source: 'stripe',
      }, { merge: true });
      await planRef(brandId).set({ status: evt.type === 'invoice.paid' ? 'active' : 'past_due', ...(o.period_end ? { nextChargeAt: new Date(o.period_end * 1000) } : {}) }, { merge: true });
    }
    if (evt.type === 'customer.subscription.updated' || evt.type === 'customer.subscription.deleted') {
      await planRef(brandId).set({
        status: evt.type === 'customer.subscription.deleted' ? 'canceled' : o.status === 'past_due' ? 'past_due' : 'active',
        ...(o.current_period_end ? { nextChargeAt: new Date(o.current_period_end * 1000) } : {}),
      }, { merge: true });
    }
  }
  await seen.set({ type: evt.type, brandId: brandId ?? null, at: now() });
  return c.json({ ok: true });
});
