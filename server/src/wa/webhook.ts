// WhatsApp webhook (Meta Cloud API, routed by Dualhook's webhook override). Secrets in Secret Manager:
// WHATSAPP_VERIFY_TOKEN (Meta's GET handshake) and WHATSAPP_WEBHOOK_KEY (secret path segment, because with
// Dualhook the X-Hub-Signature-256 is signed with Dualhook's app secret). When WHATSAPP_APP_SECRET is set,
// the signature is checked too. Never log message bodies or phone numbers.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Hono } from 'hono';

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
  let body: { entry?: Array<{ changes?: Array<{ field?: string; value?: { messages?: unknown[]; statuses?: unknown[] } }> }> };
  try { body = JSON.parse(raw); } catch { return c.text('bad_json', 400); }
  const changes = (body.entry ?? []).flatMap((e) => e.changes ?? []);
  // Step 1: receive and acknowledge. Inbound → requests comes next; only counts are logged.
  console.log('whatsapp webhook', JSON.stringify({
    fields: changes.map((ch) => ch.field), messages: changes.reduce((n, ch) => n + (ch.value?.messages?.length ?? 0), 0),
    statuses: changes.reduce((n, ch) => n + (ch.value?.statuses?.length ?? 0), 0),
  }));
  return c.json({ ok: true });
});
