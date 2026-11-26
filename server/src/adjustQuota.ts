// Braindy credits for site adjustments, by hosting plan (every brand, not one client), shown like credit apps do:
// Esencial 0, Pro 2,000, Ultra 4,000 a month while the hosting is paid (100 credits ≈ one small adjustment).
// Nicolas can override it per brand in brands/{id}/billing/plan.adjustCredits; packs bought by the client add credits
// to one month (adjustExtra.{YYYY-MM}). Only requests the client creates count (billable: true, set at creation).
// An open one holds 100; when Builder finishes it (braindy_work_step done) it takes its real cost in credits.
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { brandAccess } from './access.js';
import { monthOf } from './usage.js';
import { stripe, toMinor } from './stripe.js';
import type { AuthEnv } from './auth.js';

export const CREDITS_BY_PLAN: Record<string, number> = { esencial: 0, pro: 2000, ultra: 4000 };
/** Credits a small adjustment costs (what an open request holds, and the minimum to ask for one). */
export const PER_ADJUST = 100;
/** One pack: 600 more credits this month (≈ 6 small adjustments). */
export const PACK = { credits: 600, usd: 10, cop: 39900 };
const PUBLIC_BASE = process.env.PUBLIC_BASE_URL ?? 'https://braindy-app-staging.web.app';
const CLOSED = ['approved', 'published'];

export type Quota = {
  plan: string | null; limit: number; extra: number; used: number; held: number; left: number; month: string; resets: string;
  pack: { credits: number; price: number; currency: string }; per: number;
};

/** The brand's quota this month, or null when it has none (no paid hosting plan and no override: no limit). */
export async function quotaOf(brandId: string): Promise<Quota | null> {
  const plan = (await db.doc(`brands/${brandId}/billing/plan`).get()).data() ?? {};
  const paid = ['active', 'past_due'].includes(plan.hostingStatus) || plan.status === 'active';
  const byPlan = plan.hosting && paid ? CREDITS_BY_PLAN[plan.hosting] : undefined;
  const limit = plan.adjustCredits != null && Number.isFinite(Number(plan.adjustCredits)) ? Number(plan.adjustCredits) : byPlan;
  if (limit === undefined || !Number.isFinite(limit)) return null;
  const month = monthOf();
  const extra = Number(plan.adjustExtra?.[month]) || 0;
  const reqs = await db.collection(`brands/${brandId}/requests`).where('billable', '==', true).get();
  let used = 0, held = 0;
  for (const d of reqs.docs) {
    const r = d.data();
    if (typeof r.credits === 'number') { if (r.creditsMonth === month) used += r.credits; continue; }
    if (!r.archived && !CLOSED.includes(r.status)) held += PER_ADJUST;
  }
  const [y, m] = month.split('-').map(Number);
  const resets = new Date(Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1)).toISOString().slice(0, 10);
  const currency = plan.hostingCur === 'cop' ? 'cop' : 'usd';
  return {
    plan: plan.hosting ?? null, limit, extra, used, held, left: Math.max(0, limit + extra - used - held), month, resets,
    pack: { credits: PACK.credits, price: PACK[currency], currency }, per: PER_ADJUST,
  };
}

/** Whether a new request of this category, by this person, counts toward the quota (and fits in it). Admins never count. */
export async function quotaCheck(brandId: string, uid: string, category: string): Promise<{ billable: boolean; full: boolean }> {
  if (category !== 'web' || !uid) return { billable: false, full: false };
  if ((await brandAccess(uid, brandId)).admin) return { billable: false, full: false };
  const q = await quotaOf(brandId);
  return { billable: !!q, full: !!q && q.left < PER_ADJUST };
}

/** Webhook: a paid pack adds its units to the month it was bought for. */
export async function addPack(o: Record<string, any>) {
  const brandId = String(o.metadata?.brandId ?? ''), month = String(o.metadata?.month ?? monthOf());
  const credits = Number(o.metadata?.credits) || PACK.credits;
  if (!brandId) return;
  await Promise.all([
    db.doc(`brands/${brandId}/billing/plan`).set({ adjustExtra: { [month]: FieldValue.increment(credits) } }, { merge: true }),
    db.doc(`brands/${brandId}/invoices/${o.id}`).set({
      concept: `${credits} créditos Braindy · ajustes del sitio (${month})`, amount: (o.amount_total ?? 0) / 100, currency: o.currency,
      status: 'paid', date: new Date((o.created ?? Date.now() / 1000) * 1000), source: 'stripe',
    }, { merge: true }),
    db.collection('audit').doc().set({ type: 'adjust_pack', brandId, month, credits, at: FieldValue.serverTimestamp() }),
  ]);
}

export const adjustQuota = new Hono<AuthEnv>();
adjustQuota.get('/brands/:brandId/adjust-quota', async (c) => {
  const { brandId } = c.req.param();
  const a = await brandAccess(c.get('user').uid, brandId);
  if (!a.member && !a.admin) return c.json({ error: 'forbidden' }, 403);
  return c.json({ quota: await quotaOf(brandId) });
});

/** «Buy more»: Stripe Checkout for one pack (a one-time payment). */
adjustQuota.post('/brands/:brandId/adjust-quota/pack', async (c) => {
  const { brandId } = c.req.param();
  const uid = c.get('user').uid;
  const a = await brandAccess(uid, brandId);
  if (!a.member && !a.admin) return c.json({ error: 'forbidden' }, 403);
  const q = await quotaOf(brandId);
  if (!q) return c.json({ error: 'no_quota' }, 400);
  const { back } = await c.req.json<{ back?: string }>().catch(() => ({ back: '' }));
  const ret = `${PUBLIC_BASE}${typeof back === 'string' && back.startsWith('/') && !back.startsWith('//') ? back : '/home'}`;
  const sep = ret.includes('?') ? '&' : '?';
  const customer = (await db.doc(`brands/${brandId}/billing/plan`).get()).get('stripeCustomerId') as string | undefined;
  const meta = { brandId, kind: 'adjust_pack', month: q.month, credits: String(q.pack.credits), by: uid };
  const s = await stripe<{ url: string }>('POST', 'checkout/sessions', {
    mode: 'payment', ...(customer ? { customer } : {}),
    line_items: [{ quantity: 1, price_data: { currency: q.pack.currency, unit_amount: toMinor(q.pack.price), product_data: { name: `Braindy · ${q.pack.credits} créditos para ajustes del sitio` } } }],
    metadata: meta, payment_intent_data: { metadata: meta },
    success_url: `${ret}${sep}pack=ok`, cancel_url: `${ret}${sep}pack=canceled`,
  });
  return c.json({ url: s.url });
});
