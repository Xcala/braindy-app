// WhatsApp webhook (Meta Cloud API, routed by Dualhook's webhook override). Secrets in Secret Manager:
// WHATSAPP_VERIFY_TOKEN (Meta's GET handshake) and WHATSAPP_WEBHOOK_KEY (secret path segment, because with
// Dualhook the X-Hub-Signature-256 is signed with Dualhook's app secret). When WHATSAPP_APP_SECRET is set,
// the signature is checked too. Never log message bodies or phone numbers.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { ownPhoneId } from '../whatsapp.js';
import { handleMessage, type WaMsg } from './inbound.js';

const VERIFY = process.env.WHATSAPP_VERIFY_TOKEN?.trim();
const KEY = process.env.WHATSAPP_WEBHOOK_KEY?.trim();
const APP_SECRET = process.env.WHATSAPP_APP_SECRET?.trim();

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const keyOk = (k: string) => !!KEY && same(k, KEY);

export function signatureOk(raw: string, header: string | undefined) {
  if (!APP_SECRET) return true; // no secret available: the secret path is the gate
  if (!header?.startsWith('sha256=')) return false;
  return same(header.slice(7), createHmac('sha256', APP_SECRET).update(raw).digest('hex'));
}

export const whatsappWebhook = new Hono();

/** Meta's subscription handshake: echo the challenge only for our verify token. */
whatsappWebhook.get('/whatsapp/:key', (c) => {
  if (!keyOk(c.req.param('key')) || !VERIFY) return c.text('forbidden', 403);
  const mode = c.req.query('hub.mode');
  const token = c.req.query('hub.verify_token') ?? '';
  if (mode !== 'subscribe' || !same(token, VERIFY)) return c.text('forbidden', 403);
  return c.text(c.req.query('hub.challenge') ?? '');
});

whatsappWebhook.post('/whatsapp/:key', async (c) => {
  if (!keyOk(c.req.param('key'))) return c.text('forbidden', 403);
  const raw = await c.req.text();
  if (!signatureOk(raw, c.req.header('x-hub-signature-256'))) return c.text('bad_signature', 401);
  let body: { entry?: Array<{ changes?: Change[] }> };
  try { body = JSON.parse(raw); } catch { return c.text('bad_json', 400); }
  const changes = (body.entry ?? []).flatMap((e) => e.changes ?? []);
  let messages = 0;
  for (const ch of changes) {
    // Only our own number; history sync and echoes of messages sent from the phone app are not requests.
    if (ch.field !== 'messages' || (ownPhoneId() && ch.value?.metadata?.phone_number_id !== ownPhoneId())) continue;
    const names = Object.fromEntries((ch.value?.contacts ?? []).map((x) => [x.wa_id, x.profile?.name ?? '']));
    for (const m of ch.value?.messages ?? []) {
      if (!(await firstTime(m.id))) continue;
      messages++;
      await inOrder(m.from, () => handleMessage(m, names[m.from] ?? '').then(() => undefined)).catch((e) => fail('inbound', e));
    }
    for (const s of ch.value?.statuses ?? []) await status(s).catch((e) => fail('status', e));
  }
  await db.doc('waChannel/status').set({
    lastWebhookAt: FieldValue.serverTimestamp(), ...(messages ? { lastInboundAt: FieldValue.serverTimestamp(), inbound: FieldValue.increment(messages) } : {}),
  }, { merge: true });
  console.log('whatsapp webhook', JSON.stringify({ fields: changes.map((ch) => ch.field), messages }));
  return c.json({ ok: true });
});

type Change = {
  field?: string;
  value?: {
    metadata?: { phone_number_id?: string }; contacts?: Array<{ wa_id: string; profile?: { name?: string } }>;
    messages?: WaMsg[]; statuses?: Array<{ id: string; status: string; errors?: Array<{ code?: number; title?: string }> }>;
  };
};

/** Meta retries deliveries: each message id is handled once. */
async function firstTime(id: string) {
  if (!/^[A-Za-z0-9_.=:-]{1,200}$/.test(id)) return false;
  try { await db.doc(`waEvents/${id}`).create({ at: FieldValue.serverTimestamp() }); return true; } catch { return false; }
}

// Several photos sent together arrive at once: handle one number's messages in order (per instance).
const queues = new Map<string, Promise<void>>();
function inOrder(phone: string, job: () => Promise<void>) {
  const next = (queues.get(phone) ?? Promise.resolve()).then(job, job);
  queues.set(phone, next.catch(() => undefined));
  return next;
}

async function status(s: { id: string; status: string; errors?: Array<{ code?: number; title?: string }> }) {
  const ref = db.doc(`waOutbound/${s.id}`);
  if ((await ref.get()).exists) await ref.set({ status: s.status, statusAt: FieldValue.serverTimestamp() }, { merge: true });
  if (s.status === 'failed') {
    const e = s.errors?.[0];
    await db.doc('waChannel/status').set({ lastError: { code: e?.code ?? null, title: String(e?.title ?? '').slice(0, 200), at: FieldValue.serverTimestamp() } }, { merge: true });
  }
}

async function fail(where: string, e: unknown) {
  console.warn('whatsapp webhook error', where, String(e).slice(0, 160));
  await db.doc('waChannel/status').set({ lastError: { code: null, title: `${where}: ${String(e).slice(0, 160)}`, at: FieldValue.serverTimestamp() } }, { merge: true }).catch(() => null);
}
