// Signed in: turn alerts on or off on this device, choose which kinds arrive, send a test.
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import type { AuthEnv } from '../auth.js';
import { PUSH_KINDS, publicKey, pushTo, subId } from './send.js';

export const push = new Hono<AuthEnv>();

/** A short, non-identifying label for the device list ("Android", "Windows"…). */
function deviceOf(ua: string) {
  if (/iphone|ipad/i.test(ua)) return 'iPhone';
  if (/android/i.test(ua)) return 'Android';
  if (/windows/i.test(ua)) return 'Windows';
  if (/mac os/i.test(ua)) return 'Mac';
  return 'Web';
}

push.get('/push/key', (c) => c.json({ key: publicKey() }));

push.post('/push/subscribe', async (c) => {
  const uid = c.get('user').uid;
  const b = await c.req.json<{ subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }; lang?: string }>().catch(() => ({} as never));
  const s = b?.subscription;
  const endpoint = String(s?.endpoint ?? '');
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !s?.keys?.p256dh || !s.keys.auth) return c.json({ error: 'invalid_subscription' }, 400);
  await db.doc(`pushSubs/${subId(endpoint)}`).set({
    uid, endpoint, keys: { p256dh: String(s.keys.p256dh).slice(0, 200), auth: String(s.keys.auth).slice(0, 100) },
    lang: b.lang === 'en' ? 'en' : 'es', device: deviceOf(c.req.header('User-Agent') ?? ''), createdAt: FieldValue.serverTimestamp(),
  });
  return c.json({ ok: true });
});

push.post('/push/unsubscribe', async (c) => {
  const uid = c.get('user').uid;
  const { endpoint } = await c.req.json<{ endpoint?: string }>().catch(() => ({} as { endpoint?: string }));
  if (!endpoint) return c.json({ ok: true });
  const ref = db.doc(`pushSubs/${subId(endpoint)}`);
  const d = await ref.get();
  if (d.exists && d.get('uid') === uid) await ref.delete();
  return c.json({ ok: true });
});

push.get('/push/prefs', async (c) => {
  const uid = c.get('user').uid;
  const [u, subs] = await Promise.all([db.doc(`users/${uid}`).get(), db.collection('pushSubs').where('uid', '==', uid).get()]);
  return c.json({ off: (u.get('pushOff') as string[] | undefined) ?? [], devices: subs.docs.map((d) => String(d.get('device') ?? 'Web')) });
});

push.put('/push/prefs', async (c) => {
  const uid = c.get('user').uid;
  const { off } = await c.req.json<{ off?: string[] }>().catch(() => ({} as { off?: string[] }));
  const clean = PUSH_KINDS.filter((k) => Array.isArray(off) && off.includes(k));
  await db.doc(`users/${uid}`).set({ pushOff: clean }, { merge: true });
  return c.json({ off: clean });
});

push.post('/push/test', async (c) => {
  const uid = c.get('user').uid;
  const r = await pushTo([uid], {
    kind: 'comments', tag: 'test', url: '/home',
    title: { es: 'Braindy', en: 'Braindy' },
    body: { es: 'Listo, las alertas llegan a este dispositivo.', en: 'Done, alerts reach this device.' },
  }, { ignorePrefs: true });
  return c.json(r);
});
