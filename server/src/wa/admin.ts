// Admin (NickMark): channel status and the inbox of unknown numbers. Assigning a message links that number
// to a person of a brand and files the message as a request in that brand.
import { Hono } from 'hono';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { brandAccess } from '../access.js';
import { createRequest } from '../requests.js';
import { whatsappConfigured } from '../whatsapp.js';
import { linkPhone, contactRef } from './contacts.js';
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
