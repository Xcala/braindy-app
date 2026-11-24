// First-party usage analytics (2026-11-24, decided by Nicolas): which parts of the app people open, to choose the
// tabs with data. Aggregates only: one doc per day, pageViews/{YYYY-MM-DD}, with counters per page pattern ×
// section × role × device and per brand × role. No uid, no events, no third parties. Only the admin reads it.
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { logError } from './guard.js';
import type { AuthEnv } from './auth.js';

const MAX_ITEMS = 50;
const MAX_N = 50;
const BRAND_TTL = 10 * 60_000;

/** First path segments the app has; anything else is counted as /other so random paths cannot grow the doc. */
const TOP = new Set(['home', 'brand', 'assets', 'deliveries', 'apps', 'calendar', 'research', 'ask', 'requests', 'accesses',
  'settings', 'onboarding', 'report', 'learn', 'resources', 'wishlist', 'plan', 'account', 'alerts', 'pay', 'team', 'admin', 'open', 'conectar']);
const PATH_RE = /^\/[a-z0-9:_-]{1,30}(\/[a-z0-9:_-]{1,30}){0,2}$/;
const SECTION_RE = /^[a-z]{1,20}$/;
const BRAND_RE = /^[A-Za-z0-9_-]{1,64}$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

type Item = { path?: unknown; section?: unknown; brandId?: unknown; device?: unknown; day?: unknown; n?: unknown };

let brandCache: { at: number; ids: Set<string> } | null = null;
async function brandIds(): Promise<Set<string>> {
  if (brandCache && Date.now() - brandCache.at < BRAND_TTL) return brandCache.ids;
  const snap = await db.collection('brands').select().get();
  brandCache = { at: Date.now(), ids: new Set(snap.docs.map((d) => d.id)) };
  return brandCache.ids;
}

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** The client's local day, if it is within a day of the server's; otherwise the server's (UTC). */
function dayOf(v: unknown): string {
  const now = Date.now();
  const ok = [isoDay(now - 864e5), isoDay(now), isoDay(now + 864e5)];
  return typeof v === 'string' && DAY_RE.test(v) && ok.includes(v) ? v : ok[1];
}

function pathOf(v: unknown): string {
  if (typeof v !== 'string' || !PATH_RE.test(v)) return '/other';
  return TOP.has(v.split('/')[1]) ? v : '/other';
}

export const pageViews = new Hono<AuthEnv>();

/** POST /v1/usage { items: [{ path, section, brandId, device, day, n }] } → 204. Role comes from the user's profile, not the body. */
pageViews.post('/usage', async (c) => {
  const body = await c.req.json<{ items?: Item[] }>().catch(() => null);
  const items = Array.isArray(body?.items) ? body!.items.slice(0, MAX_ITEMS) : [];
  if (!items.length) return c.body(null, 204);
  try {
    const role = (await db.doc(`users/${c.get('user').uid}`).get()).get('role') === 'admin' ? 'admin' : 'client';
    const known = await brandIds();
    const perDay = new Map<string, { views: Record<string, number>; brands: Record<string, number> }>();
    for (const it of items) {
      const n = Math.min(MAX_N, Math.max(0, Math.floor(Number(it?.n) || 0)));
      if (!n) continue;
      const device = it.device === 'phone' ? 'phone' : 'desktop';
      const section = typeof it.section === 'string' && SECTION_RE.test(it.section) ? it.section : 'other';
      const brand = typeof it.brandId === 'string' && BRAND_RE.test(it.brandId) && known.has(it.brandId) ? it.brandId : 'none';
      const day = dayOf(it.day);
      const acc = perDay.get(day) ?? { views: {}, brands: {} };
      const vKey = `${role}|${device}|${section}|${pathOf(it.path)}`;
      const bKey = `${brand}|${role}`;
      acc.views[vKey] = (acc.views[vKey] ?? 0) + n;
      acc.brands[bKey] = (acc.brands[bKey] ?? 0) + n;
      perDay.set(day, acc);
    }
    const batch = db.batch();
    for (const [day, acc] of perDay) {
      const inc = (m: Record<string, number>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, FieldValue.increment(v)]));
      batch.set(db.doc(`pageViews/${day}`), { day, views: inc(acc.views), brands: inc(acc.brands), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    if (perDay.size) await batch.commit();
  } catch (e) {
    logError(e, { where: 'pageViews' });
  }
  return c.body(null, 204);
});
