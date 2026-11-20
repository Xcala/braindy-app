// Client accesses (credentials). Metadata in brands/{id}/accesses (members can list it);
// the encrypted value in accessSecrets/{brandId__accessId} (backend only). Only admin and brand owners
// add, change, reveal or copy. Every action goes to the append-only brands/{id}/accessLog. Brains never call this.
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { brandAccess } from './access.js';
import { open, seal } from './vault.js';
import { looksLikeSecret } from './lib/secrets.js';
import type { AuthEnv } from './auth.js';

const now = () => FieldValue.serverTimestamp();
const REVEAL_SECONDS = 30;
type Action = 'added' | 'updated' | 'deleted' | 'revealed' | 'copied';

async function canHandle(uid: string, brandId: string) {
  const a = await brandAccess(uid, brandId);
  return a.admin || a.sections.includes('accesses');
}

async function actorName(uid: string, email?: string) {
  const u = await db.doc(`users/${uid}`).get();
  return (u.get('name') as string) || email || uid;
}

function log(brandId: string, accessId: string, platform: string, action: Action, by: string, byName: string) {
  return db.collection(`brands/${brandId}/accessLog`).doc().set({ accessId, platform, action, by, byName, at: now() });
}

const clean = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max);
/** A paid plan on the platform (not secret): name, price, currency and how often it is charged. null = not a subscription. */
function subscription(v: unknown) {
  if (!v || typeof v !== 'object') return null;
  const s = v as Record<string, unknown>;
  const price = Number(s.price);
  return {
    plan: clean(s.plan, 80),
    price: Number.isFinite(price) && price >= 0 ? Math.round(price * 100) / 100 : null,
    currency: s.currency === 'COP' || s.currency === 'EUR' ? s.currency : 'USD',
    period: s.period === 'year' || s.period === 'usage' || s.period === 'once' ? s.period : 'month',
  };
}
/** What the app is for, who pays it, when it renews and whether it is in use (shown to the brand, not secret). */
function about(b: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  if (b.purpose !== undefined) out.purpose = clean(b.purpose, 160);
  if (b.payer !== undefined) out.payer = b.payer === 'braindy' || b.payer === 'client' ? b.payer : null;
  if (b.renews !== undefined) out.renews = typeof b.renews === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.renews) ? b.renews : null;
  if (b.status !== undefined) out.status = b.status === 'paused' || b.status === 'cancelled' ? b.status : 'active';
  return out;
}
/** How people sign in: a password kept here, or their Google / Microsoft account. */
const signIn = (v: unknown) => (v === 'google' || v === 'microsoft' ? v : 'password');
const secretRef =(brandId: string, id: string) => db.doc(`accessSecrets/${brandId}__${id}`);
const aad = (brandId: string, id: string) => `brands/${brandId}/accesses/${id}`;

export const accesses = new Hono<AuthEnv>();

accesses.post('/brands/:brandId/accesses', async (c) => {
  const { brandId } = c.req.param();
  const user = c.get('user');
  if (!(await canHandle(user.uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const b = await c.req.json<Record<string, unknown>>();
  const platform = clean(b.platform, 80);
  if (!platform) return c.json({ error: 'platform_required' }, 400);
  // Notes are stored in plain text: keys and passwords go in the encrypted field only.
  if (looksLikeSecret(clean(b.notes, 1000))) return c.json({ error: 'secret_in_notes' }, 400);
  const ref = db.collection(`brands/${brandId}/accesses`).doc();
  const password = String(b.password ?? '');
  const byName = await actorName(user.uid, user.email);
  if (password) {
    const s = await seal(password, aad(brandId, ref.id)).catch(() => null);
    if (!s) return c.json({ error: 'vault_unavailable' }, 503);
    await secretRef(brandId, ref.id).set({ ...s, brandId, accessId: ref.id, updatedAt: now() });
  }
  await ref.set({
    platform, username: clean(b.username), link: clean(b.link, 500), notes: clean(b.notes, 1000),
    hasSecret: !!password, sharedWithBraindy: b.sharedWithBraindy === true, subscription: subscription(b.subscription), signIn: signIn(b.signIn), group: clean(b.group, 40), ...about(b),
    createdBy: user.uid, updatedBy: user.uid, updatedByName: byName, createdAt: now(), updatedAt: now(),
  });
  await log(brandId, ref.id, platform, 'added', user.uid, byName);
  return c.json({ id: ref.id });
});

accesses.patch('/brands/:brandId/accesses/:id', async (c) => {
  const { brandId, id } = c.req.param();
  const user = c.get('user');
  if (!(await canHandle(user.uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const ref = db.doc(`brands/${brandId}/accesses/${id}`);
  const snap = await ref.get();
  if (!snap.exists) return c.json({ error: 'not_found' }, 404);
  const b = await c.req.json<Record<string, unknown>>();
  if (b.notes !== undefined && looksLikeSecret(clean(b.notes, 1000))) return c.json({ error: 'secret_in_notes' }, 400);
  const byName = await actorName(user.uid, user.email);
  const patch: Record<string, unknown> = { updatedBy: user.uid, updatedByName: byName, updatedAt: now() };
  if (b.platform !== undefined) patch.platform = clean(b.platform, 80) || snap.get('platform');
  if (b.username !== undefined) patch.username = clean(b.username);
  if (b.link !== undefined) patch.link = clean(b.link, 500);
  if (b.notes !== undefined) patch.notes = clean(b.notes, 1000);
  if (b.sharedWithBraindy !== undefined) patch.sharedWithBraindy = b.sharedWithBraindy === true;
  if (b.subscription !== undefined) patch.subscription = subscription(b.subscription);
  if (b.signIn !== undefined) patch.signIn = signIn(b.signIn);
  if (b.group !== undefined) patch.group = clean(b.group, 40);
  Object.assign(patch, about(b));
  if (typeof b.password === 'string' && b.password) {
    const s = await seal(b.password, aad(brandId, id)).catch(() => null);
    if (!s) return c.json({ error: 'vault_unavailable' }, 503);
    await secretRef(brandId, id).set({ ...s, brandId, accessId: id, updatedAt: now() });
    patch.hasSecret = true;
  }
  await ref.update(patch);
  await log(brandId, id, String(patch.platform ?? snap.get('platform')), 'updated', user.uid, byName);
  return c.json({ ok: true });
});

/**
 * The order people arranged by dragging: ids top to bottom, and optionally the group each one sits in now.
 * Not logged (nothing secret moves). Ids that are not accesses of this brand are skipped.
 */
accesses.post('/brands/:brandId/accesses-order', async (c) => {
  const { brandId } = c.req.param();
  const user = c.get('user');
  if (!(await canHandle(user.uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const b = await c.req.json<{ ids?: unknown; groups?: Record<string, unknown> }>();
  const ids = (Array.isArray(b.ids) ? b.ids : []).filter((x): x is string => typeof x === 'string' && /^[w-]{1,64}$/.test(x)).slice(0, 500);
  const col = db.collection(`brands/${brandId}/accesses`);
  const snaps = await db.getAll(...ids.map((id) => col.doc(id)));
  const batch = db.batch();
  snaps.forEach((s, i) => {
    if (!s.exists) return;
    const g = b.groups?.[s.id];
    batch.update(s.ref, { order: i, ...(g !== undefined ? { group: clean(g, 40) } : {}) });
  });
  if (ids.length) await batch.commit();
  return c.json({ ok: true });
});

accesses.delete('/brands/:brandId/accesses/:id', async (c) => {
  const { brandId, id } = c.req.param();
  const user = c.get('user');
  if (!(await canHandle(user.uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const ref = db.doc(`brands/${brandId}/accesses/${id}`);
  const snap = await ref.get();
  if (!snap.exists) return c.json({ error: 'not_found' }, 404);
  await db.batch().delete(ref).delete(secretRef(brandId, id)).commit();
  await log(brandId, id, snap.get('platform'), 'deleted', user.uid, await actorName(user.uid, user.email));
  return c.json({ ok: true });
});

accesses.post('/brands/:brandId/accesses/:id/reveal', async (c) => {
  const { brandId, id } = c.req.param();
  const user = c.get('user');
  if (!(await canHandle(user.uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const [meta, secret] = await Promise.all([db.doc(`brands/${brandId}/accesses/${id}`).get(), secretRef(brandId, id).get()]);
  if (!meta.exists || !secret.exists) return c.json({ error: 'not_found' }, 404);
  const value = await open(secret.get('ciphertext'), aad(brandId, id), secret.get('scheme'));
  await Promise.all([
    log(brandId, id, meta.get('platform'), 'revealed', user.uid, await actorName(user.uid, user.email)),
    meta.ref.update({ lastRevealedAt: now(), lastRevealedBy: user.uid }),
  ]);
  c.header('Cache-Control', 'no-store');
  return c.json({ value, seconds: REVEAL_SECONDS });
});

accesses.post('/brands/:brandId/accesses/:id/copied', async (c) => {
  const { brandId, id } = c.req.param();
  const user = c.get('user');
  if (!(await canHandle(user.uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const meta = await db.doc(`brands/${brandId}/accesses/${id}`).get();
  if (!meta.exists) return c.json({ error: 'not_found' }, 404);
  await log(brandId, id, meta.get('platform'), 'copied', user.uid, await actorName(user.uid, user.email));
  return c.json({ ok: true });
});
