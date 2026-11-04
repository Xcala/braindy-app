// Admin (NickMark): channel status and the inbox of unknown numbers. Assigning a message links that number
// to a person of a brand and files the message as a request in that brand.
import { Hono } from 'hono';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { brandAccess } from '../access.js';
import { createRequest } from '../requests.js';
import { getProfile, normalizePhone, saveProfile, whatsappConfigured } from '../whatsapp.js';
import { linkPhone, contactRef, unlinkPhone } from './contacts.js';
import { storeMedia, type InMedia } from './media.js';
import type { AuthEnv } from '../auth.js';

export const adminWhatsapp = new Hono<AuthEnv>();

adminWhatsapp.use('*', async (c, next) => {
  if ((await db.doc(`users/${c.get('user').uid}`).get()).get('role') !== 'admin') return c.json({ error: 'forbidden' }, 403);
  await next();
});

const iso = (t: unknown) => (t instanceof Timestamp ? t.toDate().toISOString() : null);

adminWhatsapp.get('/whatsapp/status', async (c) => {
  const s = (await db.doc('waChannel/status').get()).data() ?? {};
  const inbox = await db.collection('waInbox').where('status', '==', 'new').count().get();
  return c.json({
    sending: whatsappConfigured(),
    receiving: !!process.env.WHATSAPP_WEBHOOK_KEY && !!process.env.WHATSAPP_VERIFY_TOKEN,
    signatureChecked: !!process.env.WHATSAPP_APP_SECRET,
    lastWebhookAt: iso(s.lastWebhookAt), lastInboundAt: iso(s.lastInboundAt), inbound: s.inbound ?? 0,
    lastError: s.lastError ? { code: s.lastError.code ?? null, title: s.lastError.title ?? '', at: iso(s.lastError.at) } : null,
    inboxNew: inbox.data().count,
  });
});

/** Links the number to a member of the brand and files the message as a request there. */
adminWhatsapp.post('/whatsapp/inbox/:id/assign', async (c) => {
  const ref = db.doc(`waInbox/${c.req.param('id')}`);
  const item = await ref.get();
  if (!item.exists || item.get('status') !== 'new') return c.json({ error: 'not_found' }, 404);
  const b = await c.req.json<{ brandId?: string; uid?: string; file?: boolean }>().catch(() => ({} as { brandId?: string; uid?: string; file?: boolean }));
  const brandId = String(b.brandId ?? ''); const uid = String(b.uid ?? '');
  const a = await brandAccess(uid, brandId);
  if (!a.member || a.admin) return c.json({ error: 'not_a_member' }, 400);
  const phone = String(item.get('phone'));
  const taken = (await contactRef(phone).get()).get('uid') as string | null | undefined;
  if (taken && taken !== uid) return c.json({ error: 'phone_taken' }, 409);
  await linkPhone(phone, uid, 'admin');
  let requestId: string | null = null;
  if (b.file !== false) {
    const media = (item.get('media') as InMedia[]) ?? [];
    const files = await storeMedia(brandId, uid, media);
    const text = String(item.get('text') ?? '') || 'Archivos enviados por WhatsApp';
    const r = await createRequest(brandId, uid, { title: text.split('\n')[0].slice(0, 80), source: 'whatsapp', cards: { product: { text, files } } });
    if ('requestId' in r) requestId = r.requestId;
  }
  await ref.update({ status: 'assigned', brandId, uid, requestId, assignedBy: c.get('user').uid, assignedAt: FieldValue.serverTimestamp() });
  await db.collection('audit').doc().set({ type: 'whatsapp_assigned', brandId, uid, phoneLast4: phone.slice(-4), by: c.get('user').uid, at: FieldValue.serverTimestamp() });
  return c.json({ ok: true, requestId });
});

adminWhatsapp.post('/whatsapp/inbox/:id/dismiss', async (c) => {
  const ref = db.doc(`waInbox/${c.req.param('id')}`);
  if (!(await ref.get()).exists) return c.json({ error: 'not_found' }, 404);
  await ref.update({ status: 'dismissed', dismissedBy: c.get('user').uid, dismissedAt: FieldValue.serverTimestamp() });
  return c.json({ ok: true });
});

// ---------- who may use WhatsApp, brand by brand ----------
adminWhatsapp.get('/whatsapp/brands/:brandId/people', async (c) => {
  const members = await db.collection(`brands/${c.req.param('brandId')}/members`).get();
  const users = await Promise.all(members.docs.map((m) => db.doc(`users/${m.id}`).get()));
  return c.json({
    people: members.docs.map((m, i) => ({
      uid: m.id, name: String(m.get('name') ?? ''), email: String(m.get('email') ?? ''), role: String(m.get('role') ?? 'client_member'),
      allowed: m.get('whatsapp') !== false,
      phone: String(users[i].get('whatsapp.phone') ?? ''), optIn: users[i].get('whatsapp.optIn') === true,
    })),
  });
});

/** Turns the channel on/off for one member of the brand, and/or sets or removes their number. */
adminWhatsapp.put('/whatsapp/brands/:brandId/people/:uid', async (c) => {
  const { brandId, uid } = c.req.param();
  const member = db.doc(`brands/${brandId}/members/${uid}`);
  if (!(await member.get()).exists) return c.json({ error: 'not_a_member' }, 404);
  const b = await c.req.json<{ allowed?: boolean; phone?: string }>().catch(() => ({} as { allowed?: boolean; phone?: string }));
  if (typeof b.phone === 'string') {
    if (!b.phone.trim()) await unlinkPhone(uid);
    else {
      const phone = normalizePhone(b.phone);
      if (!phone) return c.json({ error: 'invalid_phone' }, 400);
      const taken = (await contactRef(phone).get()).get('uid') as string | null | undefined;
      if (taken && taken !== uid) return c.json({ error: 'phone_taken' }, 409);
      await linkPhone(phone, uid, 'admin');
    }
  }
  if (typeof b.allowed === 'boolean') await member.set({ whatsapp: b.allowed }, { merge: true });
  await db.collection('audit').doc().set({ type: 'whatsapp_access', brandId, uid, allowed: b.allowed ?? null, phoneChanged: typeof b.phone === 'string', by: c.get('user').uid, at: FieldValue.serverTimestamp() });
  return c.json({ ok: true });
});

// Public business profile. Meta's limits: about 1-139, description 512, address 256, email 128, 2 websites.
export const VERTICALS = ['OTHER', 'PROF_SERVICES', 'EDU', 'ENTERTAIN', 'EVENT_PLAN', 'RETAIL', 'APPAREL', 'BEAUTY', 'HEALTH', 'FINANCE', 'TRAVEL', 'RESTAURANT', 'HOTEL', 'NONPROFIT', 'AUTO', 'GROCERY', 'UNDEFINED'];

adminWhatsapp.get('/whatsapp/profile', async (c) => {
  const p = await getProfile();
  return p ? c.json(p) : c.json({ error: 'unavailable' }, 503);
});

adminWhatsapp.put('/whatsapp/profile', async (c) => {
  const b = await c.req.json<Record<string, unknown>>().catch(() => ({} as Record<string, unknown>));
  const t = (k: string, max: number) => String(b[k] ?? '').trim().slice(0, max);
  const websites = (Array.isArray(b.websites) ? b.websites : []).map((w) => String(w).trim()).filter(Boolean).slice(0, 2);
  const about = t('about', 139); const email = t('email', 128); const vertical = t('vertical', 30);
  if (!about) return c.json({ error: 'about_required' }, 400);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return c.json({ error: 'invalid_email' }, 400);
  if (websites.some((w) => !/^https?:\/\/\S+$/.test(w) || w.length > 256)) return c.json({ error: 'invalid_website' }, 400);
  if (vertical && !VERTICALS.includes(vertical)) return c.json({ error: 'invalid_vertical' }, 400);
  const r = await saveProfile({ about, description: t('description', 512), address: t('address', 256), email, websites, vertical: vertical || 'OTHER' });
  if (!r.ok) return c.json({ error: 'meta_rejected', status: r.status }, 502);
  await db.collection('audit').doc().set({ type: 'whatsapp_profile_saved', by: c.get('user').uid, at: FieldValue.serverTimestamp() });
  return c.json({ ok: true });
});
