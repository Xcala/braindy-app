// Meetings on the client's home: the history (title, date and topics only; full notes stay NickMark's)
// and the next meeting, read from NickMark's Google Calendar. The calendar is connected once by the admin
// (OAuth, offline); the refresh token is sealed with KMS and never leaves the server. A client only ever
// gets events whose guests include a member of their brand.
import { Hono } from 'hono';
import { randomBytes } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { brandAccess } from './access.js';
import { open, seal } from './vault.js';
import type { AuthEnv } from './auth.js';

const CLIENT_ID = process.env.GOOGLE_CAL_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.GOOGLE_CAL_CLIENT_SECRET ?? '';
const API_URL = process.env.API_URL ?? 'https://braindy-api-283103160183.us-central1.run.app';
const WEB_URL = process.env.WEB_URL ?? 'https://app.braindy.co';
const REDIRECT = `${API_URL}/integrations/google-calendar/callback`;
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly openid email';
const AAD = 'google-calendar';
const integration = () => db.doc('integrations/googleCalendar');

// Same rule as the notes layout on the web: a short line that is not a sentence opens a topic.
const NEXT = /pr[oó]ximos pasos|siguientes pasos|next steps|action items|acuerdos|tareas|pendientes|to-?dos?/i;
function topics(md: string): string[] {
  const out: string[] = [];
  for (const raw of String(md ?? '').replace(/\r/g, '').split('\n')) {
    if (!raw.trim() || /^(\s*)(?:[-*•]|\d+[.)])\s+/.test(raw)) continue;
    const line = raw.replace(/^#+\s*/, '').trim();
    if ((/^#+\s/.test(raw) || (line.length <= 90 && !/[.:;]$/.test(line))) && !NEXT.test(line)) out.push(line.replace(/\*\*/g, ''));
  }
  return out.slice(0, 6);
}

const isAdmin = async (uid: string) => (await db.doc(`users/${uid}`).get()).get('role') === 'admin';

export const meetings = new Hono<AuthEnv>();

/** Members: the latest meetings with the brand, without the notes. */
meetings.get('/brands/:brandId/meetings', async (c) => {
  const { brandId } = c.req.param();
  if (!(await brandAccess(c.get('user').uid, brandId)).member) return c.json({ error: 'forbidden' }, 403);
  const snap = await db.collection(`brands/${brandId}/meetings`).orderBy('date', 'desc').limit(12).get();
  return c.json({ items: snap.docs.map((d) => ({ id: d.id, title: String(d.get('title') ?? ''), date: String(d.get('date') ?? ''), topics: topics(d.get('notes')), people: (d.get('attendees') as unknown[] | undefined)?.length ?? 0 })) });
});

// ---------- Google Calendar ----------
let cachedToken: { value: string; until: number } | null = null;
const eventsCache = new Map<string, { at: number; items: CalEvent[] }>();
type CalEvent = { id: string; summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string }; hangoutLink?: string; location?: string; attendees?: Array<{ email?: string }>; status?: string };

async function accessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.until > Date.now()) return cachedToken.value;
  const doc = await integration().get();
  if (!doc.exists || !CLIENT_ID) return null;
  const refresh = await open(doc.get('ciphertext'), AAD, doc.get('scheme'));
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: refresh, grant_type: 'refresh_token' }) });
  if (!r.ok) return null;
  const j = await r.json() as { access_token: string; expires_in: number };
  cachedToken = { value: j.access_token, until: Date.now() + (j.expires_in - 60) * 1000 };
  return j.access_token;
}

/** The next 60 days of NickMark's calendar, cached 10 minutes for every brand. */
async function upcoming(): Promise<CalEvent[] | null> {
  const hit = eventsCache.get('all');
  if (hit && Date.now() - hit.at < 10 * 60_000) return hit.items;
  const token = await accessToken();
  if (!token) return null;
  const q = new URLSearchParams({ timeMin: new Date().toISOString(), timeMax: new Date(Date.now() + 60 * 864e5).toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '250' });
  const r = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${q}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const items = ((await r.json()) as { items?: CalEvent[] }).items?.filter((e) => e.status !== 'cancelled') ?? [];
  eventsCache.set('all', { at: Date.now(), items });
  return items;
}

/** Members: the brand's next meeting (an event in NickMark's calendar with one of the brand's members as a guest). */
meetings.get('/brands/:brandId/meetings/next', async (c) => {
  const { brandId } = c.req.param();
  if (!(await brandAccess(c.get('user').uid, brandId)).member) return c.json({ error: 'forbidden' }, 403);
  const events = await upcoming();
  if (!events) return c.json({ connected: false, next: null });
  const members = await db.collection(`brands/${brandId}/members`).get();
  const emails = new Set(members.docs.map((m) => String(m.get('email') ?? '').toLowerCase()).filter(Boolean));
  const e = events.find((x) => x.attendees?.some((a) => emails.has(String(a.email ?? '').toLowerCase())));
  if (!e) return c.json({ connected: true, next: null });
  const link = e.hangoutLink ?? (/^https:\/\//.test(e.location ?? '') ? e.location : null);
  return c.json({ connected: true, next: { title: e.summary ?? '', start: e.start?.dateTime ?? e.start?.date ?? null, end: e.end?.dateTime ?? e.end?.date ?? null, link } });
});

// Admin: connect / disconnect the calendar.
export const adminCalendar = new Hono<AuthEnv>();
adminCalendar.get('/calendar', async (c) => {
  if (!(await isAdmin(c.get('user').uid))) return c.json({ error: 'forbidden' }, 403);
  const doc = await integration().get();
  return c.json({ ready: !!CLIENT_ID, connected: doc.exists, email: doc.get('email') ?? null });
});
adminCalendar.post('/calendar/connect', async (c) => {
  if (!(await isAdmin(c.get('user').uid))) return c.json({ error: 'forbidden' }, 403);
  if (!CLIENT_ID) return c.json({ error: 'not_configured' }, 400);
  const state = randomBytes(24).toString('hex');
  await db.doc(`calendarStates/${state}`).set({ uid: c.get('user').uid, at: FieldValue.serverTimestamp() });
  const q = new URLSearchParams({ client_id: CLIENT_ID, redirect_uri: REDIRECT, response_type: 'code', scope: SCOPES, access_type: 'offline', prompt: 'consent', state });
  return c.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${q}` });
});
adminCalendar.delete('/calendar', async (c) => {
  if (!(await isAdmin(c.get('user').uid))) return c.json({ error: 'forbidden' }, 403);
  await integration().delete(); cachedToken = null; eventsCache.clear();
  return c.json({ ok: true });
});

/** Google sends NickMark back here after he allows access (public route, checked by the one-time state). */
export const calendarCallback = new Hono();
calendarCallback.get('/integrations/google-calendar/callback', async (c) => {
  const back = (ok: boolean) => c.redirect(`${WEB_URL}/admin?calendar=${ok ? 'ok' : 'error'}`);
  const state = c.req.query('state') ?? '';
  const code = c.req.query('code') ?? '';
  if (!/^[a-f0-9]{48}$/.test(state) || !code) return back(false);
  const ref = db.doc(`calendarStates/${state}`);
  const st = await ref.get();
  await ref.delete();
  const at = (st.get('at') as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
  if (!st.exists || Date.now() - at > 10 * 60_000 || !(await isAdmin(st.get('uid')))) return back(false);
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, redirect_uri: REDIRECT, grant_type: 'authorization_code' }) });
  if (!r.ok) return back(false);
  const j = await r.json() as { refresh_token?: string; id_token?: string };
  if (!j.refresh_token) return back(false);
  let email: string | null = null;
  try { email = JSON.parse(Buffer.from(String(j.id_token).split('.')[1], 'base64url').toString()).email ?? null; } catch { /* email is only a label */ }
  const sealed = await seal(j.refresh_token, AAD);
  await integration().set({ ...sealed, email, by: st.get('uid'), at: FieldValue.serverTimestamp() });
  cachedToken = null; eventsCache.clear();
  return back(true);
});
