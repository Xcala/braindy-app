// Admin: the requests-by-email channel. Connect NickMark's mailbox (OAuth through the calendar's callback,
// which hands a «gmail» state over to finishGmail), set the address clients write to, see the last senders
// no brand knows, disconnect.
import { Hono } from 'hono';
import { randomBytes } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import type { AuthEnv } from '../auth.js';
import { disconnectGmail, MAIL_SCOPES, mailIntegration, mailReady } from './gmail.js';

const CLIENT_ID = process.env.GOOGLE_CAL_CLIENT_ID ?? '';
const API_URL = process.env.API_URL ?? 'https://braindy-api-283103160183.us-central1.run.app';
export const MAIL_REDIRECT = `${API_URL}/integrations/google-calendar/callback`;
const isAdmin = async (uid: string) => (await db.doc(`users/${uid}`).get()).get('role') === 'admin';
const iso = (t: unknown) => (t instanceof Timestamp ? t.toDate().toISOString() : null);

export const adminMail = new Hono<AuthEnv>();
adminMail.use('/mail', async (c, next) => ((await isAdmin(c.get('user').uid)) ? next() : c.json({ error: 'forbidden' }, 403)));
adminMail.use('/mail/*', async (c, next) => ((await isAdmin(c.get('user').uid)) ? next() : c.json({ error: 'forbidden' }, 403)));

adminMail.get('/mail', async (c) => {
  const d = await mailIntegration().get();
  const inbox = await db.collection('mailInbox').where('status', '==', 'new').limit(30).get();
  const items = inbox.docs.map((x) => ({ id: x.id, from: x.get('from'), subject: x.get('subject'), reason: x.get('reason'), at: iso(x.get('at')) }))
    .sort((a, b) => String(b.at).localeCompare(String(a.at)));
  return c.json({ ready: mailReady(), connected: !!d.get('ciphertext'), email: d.get('email') ?? null, address: d.get('address') ?? '',
    lastCheckAt: iso(d.get('lastCheckAt')), filed: Number(d.get('filed') ?? 0), inbox: items });
});

adminMail.post('/mail/connect', async (c) => {
  if (!CLIENT_ID) return c.json({ error: 'not_configured' }, 400);
  const state = randomBytes(24).toString('hex');
  await db.doc(`calendarStates/${state}`).set({ uid: c.get('user').uid, kind: 'gmail', at: FieldValue.serverTimestamp() });
  const q = new URLSearchParams({ client_id: CLIENT_ID, redirect_uri: MAIL_REDIRECT, response_type: 'code', scope: MAIL_SCOPES, access_type: 'offline', prompt: 'consent', state });
  return c.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${q}` });
});

adminMail.put('/mail/address', async (c) => {
  const b = await c.req.json<{ address?: string }>().catch(() => ({} as { address?: string }));
  const address = String(b.address ?? '').trim().toLowerCase();
  if (address && !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(address)) return c.json({ error: 'invalid_address' }, 400);
  await mailIntegration().set({ address }, { merge: true });
  return c.json({ ok: true, address });
});

adminMail.post('/mail/inbox/:id/dismiss', async (c) => {
  await db.doc(`mailInbox/${c.req.param('id')}`).set({ status: 'dismissed' }, { merge: true });
  return c.json({ ok: true });
});

adminMail.delete('/mail', async (c) => { await disconnectGmail(); return c.json({ ok: true }); });
