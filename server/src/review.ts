// Review by link (design 31): approve from WhatsApp without logging in. One token per delivery and person,
// valid 7 days, one decision. It can approve or request changes, nothing else. Plus the per-brand notice
// settings (WhatsApp number, which approver it belongs to, which notices go out).
import { randomBytes } from 'node:crypto';
import { Hono } from 'hono';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { brandAccess } from './access.js';
import { URL_TTL_MS, bucket, canApprove, decide } from './requests.js';
import { normalizePhone, sendTemplate, waMeLink, whatsappConfigured } from './whatsapp.js';
import type { AuthEnv } from './auth.js';

const PUBLIC_BASE = process.env.PUBLIC_BASE_URL ?? 'https://braindy-app-staging.web.app';
const LINK_DAYS = 7;
const now = () => FieldValue.serverTimestamp();
const BRAINS: Record<string, string> = { researcher: 'Researcher', marketer: 'Marketer', creator: 'Creator', builder: 'Builder' };
const NOTICES = ['delivery', 'approved', 'brandBrain', 'report'] as const;

type Notices = { whatsapp?: string; approverUid?: string; lang?: 'es' | 'en'; notices?: Partial<Record<(typeof NOTICES)[number], boolean>> };
const settingsRef = (brandId: string) => db.doc(`brands/${brandId}/settings/notices`);

/** Creates a review link and sends it (WhatsApp API) or returns a wa.me link to send by hand. */
export async function notifyDelivery(brandId: string, requestId: string, versionId: string, by: string, force = false) {
  const s = ((await settingsRef(brandId).get()).data() ?? {}) as Notices;
  const phone = s.whatsapp ? normalizePhone(s.whatsapp) : null;
  if (!phone || !s.approverUid) return { status: 'no_number' as const };
  if (!force && s.notices?.delivery === false) return { status: 'off' as const };

  const [brand, req] = await Promise.all([db.doc(`brands/${brandId}`).get(), db.doc(`brands/${brandId}/requests/${requestId}`).get()]);
  const token = randomBytes(24).toString('base64url');
  await db.doc(`reviewLinks/${token}`).set({
    brandId, requestId, versionId, approverUid: s.approverUid, phoneLast4: phone.slice(-4),
    expiresAt: Timestamp.fromMillis(Date.now() + LINK_DAYS * 864e5), createdBy: by, createdAt: now(), usedAt: null,
  });
  const url = `${PUBLIC_BASE}/r/${token}`;
  const title = String(req.get('title') ?? '');
  const brain = BRAINS[String(req.get('leadBrain'))] ?? 'Braindy';
  const lang = s.lang ?? 'es';
  const text = lang === 'es'
    ? `${brand.get('name')}: ${brain} entregó "${title}". Revísalo y apruébalo aquí (sin iniciar sesión, válido ${LINK_DAYS} días): ${url}`
    : `${brand.get('name')}: ${brain} delivered "${title}". Review and approve it here (no login, valid ${LINK_DAYS} days): ${url}`;
  const sent = await sendTemplate(phone, 'delivery_ready', lang, [String(brand.get('name')), brain, title], token);
  await db.collection('audit').doc().set({ type: 'review_link', brandId, requestId, versionId, sent: sent.sent, by, at: now() });
  return { status: sent.sent ? 'sent' as const : 'manual' as const, url, waUrl: sent.sent ? null : waMeLink(phone, text) };
}

// ---------- signed-in: settings and manual sends ----------
export const review = new Hono<AuthEnv>();

review.get('/brands/:brandId/settings/notices', async (c) => {
  const { brandId } = c.req.param();
  if (!(await brandAccess(c.get('user').uid, brandId)).member) return c.json({ error: 'forbidden' }, 403);
  return c.json({ ...(((await settingsRef(brandId).get()).data() ?? {}) as Notices), whatsappApi: whatsappConfigured() });
});

review.put('/brands/:brandId/settings/notices', async (c) => {
  const { brandId } = c.req.param();
  const uid = c.get('user').uid;
  const a = await brandAccess(uid, brandId);
  if (!a.admin && a.role !== 'client_owner') return c.json({ error: 'forbidden' }, 403);
  const b = await c.req.json<Notices>();
  const whatsapp = b.whatsapp ? normalizePhone(b.whatsapp) : '';
  if (b.whatsapp && !whatsapp) return c.json({ error: 'invalid_phone' }, 400);
  if (b.approverUid && !(await canApprove(String(b.approverUid), brandId))) return c.json({ error: 'not_an_approver' }, 400);
  const notices = Object.fromEntries(NOTICES.map((k) => [k, b.notices?.[k] !== false]));
  await settingsRef(brandId).set({
    whatsapp: whatsapp ?? '', approverUid: String(b.approverUid ?? '').slice(0, 128), lang: b.lang === 'en' ? 'en' : 'es',
    notices, updatedBy: uid, updatedAt: now(),
  }, { merge: true });
  return c.json({ ok: true });
});

export const adminReview = new Hono<AuthEnv>();
adminReview.post('/brands/:brandId/requests/:requestId/versions/:versionId/review-link', async (c) => {
  const { brandId, requestId, versionId } = c.req.param();
  if (!(await brandAccess(c.get('user').uid, brandId)).admin) return c.json({ error: 'forbidden' }, 403);
  return c.json(await notifyDelivery(brandId, requestId, versionId, c.get('user').uid, true));
});

// ---------- public: the link itself ----------
export const publicReview = new Hono();

async function load(token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const link = await db.doc(`reviewLinks/${token}`).get();
  if (!link.exists) return null;
  if ((link.get('expiresAt') as Timestamp).toMillis() < Date.now()) return { link, expired: true };
  return { link, expired: false };
}

publicReview.get('/r/:token', async (c) => {
  const l = await load(c.req.param('token'));
  if (!l) return c.json({ error: 'not_found' }, 404);
  if (l.expired) return c.json({ error: 'expired' }, 410);
  const { brandId, requestId, versionId } = l.link.data() as { brandId: string; requestId: string; versionId: string };
  const [brand, req, ver] = await Promise.all([
    db.doc(`brands/${brandId}`).get(), db.doc(`brands/${brandId}/requests/${requestId}`).get(),
    db.doc(`brands/${brandId}/requests/${requestId}/versions/${versionId}`).get(),
  ]);
  if (!ver.exists || ver.get('published') !== true) return c.json({ error: 'not_found' }, 404);
  const files = await Promise.all(((ver.get('files') as Array<{ name: string; contentType: string; storagePath?: string; url?: string }>) ?? []).map(async (f) => ({
    name: f.name, contentType: f.contentType,
    url: f.url ?? (f.storagePath ? (await bucket().file(f.storagePath).getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + URL_TTL_MS }))[0] : null),
  })));
  c.header('Cache-Control', 'no-store');
  return c.json({
    brand: { name: brand.get('name'), logoUrl: brand.get('logoUrl') ?? null },
    request: { title: req.get('title'), leadBrain: req.get('leadBrain'), approvalLevel: req.get('approvalLevel') },
    version: { n: ver.get('n'), notes: ver.get('notes') ?? '', reason: ver.get('reason') ?? '', brain: ver.get('brain') ?? null, files, approval: ver.get('approval') ?? null },
    used: !!l.link.get('usedAt'), expiresAt: (l.link.get('expiresAt') as Timestamp).toDate().toISOString(),
  });
});

publicReview.post('/r/:token/decision', async (c) => {
  const token = c.req.param('token');
  const l = await load(token);
  if (!l) return c.json({ error: 'not_found' }, 404);
  if (l.expired) return c.json({ error: 'expired' }, 410);
  const b = await c.req.json<{ state?: string; note?: string }>().catch(() => ({} as { state?: string; note?: string }));
  const state = b.state === 'approved' ? 'approved' : b.state === 'changes_requested' ? 'changes_requested' : '';
  if (!state) return c.json({ error: 'invalid' }, 400);
  // One decision per link: claim it in a transaction so a double tap cannot decide twice.
  const claimed = await db.runTransaction(async (tx) => {
    const snap = await tx.get(l.link.ref);
    if (snap.get('usedAt')) return false;
    tx.update(l.link.ref, { usedAt: now(), decision: state });
    return true;
  });
  if (!claimed) return c.json({ error: 'used' }, 409);
  const { brandId, requestId, versionId, approverUid } = l.link.data() as Record<string, string>;
  // The person may have lost approval rights since the link was sent.
  if (!(await canApprove(approverUid, brandId))) {
    await l.link.ref.update({ usedAt: null, decision: null });
    return c.json({ error: 'forbidden' }, 403);
  }
  const r = await decide(brandId, requestId, versionId, approverUid, state, String(b.note ?? '').trim().slice(0, 4000));
  if (r !== 'ok') {
    await l.link.ref.update({ usedAt: null, decision: null });
    return c.json({ error: r }, r === 'not_found' ? 404 : 400);
  }
  await db.collection('audit').doc().set({ type: 'review_link_decision', brandId, requestId, versionId, state, by: approverUid, at: now() });
  return c.json({ ok: true });
});
