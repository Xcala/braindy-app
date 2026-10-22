// Granola → team memory. Granola calls /webhooks/granola when a note is generated or edited (Standard Webhooks
// signature, secret GRANOLA_WEBHOOK_SECRET); we fetch the note with GRANOLA_API_KEY and file it under the brand
// (participants' email domains, or the brand name in the title). Notes we cannot place wait in granolaInbox for
// NickMark to assign. Also: a sync of recent notes, and the inbox actions. No secrets or note content in logs.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { brandAccess } from './access.js';
import { logError } from './guard.js';
import type { AuthEnv } from './auth.js';

const API = 'https://public-api.granola.ai/v1';
const KEY = process.env.GRANOLA_API_KEY;
const SECRET = process.env.GRANOLA_WEBHOOK_SECRET;
const PUBLIC_DOMAINS = new Set(['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com', 'braindy.co', 'xent.co']);

type Note = {
  id: string; title: string | null; summary_markdown: string | null; summary_text: string; web_url?: string;
  attendees?: Array<{ name?: string; email?: string }>; calendar_event?: { scheduled_start_time?: string | null } | null; created_at: string;
};

export const granolaConfigured = () => !!KEY;
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

/** Standard Webhooks: v1,base64(HMAC-SHA256(`${id}.${timestamp}.${body}`)) with the base64 secret after "whsec_". */
export function verifyGranola(raw: string, id?: string, ts?: string, sig?: string) {
  if (!SECRET || !id || !ts || !sig || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = Buffer.from(SECRET.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${ts}.${raw}`).digest('base64');
  return sig.split(' ').some((part) => {
    const [v, s] = part.split(',');
    return v === 'v1' && s && s.length === expected.length && timingSafeEqual(Buffer.from(s), Buffer.from(expected));
  });
}

async function getNote(id: string): Promise<Note | null> {
  if (!KEY) return null;
  const r = await fetch(`${API}/notes/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${KEY}` }, signal: AbortSignal.timeout(15_000) });
  return r.ok ? ((await r.json()) as Note) : null;
}

/** Which brand a meeting belongs to: a configured domain or keyword, a participant domain, or the brand name in the title. */
export async function matchBrand(title: string, emails: string[]) {
  const brands = await db.collection('brands').where('status', '==', 'active').select('name', 'meetingDomains', 'meetingKeywords').get();
  const domains = emails.map((e) => e.split('@')[1]?.toLowerCase()).filter((d): d is string => !!d && !PUBLIC_DOMAINS.has(d));
  const t = norm(title);
  let best: { id: string; score: number } | null = null;
  for (const b of brands.docs) {
    const name = norm(String(b.get('name') ?? ''));
    const conf = ((b.get('meetingDomains') as string[]) ?? []).map((d) => d.toLowerCase());
    const words = ((b.get('meetingKeywords') as string[]) ?? []).map(norm).filter(Boolean);
    let score = 0;
    if (domains.some((d) => conf.includes(d))) score += 10;
    if (words.some((w) => t.includes(w))) score += 8;
    if (name.length >= 4 && domains.some((d) => norm(d.split('.')[0]) === name)) score += 6;
    if (name.length >= 4 && t.includes(name)) score += 5;
    if (score && (!best || score > best.score)) best = { id: b.id, score };
  }
  return best?.id ?? null;
}

/** Files one Granola note: meeting under the brand (idempotent by note id) or into the inbox. */
export async function fileNote(note: Note, forcedBrand?: string) {
  const title = note.title || 'Granola';
  const emails = (note.attendees ?? []).map((a) => String(a.email ?? '')).filter(Boolean);
  const brandId = forcedBrand ?? await matchBrand(title, emails);
  const doc = {
    title: title.slice(0, 160), date: String(note.calendar_event?.scheduled_start_time ?? note.created_at).slice(0, 10),
    notes: String(note.summary_markdown || note.summary_text || '').slice(0, 20_000), source: 'granola', granolaId: note.id,
    webUrl: note.web_url ?? null, attendees: emails.slice(0, 30), syncedAt: FieldValue.serverTimestamp(),
  };
  if (!doc.notes.trim()) return { status: 'empty' as const };
  if (!brandId) {
    await db.doc(`granolaInbox/${note.id}`).set({ ...doc, status: 'unassigned' }, { merge: true });
    return { status: 'inbox' as const };
  }
  await db.doc(`brands/${brandId}/meetings/granola-${note.id}`).set(doc, { merge: true });
  await db.doc(`granolaInbox/${note.id}`).delete().catch(() => undefined);
  return { status: 'filed' as const, brandId };
}

// ---------- webhook (public, signed) ----------
export const granolaWebhook = new Hono();
granolaWebhook.post('/granola', async (c) => {
  const raw = await c.req.text();
  if (!verifyGranola(raw, c.req.header('webhook-id'), c.req.header('webhook-timestamp'), c.req.header('webhook-signature'))) {
    return c.json({ error: 'bad_signature' }, 400);
  }
  const evt = JSON.parse(raw) as { event_id: string; event_type: string; note_id: string };
  if (!['note.generated', 'note.edited', 'note.access_granted'].includes(evt.event_type)) return c.json({ ok: true, ignored: true });
  try {
    const note = await getNote(evt.note_id);
    if (note) await fileNote(note);
  } catch (e) { logError(e, { where: 'granola-webhook' }); }
  return c.json({ ok: true });
});

// ---------- admin: sync recent notes, inbox ----------
export const adminGranola = new Hono<AuthEnv>();
adminGranola.use('/granola/*', async (c, next) => {
  if (!(await brandAccess(c.get('user').uid, '__none__')).admin) return c.json({ error: 'forbidden' }, 403);
  await next();
});

adminGranola.post('/granola/sync', async (c) => {
  if (!KEY) return c.json({ error: 'granola_not_configured' }, 503);
  const days = Math.min(90, Math.max(1, Number(c.req.query('days') ?? 30)));
  const after = new Date(Date.now() - days * 864e5).toISOString();
  const counts = { filed: 0, inbox: 0, empty: 0 };
  let cursor: string | null = null;
  for (let page = 0; page < 20; page++) {
    const q = new URLSearchParams({ created_after: after, page_size: '30', ...(cursor ? { cursor } : {}) });
    const r = await fetch(`${API}/notes?${q}`, { headers: { Authorization: `Bearer ${KEY}` }, signal: AbortSignal.timeout(15_000) });
    if (!r.ok) return c.json({ error: `granola_${r.status}`, ...counts }, 502);
    const j = (await r.json()) as { notes: Array<{ id: string }>; hasMore: boolean; cursor: string | null };
    for (const n of j.notes) {
      const note = await getNote(n.id);
      if (note) counts[(await fileNote(note)).status]++;
    }
    if (!j.hasMore || !j.cursor) break;
    cursor = j.cursor;
  }
  return c.json(counts);
});

adminGranola.post('/granola/inbox/:id/assign', async (c) => {
  const { brandId } = await c.req.json<{ brandId?: string }>();
  const item = await db.doc(`granolaInbox/${c.req.param('id')}`).get();
  if (!item.exists || !brandId || !(await db.doc(`brands/${brandId}`).get()).exists) return c.json({ error: 'invalid' }, 400);
  const d = item.data()!;
  await db.doc(`brands/${brandId}/meetings/granola-${item.id}`).set({ ...d, status: FieldValue.delete() }, { merge: true });
  // Learn from the choice: next meetings with these participants' domains go straight to this brand.
  const domains = ((d.attendees as string[]) ?? []).map((e) => e.split('@')[1]?.toLowerCase()).filter((x): x is string => !!x && !PUBLIC_DOMAINS.has(x));
  if (domains.length) await db.doc(`brands/${brandId}`).update({ meetingDomains: FieldValue.arrayUnion(...domains) });
  await item.ref.delete();
  return c.json({ ok: true, learnedDomains: domains });
});

adminGranola.post('/granola/inbox/:id/ignore', async (c) => {
  await db.doc(`granolaInbox/${c.req.param('id')}`).set({ status: 'ignored' }, { merge: true });
  return c.json({ ok: true });
});
