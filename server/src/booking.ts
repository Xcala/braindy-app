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
const DAY_START = 9, DAY_END = 17;      // Bogotá time (UTC-5): first slot 9:00, last one 16:30
const DAYS_AHEAD = 10;                  // calendar days shown
const LEAD_MS = 2 * 3600_000;           // not sooner than 2 hours from now
const MAX_UPCOMING = 2;                 // a person can hold at most this many future bookings
const OFFSET = 5 * 3600_000;
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

/** Every 30-minute start on weekdays between DAY_START and DAY_END (Bogotá), from now + lead time. */
function candidates(now: number): number[] {
  const out: number[] = [];
  const d0 = new Date(now - OFFSET);
  for (let i = 0; i <= DAYS_AHEAD; i++) {
    const day = Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth(), d0.getUTCDate() + i);
    const dow = new Date(day).getUTCDay();
    if (dow === 0 || dow === 6) continue;
    for (let m = DAY_START * 60; m + SLOT_MIN <= DAY_END * 60; m += SLOT_MIN) {
      const t = day + m * 60_000 + OFFSET;
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
  return c.json({ connected: true, minutes: SLOT_MIN, slots: all.filter((t) => !overlaps(t, b)).map((t) => new Date(t).toISOString()) });
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
