// Clients book a 30-minute meeting with NickMark from "Contacta a Nico": free slots come from his Google
// Calendar (free/busy only, never his events' details); booking creates the event in his calendar with
// a Meet link and invites the person who booked.
import { Hono } from 'hono';
import { randomBytes } from 'node:crypto';
import { db } from './firebase.js';
import { brandAccess } from './access.js';
import { accessToken, eventsCache } from './meetings.js';
import type { AuthEnv } from './auth.js';

const SLOT_MIN = 30;
// Nicolas's hours, in his own time zone (IANA, so daylight saving moves with it): first slot 7:00, last one 16:30.
export const HOST_TZ = 'America/Los_Angeles';
const DAY_START = 7, DAY_END = 17;
const DAYS_AHEAD = 10;                  // calendar days shown
const LEAD_MS = 2 * 3600_000;           // not sooner than 2 hours from now
const MAX_UPCOMING = 2;                 // a person can hold at most this many future bookings
const CAL = 'https://www.googleapis.com/calendar/v3';

let busyCache: { at: number; busy: Array<[number, number]> } | null = null;

async function busy(token: string, from: number, to: number): Promise<Array<[number, number]> | null> {
  if (busyCache && Date.now() - busyCache.at < 5 * 60_000) return busyCache.busy;
  const r = await fetch(`${CAL}/freeBusy`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeMin: new Date(from).toISOString(), timeMax: new Date(to).toISOString(), items: [{ id: 'primary' }] }) });
  if (!r.ok) return null;
  const j = await r.json() as { calendars?: { primary?: { busy?: Array<{ start: string; end: string }> } } };
  const list = (j.calendars?.primary?.busy ?? []).map((b) => [Date.parse(b.start), Date.parse(b.end)] as [number, number]);
  busyCache = { at: Date.now(), busy: list };
  return list;
}

/** How far HOST_TZ's wall clock is ahead of UTC at instant t (negative west of Greenwich). */
const wall = new Intl.DateTimeFormat('en-US', { timeZone: HOST_TZ, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
function offsetAt(t: number): number {
  const p = Object.fromEntries(wall.formatToParts(t).map((x) => [x.type, Number(x.value)]));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - Math.floor(t / 60_000) * 60_000;
}

/** Every 30-minute start on weekdays between DAY_START and DAY_END in HOST_TZ, from now + lead time. */
function candidates(now: number): number[] {
  const out: number[] = [];
  const d0 = new Date(now + offsetAt(now));
  for (let i = 0; i <= DAYS_AHEAD; i++) {
    const day = Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth(), d0.getUTCDate() + i);
    const dow = new Date(day).getUTCDay();
    if (dow === 0 || dow === 6) continue;
    for (let m = DAY_START * 60; m + SLOT_MIN <= DAY_END * 60; m += SLOT_MIN) {
      const local = day + m * 60_000, t = local - offsetAt(local - offsetAt(local));
      if (t >= now + LEAD_MS) out.push(t);
    }
  }
  return out;
}

const overlaps = (t: number, list: Array<[number, number]>) => list.some(([a, b]) => t < b && t + SLOT_MIN * 60_000 > a);

export const booking = new Hono<AuthEnv>();

/** Members: NickMark's free 30-minute slots for the next days. `connected: false` while his calendar is not linked. */
booking.get('/brands/:brandId/meetings/slots', async (c) => {
  const { brandId } = c.req.param();
  if (!(await brandAccess(c.get('user').uid, brandId)).member) return c.json({ error: 'forbidden' }, 403);
  const token = await accessToken();
  if (!token) return c.json({ connected: false, slots: [] });
  const all = candidates(Date.now());
  if (!all.length) return c.json({ connected: true, slots: [] });
  const b = await busy(token, all[0], all[all.length - 1] + SLOT_MIN * 60_000);
  if (!b) return c.json({ connected: false, slots: [] });
  return c.json({ connected: true, minutes: SLOT_MIN, hostTz: HOST_TZ, slots: all.filter((t) => !overlaps(t, b)).map((t) => new Date(t).toISOString()) });
});

/** Members: book one slot. Rechecks it is still free, creates the event with a Meet link and invites the booker. */
booking.post('/brands/:brandId/meetings/book', async (c) => {
  const { brandId } = c.req.param();
  const user = c.get('user');
  if (!(await brandAccess(user.uid, brandId)).member) return c.json({ error: 'forbidden' }, 403);
  if (!user.email) return c.json({ error: 'no_email' }, 400);
  const { start } = await c.req.json<{ start?: string }>();
  const t = Date.parse(String(start ?? ''));
  if (!Number.isFinite(t) || !candidates(Date.now()).includes(t)) return c.json({ error: 'invalid_slot' }, 400);
  const token = await accessToken();
  if (!token) return c.json({ error: 'not_connected' }, 409);

  busyCache = null;
  const b = await busy(token, t, t + SLOT_MIN * 60_000);
  if (!b || overlaps(t, b)) return c.json({ error: 'taken' }, 409);
  const mine = await db.collection('bookings').where('uid', '==', user.uid).get();
  const ahead = mine.docs.filter((d) => ((d.get('start') as { toMillis?: () => number })?.toMillis?.() ?? 0) > Date.now());
  if (ahead.length >= MAX_UPCOMING) return c.json({ error: 'too_many' }, 429);

  const brand = await db.doc(`brands/${brandId}`).get();
  const name = String(brand.get('name') ?? brandId).slice(0, 80);
  const end = t + SLOT_MIN * 60_000;
  const r = await fetch(`${CAL}/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary: `Braindy · ${name} · Nicolas`,
      description: `Reunión de 30 minutos agendada desde app.braindy.co por ${user.name ?? user.email}.`,
      start: { dateTime: new Date(t).toISOString() }, end: { dateTime: new Date(end).toISOString() },
      attendees: [{ email: user.email }],
      conferenceData: { createRequest: { requestId: randomBytes(12).toString('hex'), conferenceSolutionKey: { type: 'hangoutsMeet' } } },
    }),
  });
  if (!r.ok) return c.json({ error: 'calendar_error' }, 502);
  const ev = await r.json() as { id: string; hangoutLink?: string };
  await db.collection('bookings').add({ uid: user.uid, email: user.email, brandId, eventId: ev.id, start: new Date(t), at: new Date() });
  busyCache = null; eventsCache.clear();
  return c.json({ ok: true, start: new Date(t).toISOString(), end: new Date(end).toISOString(), link: ev.hangoutLink ?? null });
});

// Visitors of braindy.co book the same 30 minutes without an account (the site's /book page): name and email instead
// of a login. Guards: a hidden field bots fill, the rate limit in index.ts and MAX_UPCOMING per email.
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;
const clip = (v: unknown, n: number) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

export const publicBooking = new Hono();

publicBooking.get('/booking/slots', async (c) => {
  c.header('Cache-Control', 'no-store');
  const token = await accessToken();
  if (!token) return c.json({ connected: false, slots: [] });
  const all = candidates(Date.now());
  if (!all.length) return c.json({ connected: true, minutes: SLOT_MIN, hostTz: HOST_TZ, slots: [] });
  const b = await busy(token, all[0], all[all.length - 1] + SLOT_MIN * 60_000);
  if (!b) return c.json({ connected: false, slots: [] });
  return c.json({ connected: true, minutes: SLOT_MIN, hostTz: HOST_TZ, slots: all.filter((t) => !overlaps(t, b)).map((t) => new Date(t).toISOString()) });
});

publicBooking.post('/booking/book', async (c) => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({} as Record<string, unknown>));
  if (clip(body.website, 200)) return c.json({ ok: true }); // the hidden field: bots get a quiet yes and nothing is booked
  const name = clip(body.name, 80), email = clip(body.email, 254).toLowerCase(), company = clip(body.company, 80), note = clip(body.note, 1000);
  const lang = body.lang === 'es' ? 'es' : 'en';
  if (!name || !EMAIL_RE.test(email)) return c.json({ error: 'invalid_contact' }, 400);
  const t = Date.parse(String(body.start ?? ''));
  if (!Number.isFinite(t) || !candidates(Date.now()).includes(t)) return c.json({ error: 'invalid_slot' }, 400);
  const token = await accessToken();
  if (!token) return c.json({ error: 'not_connected' }, 409);

  busyCache = null;
  const b = await busy(token, t, t + SLOT_MIN * 60_000);
  if (!b || overlaps(t, b)) return c.json({ error: 'taken' }, 409);
  const mine = await db.collection('bookings').where('email', '==', email).get();
  const ahead = mine.docs.filter((d) => ((d.get('start') as { toMillis?: () => number })?.toMillis?.() ?? 0) > Date.now());
  if (ahead.length >= MAX_UPCOMING) return c.json({ error: 'too_many' }, 429);

  const end = t + SLOT_MIN * 60_000;
  const who = company ? `${name} (${company})` : name;
  const r = await fetch(`${CAL}/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary: `Braindy · ${company || name} · Nicolas`,
      description: (lang === 'es' ? `Reunión de 30 minutos agendada desde braindy.co por ${who}.` : `30 minute meeting booked on braindy.co by ${who}.`) + (note ? `\n\n${note}` : ''),
      start: { dateTime: new Date(t).toISOString() }, end: { dateTime: new Date(end).toISOString() },
      attendees: [{ email, displayName: name }],
      conferenceData: { createRequest: { requestId: randomBytes(12).toString('hex'), conferenceSolutionKey: { type: 'hangoutsMeet' } } },
    }),
  });
  if (!r.ok) return c.json({ error: 'calendar_error' }, 502);
  const ev = await r.json() as { id: string; hangoutLink?: string };
  await db.collection('bookings').add({ uid: null, source: 'web', name, email, company, eventId: ev.id, start: new Date(t), at: new Date() });
  busyCache = null; eventsCache.clear();
  return c.json({ ok: true, start: new Date(t).toISOString(), end: new Date(end).toISOString(), link: ev.hangoutLink ?? null });
});
