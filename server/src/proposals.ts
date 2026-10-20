// Proposals: admin actions (send, convert, files) and the public, login-free side (view, track, accept).
// Prospects never touch Firestore: every public read and every tracking event goes through here.
import { randomBytes, randomUUID } from 'node:crypto';
import { Hono, type MiddlewareHandler } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { db } from './firebase.js';
import type { AuthEnv } from './auth.js';

const BUCKET = process.env.FILES_BUCKET ?? 'braindy-app-files';
const PUBLIC_BASE = process.env.PUBLIC_BASE_URL ?? 'https://braindy-app-staging.web.app';
const URL_TTL_MS = 15 * 60 * 1000;
const bucket = () => getStorage().bucket(BUCKET);
const token = () => randomBytes(9).toString('base64url');
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Fields of a proposal that the public page may show. Internal notes never leave the server. */
const PUBLIC_FIELDS = ['title', 'prospect', 'lang', 'validUntil', 'preparedOn', 'fromA', 'toB', 'options', 'recommended', 'status'] as const;

// ---------- admin ----------
export const adminProposals = new Hono<AuthEnv>();

const requireAdmin: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const u = await db.doc(`users/${c.get('user').uid}`).get();
  if (u.get('role') !== 'admin') return c.json({ error: 'forbidden' }, 403);
  await next();
};
adminProposals.use('*', requireAdmin);

/** Creates a send with its own tracked link. WhatsApp returns a wa.me link with the message ready. */
adminProposals.post('/proposals/:id/sends', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{ channel?: string; to?: string; message?: string }>();
  const channel = ['link', 'whatsapp', 'email'].includes(String(body.channel)) ? String(body.channel) : 'link';
  if (channel === 'email') return c.json({ error: 'email_not_configured' }, 501);
  const ref = db.doc(`proposals/${id}`);
  const p = await ref.get();
  if (!p.exists) return c.json({ error: 'not_found' }, 404);

  const t = token();
  const sendRef = ref.collection('sends').doc();
  const to = String(body.to ?? '').slice(0, 120);
  const now = FieldValue.serverTimestamp();
  await db.batch()
    .set(sendRef, { channel, to, token: t, createdAt: now, createdBy: c.get('user').uid, opens: 0, seconds: 0, maxSection: 0, firstOpenAt: null, lastOpenAt: null })
    .set(db.doc(`proposalLinks/${t}`), { proposalId: id, sendId: sendRef.id, createdAt: now })
    .update(ref, {
      ...(p.get('status') === 'draft' ? { status: 'sent', sentAt: now } : {}),
      lastActivity: { type: 'sent', channel, to, at: now },
    })
    .commit();

  const url = `${PUBLIC_BASE}/p/${t}`;
  const text = `${String(body.message ?? '').trim()}\n\n${url}`.trim();
  const whatsapp = channel === 'whatsapp' ? `https://wa.me/${to.replace(/\D/g, '')}?text=${encodeURIComponent(text)}` : null;
  return c.json({ sendId: sendRef.id, url, whatsapp });
});

/** Won → create client: a new brand that remembers the proposal it came from. */
adminProposals.post('/proposals/:id/convert', async (c) => {
  const { id } = c.req.param();
  const ref = db.doc(`proposals/${id}`);
  const p = await ref.get();
  if (!p.exists) return c.json({ error: 'not_found' }, 404);
  if (p.get('convertedBrandId')) return c.json({ brandId: p.get('convertedBrandId') });

  const name = String(p.get('prospect.company') || p.get('prospect.name') || p.get('title') || 'New brand').trim();
  let brandId = slug(name) || `brand-${id.slice(0, 6)}`;
  for (let i = 2; (await db.doc(`brands/${brandId}`).get()).exists; i++) brandId = `${slug(name)}-${i}`;
  const now = FieldValue.serverTimestamp();
  await db.batch()
    .set(db.doc(`brands/${brandId}`), {
      name, slug: brandId, kind: 'brand', groupId: null, ancestors: [], status: 'active', logoUrl: null,
      legacyIds: { brands: [], orbit: [], brandingProjects: [], briefEmails: [] }, fromProposal: id, createdAt: now,
    })
    .update(ref, { status: 'won', convertedBrandId: brandId, wonAt: now, lastActivity: { type: 'converted', at: now } })
    .commit();
  return c.json({ brandId });
});

/** Signed upload URL for a proposal file (PDF, deck, page). */
adminProposals.post('/proposals/:id/uploads', async (c) => {
  const { id } = c.req.param();
  const b = await c.req.json<{ fileName?: string; contentType?: string; size?: number }>();
  const fileName = String(b.fileName ?? '').replace(/[\\/\r\n]/g, '_').slice(0, 200);
  if (!fileName || !(Number(b.size) > 0) || Number(b.size) > 500 * 1024 ** 2) return c.json({ error: 'invalid' }, 400);
  const fileId = randomUUID();
  const storagePath = `proposals/${id}/${fileId}/${fileName}`;
  const contentType = String(b.contentType || 'application/octet-stream').slice(0, 120);
  await db.doc(`proposals/${id}/files/${fileId}`).set({
    title: fileName, storagePath, contentType, size: Number(b.size), status: 'uploading', createdAt: FieldValue.serverTimestamp(),
  });
  const [url] = await bucket().file(storagePath).getSignedUrl({ version: 'v4', action: 'write', expires: Date.now() + URL_TTL_MS, contentType });
  return c.json({ fileId, url, contentType });
});

adminProposals.post('/proposals/:id/uploads/:fileId/complete', async (c) => {
  const { id, fileId } = c.req.param();
  const ref = db.doc(`proposals/${id}/files/${fileId}`);
  const f = await ref.get();
  if (!f.exists) return c.json({ error: 'not_found' }, 404);
  const [exists] = await bucket().file(f.get('storagePath')).exists();
  if (!exists) return c.json({ error: 'upload_missing' }, 409);
  await ref.update({ status: 'ready' });
  return c.json({ ok: true });
});

adminProposals.get('/proposals/:id/files/:fileId/url', async (c) => {
  const { id, fileId } = c.req.param();
  const f = await db.doc(`proposals/${id}/files/${fileId}`).get();
  if (!f.exists) return c.json({ error: 'not_found' }, 404);
  const [url] = await bucket().file(f.get('storagePath')).getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + URL_TTL_MS });
  return c.json({ url });
});

// ---------- public (no login) ----------
export const publicProposals = new Hono();

async function resolve(t: string) {
  if (!/^[A-Za-z0-9_-]{8,32}$/.test(t)) return null;
  const link = await db.doc(`proposalLinks/${t}`).get();
  if (!link.exists) return null;
  const proposalRef = db.doc(`proposals/${link.get('proposalId')}`);
  const sendRef = proposalRef.collection('sends').doc(link.get('sendId'));
  return { proposalRef, sendRef };
}

/** The public page. Each call is one open: recorded on the send and on the proposal. */
publicProposals.get('/p/:token', async (c) => {
  const r = await resolve(c.req.param('token'));
  if (!r) return c.json({ error: 'not_found' }, 404);
  const p = await r.proposalRef.get();
  if (!p.exists || p.get('status') === 'draft') return c.json({ error: 'not_found' }, 404);

  const sessionId = randomUUID();
  const now = FieldValue.serverTimestamp();
  const send = await r.sendRef.get();
  const ua = c.req.header('user-agent') ?? '';
  const device = /mobile|android|iphone/i.test(ua) ? 'mobile' : /ipad|tablet/i.test(ua) ? 'tablet' : 'desktop';
  await db.batch()
    .set(r.sendRef.collection('events').doc(sessionId), { type: 'open', at: now, seconds: 0, maxSection: 0, device })
    .update(r.sendRef, { opens: FieldValue.increment(1), lastOpenAt: now, ...(send.get('firstOpenAt') ? {} : { firstOpenAt: now }) })
    .update(r.proposalRef, { lastActivity: { type: (send.get('opens') ?? 0) > 0 ? 'reopened' : 'opened', at: now, channel: send.get('channel'), to: send.get('to') } })
    .commit();

  const files = (await r.proposalRef.collection('files').where('status', '==', 'ready').get())
    .docs.map((d) => ({ id: d.id, title: d.get('title'), contentType: d.get('contentType'), size: d.get('size') }));
  const data = Object.fromEntries(PUBLIC_FIELDS.map((k) => [k, p.get(k) ?? null]));
  return c.json({ ...data, files, sessionId });
});

/** Reading time: the page reports every ~15 s while visible, plus the furthest section reached. */
publicProposals.post('/p/:token/ping', async (c) => {
  const r = await resolve(c.req.param('token'));
  if (!r) return c.json({ error: 'not_found' }, 404);
  const b = await c.req.json<{ sessionId?: string; seconds?: number; section?: number }>().catch(() => ({} as Record<string, never>));
  const seconds = Math.max(0, Math.min(30, Math.round(Number(b.seconds) || 0)));
  const section = Math.max(0, Math.min(10, Math.round(Number(b.section) || 0)));
  if (!b.sessionId || !/^[0-9a-f-]{36}$/.test(b.sessionId)) return c.json({ error: 'invalid' }, 400);
  const ev = r.sendRef.collection('events').doc(b.sessionId);
  const snap = await ev.get();
  if (!snap.exists) return c.json({ error: 'invalid' }, 400);
  await db.batch()
    .update(ev, { seconds: FieldValue.increment(seconds), maxSection: Math.max(section, snap.get('maxSection') ?? 0) })
    .update(r.sendRef, { seconds: FieldValue.increment(seconds), maxSection: Math.max(section, (await r.sendRef.get()).get('maxSection') ?? 0) })
    .commit();
  return c.json({ ok: true });
});

/** Accept and sign (typed signature). Marks the proposal as won; payment comes next (Stripe). */
publicProposals.post('/p/:token/accept', async (c) => {
  const r = await resolve(c.req.param('token'));
  if (!r) return c.json({ error: 'not_found' }, 404);
  const b = await c.req.json<{ name?: string; role?: string; accepted?: boolean; option?: string }>();
  const name = String(b.name ?? '').trim().slice(0, 120);
  if (!name || b.accepted !== true) return c.json({ error: 'invalid' }, 400);
  const now = FieldValue.serverTimestamp();
  await db.batch()
    .update(r.proposalRef, {
      status: 'won', wonAt: now,
      acceptance: { name, role: String(b.role ?? '').slice(0, 160), option: String(b.option ?? '').slice(0, 40), sendId: r.sendRef.id, at: now },
      lastActivity: { type: 'accepted', at: now, name },
    })
    .set(r.sendRef.collection('events').doc(), { type: 'accepted', at: now, name })
    .commit();
  return c.json({ ok: true });
});

publicProposals.get('/p/:token/files/:fileId', async (c) => {
  const r = await resolve(c.req.param('token'));
  if (!r) return c.json({ error: 'not_found' }, 404);
  const f = await r.proposalRef.collection('files').doc(c.req.param('fileId')).get();
  if (!f.exists || f.get('status') !== 'ready') return c.json({ error: 'not_found' }, 404);
  const [url] = await bucket().file(f.get('storagePath')).getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + URL_TTL_MS });
  return c.json({ url });
});
