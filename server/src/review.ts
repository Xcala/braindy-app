// Review by link (design 31): approve from WhatsApp without logging in. One token per delivery and person,
// valid 7 days, one decision. It can approve or request changes, nothing else. Plus the per-brand notice
// settings (WhatsApp number, which approver it belongs to, which notices go out).
import { createHash, randomBytes } from 'node:crypto';
import { Hono } from 'hono';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { brandAccess } from './access.js';
import { URL_TTL_MS, bucket, canApprove, decide } from './requests.js';
import { normalizePhone, waMeLink, whatsappConfigured } from './whatsapp.js';
import { sendDeliveryNotice } from './wa/notices.js';
import { contactRef, linkPhone, waAllowed } from './wa/contacts.js';
import type { AuthEnv } from './auth.js';

const PUBLIC_BASE = process.env.PUBLIC_BASE_URL ?? 'https://braindy-app-staging.web.app';
const LINK_DAYS = 7;
const now = () => FieldValue.serverTimestamp();
const NOTICES = ['delivery', 'approved', 'published', 'brandBrain', 'report'] as const;

type Notices = { whatsapp?: string; groupLink?: string; groups?: Array<{ name?: string; url?: string }>; approverUid?: string; lang?: 'es' | 'en'; notices?: Partial<Record<(typeof NOTICES)[number], boolean>> };
const settingsRef = (brandId: string) => db.doc(`brands/${brandId}/settings/notices`);

/** The requester's own number, when they linked one with consent and may approve for the brand. */
async function deliveryTarget(uid: string, brandId: string) {
  if (!uid) return null;
  const wa = (await db.doc(`users/${uid}`).get()).get('whatsapp') as { phone?: string; optIn?: boolean } | undefined;
  const phone = wa?.optIn && wa.phone ? normalizePhone(wa.phone) : null;
  return phone && (await canApprove(uid, brandId)) && (await waAllowed(uid, brandId)) ? { uid, phone } : null;
}

/** Creates a review link and sends it (WhatsApp API) or returns a wa.me link to send by hand. */
export async function notifyDelivery(brandId: string, requestId: string, versionId: string, by: string, force = false) {
  const s = ((await settingsRef(brandId).get()).data() ?? {}) as Notices;
  if (!force && s.notices?.delivery === false) return { status: 'off' as const };
  const [brand, req] = await Promise.all([db.doc(`brands/${brandId}`).get(), db.doc(`brands/${brandId}/requests/${requestId}`).get()]);
  // The person who asked gets it on their own WhatsApp when they can approve; otherwise the brand's notice number.
  const asker = await deliveryTarget(String(req.get('createdBy') ?? ''), brandId);
  const phone = asker?.phone ?? (s.whatsapp ? normalizePhone(s.whatsapp) : null);
  const approverUid = asker?.uid ?? s.approverUid;
  if (!phone || !approverUid) return { status: 'no_number' as const };

  const token = randomBytes(24).toString('base64url');
  await db.doc(`reviewLinks/${token}`).set({
    brandId, requestId, versionId, approverUid, phoneLast4: phone.slice(-4), phoneHash: phoneHash(phone),
    expiresAt: Timestamp.fromMillis(Date.now() + LINK_DAYS * 864e5), createdBy: by, createdAt: now(), usedAt: null,
  });
  const url = `${PUBLIC_BASE}/r/${token}`;
  const title = String(req.get('title') ?? '');
  const lang = s.lang ?? 'es';
  const text = lang === 'es'
    ? `${brand.get('name')}: NicoMarca te envía "${title}" para revisar. Apruébalo aquí (sin iniciar sesión, válido ${LINK_DAYS} días): ${url}`
    : `${brand.get('name')}: NickMark sends you "${title}" to review. Approve it here (no login, valid ${LINK_DAYS} days): ${url}`;
  // The delivery is signed by NickMark (EN) / NicoMarca (ES): the person, with his team. With Approve / Ask for
  // changes buttons: free buttons inside the 24 h window, the approved template outside it.
  const sent = await sendDeliveryNotice(phone, lang, { brand: String(brand.get('name')), title, url, token });
  if (sent.sent && sent.messageId) await db.doc(`waOutbound/${sent.messageId}`).set({ kind: 'delivery', brandId, requestId, versionId, token, at: now() });
  await db.collection('audit').doc().set({ type: 'review_link', brandId, requestId, versionId, sent: sent.sent, by, at: now() });
  return { status: sent.sent ? 'sent' as const : 'manual' as const, url, waUrl: sent.sent ? null : waMeLink(phone, text) };
}

// ---------- signed-in: settings and manual sends ----------
export const review = new Hono<AuthEnv>();

review.get('/brands/:brandId/settings/notices', async (c) => {
  const { brandId } = c.req.param();
  if (!(await brandAccess(c.get('user').uid, brandId)).member) return c.json({ error: 'forbidden' }, 403);
  const s = ((await settingsRef(brandId).get()).data() ?? {}) as Notices;
  // Brands saved with the first single-group field read as a list of one.
  const groups = s.groups ?? (s.groupLink ? [{ name: '', url: s.groupLink }] : []);
  return c.json({ ...s, groupLink: undefined, groups, whatsappApi: whatsappConfigured() });
});

review.put('/brands/:brandId/settings/notices', async (c) => {
  const { brandId } = c.req.param();
  const uid = c.get('user').uid;
  const a = await brandAccess(uid, brandId);
  if (!a.admin && a.role !== 'client_owner') return c.json({ error: 'forbidden' }, 403);
  const b = await c.req.json<Notices>();
  const whatsapp = b.whatsapp ? normalizePhone(b.whatsapp) : '';
  if (b.whatsapp && !whatsapp) return c.json({ error: 'invalid_phone' }, 400);
  // The WhatsApp groups NickMark keeps with the client (e.g. Marketing, Web): only invite links of WhatsApp itself.
  const groups = (Array.isArray(b.groups) ? b.groups : []).slice(0, 10)
    .map((g) => ({ name: String(g?.name ?? '').trim().slice(0, 60), url: String(g?.url ?? '').trim() })).filter((g) => g.url);
  if (groups.some((g) => !/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{10,40}$/.test(g.url))) return c.json({ error: 'invalid_group' }, 400);
  if (b.approverUid && !(await canApprove(String(b.approverUid), brandId))) return c.json({ error: 'not_an_approver' }, 400);
  const notices = Object.fromEntries(NOTICES.map((k) => [k, b.notices?.[k] !== false]));
  await settingsRef(brandId).set({
    whatsapp: whatsapp ?? '', groups, groupLink: FieldValue.delete(), approverUid: String(b.approverUid ?? '').slice(0, 128), lang: b.lang === 'en' ? 'en' : 'es',
    notices, updatedBy: uid, updatedAt: now(),
  }, { merge: true });
  // The notice number belongs to the approver: link it so their WhatsApp replies land in this brand,
  // unless someone already registered that number as their own.
  if (whatsapp && b.approverUid) {
    const taken = (await contactRef(whatsapp).get()).get('uid') as string | null | undefined;
    if (!taken) await linkPhone(whatsapp, String(b.approverUid), 'settings');
  }
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

export const phoneHash = (phone: string) => createHash('sha256').update(`wa:${phone}`).digest('hex');
const STATUS: Record<string, number> = { not_found: 404, expired: 410, used: 409, forbidden: 403, wrong_phone: 403 };

/** One decision per link (web page or WhatsApp button). From WhatsApp, only the number the link was sent to. */
export async function decideWithLink(token: string, rawState: string, note: string, fromPhone?: string) {
  const l = await load(token);
  if (!l) return 'not_found';
  if (l.expired) return 'expired';
  const state = rawState === 'approved' ? 'approved' : rawState === 'changes_requested' ? 'changes_requested' : '';
  if (!state) return 'invalid';
  if (fromPhone && l.link.get('phoneHash') !== phoneHash(fromPhone)) return 'wrong_phone';
  // Claim it in a transaction so a double tap cannot decide twice.
  const claimed = await db.runTransaction(async (tx) => {
    const snap = await tx.get(l.link.ref);
    if (snap.get('usedAt')) return false;
    tx.update(l.link.ref, { usedAt: now(), decision: state });
    return true;
  });
  if (!claimed) return 'used';
  const { brandId, requestId, versionId, approverUid } = l.link.data() as Record<string, string>;
  // The person may have lost approval rights since the link was sent.
  if (!(await canApprove(approverUid, brandId))) {
    await l.link.ref.update({ usedAt: null, decision: null });
    return 'forbidden';
  }
  const r = await decide(brandId, requestId, versionId, approverUid, state, note.trim().slice(0, 4000));
  if (r !== 'ok') {
    await l.link.ref.update({ usedAt: null, decision: null });
    return r;
  }
  await db.collection('audit').doc().set({ type: 'review_link_decision', brandId, requestId, versionId, state, by: approverUid, via: fromPhone ? 'whatsapp' : 'link', at: now() });
  return 'ok';
}

publicReview.post('/r/:token/decision', async (c) => {
  const b = await c.req.json<{ state?: string; note?: string }>().catch(() => ({} as { state?: string; note?: string }));
  const r = await decideWithLink(c.req.param('token'), String(b.state ?? ''), String(b.note ?? ''));
  return r === 'ok' ? c.json({ ok: true }) : c.json({ error: r }, (STATUS[r] ?? 400) as 400);
});

// Whoever holds a live review link can also rename the request it shows, like on the request page.
publicReview.post('/r/:token/title', async (c) => {
  const l = await load(c.req.param('token'));
  if (!l) return c.json({ error: 'not_found' }, 404);
  if (l.expired) return c.json({ error: 'expired' }, 410);
  const b = await c.req.json<{ title?: unknown }>().catch(() => ({} as { title?: unknown }));
  const title = (typeof b.title === 'string' ? b.title : '').replace(/\s+/g, ' ').trim().slice(0, 160);
  if (!title) return c.json({ error: 'title_required' }, 400);
  const { brandId, requestId } = l.link.data() as { brandId: string; requestId: string };
  const ref = db.doc(`brands/${brandId}/requests/${requestId}`);
  const snap = await ref.get();
  if (!snap.exists) return c.json({ error: 'not_found' }, 404);
  const before = String(snap.get('title') ?? '');
  if (before === title) return c.json({ ok: true, title });
  const keepSite = snap.get('category') === 'web' && /^(Ajuste del sitio|Site adjustment)/.test(before);
  const by = (l.link.get('approverUid') as string | undefined) ?? 'review_link';
  await ref.update({ title, titleBy: by, ...(keepSite ? { siteAdjust: true } : {}), updatedAt: FieldValue.serverTimestamp() });
  await db.collection('audit').doc().set({ type: 'request_renamed', brandId, requestId, before, after: title, by, via: 'link', at: FieldValue.serverTimestamp() });
  return c.json({ ok: true, title });
});
