import type { Day, DailyKey, StatPost } from './useSocialStats';

export type Period = '30' | '90' | 'month' | 'lastMonth' | 'all';
export type Range = { from: string; to: string };

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (s: string, n: number) => { const d = new Date(`${s}T12:00:00`); d.setDate(d.getDate() + n); return iso(d); };
export const daysBetween = (a: string, b: string) => Math.round((+new Date(`${b}T12:00:00`) - +new Date(`${a}T12:00:00`)) / 864e5) + 1;

/** The period's dates, ending on the last day with data (Metricool runs a day behind), and the same length right before it. */
export function rangeOf(p: Period, daily: Day[]): { cur: Range; prev: Range | null } {
  const last = daily.at(-1)?.d ?? iso(new Date());
  const first = daily[0]?.d ?? last;
  let cur: Range;
  if (p === 'all') cur = { from: first, to: last };
  else if (p === 'month') cur = { from: `${last.slice(0, 8)}01`, to: last };
  else if (p === 'lastMonth') { const end = addDays(`${last.slice(0, 8)}01`, -1); cur = { from: `${end.slice(0, 8)}01`, to: end }; }
  else cur = { from: addDays(last, 1 - Number(p)), to: last };
  const n = daysBetween(cur.from, cur.to);
  const prev = p === 'all' ? null : { from: addDays(cur.from, -n), to: addDays(cur.from, -1) };
  return { cur, prev: prev && prev.to >= first ? prev : null };
}

export const inRange = (d: string, r: Range) => d >= r.from && d <= r.to.slice(0, 10) + '￿';

/** Followers is a level (last known value); everything else adds up over the days. */
export function total(daily: Day[], key: DailyKey, r: Range): number | null {
  const rows = daily.filter((x) => inRange(x.d, r) && x[key] != null);
  if (!rows.length) return null;
  return key === 'followers' ? rows.at(-1)![key]! : rows.reduce((n, x) => n + (x[key] ?? 0), 0);
}

/** Followers at the start of the range (last value before it, else its first). */
export function followersAt(daily: Day[], r: Range) {
  const before = daily.filter((x) => x.d < r.from && x.followers != null).at(-1);
  return before?.followers ?? daily.find((x) => inRange(x.d, r) && x.followers != null)?.followers ?? null;
}

export const change = (now: number | null, before: number | null) => (now == null || before == null || before === 0 ? null : Math.round(((now - before) / before) * 100));

/** Points for the chart: by day up to ~45 days, by week up to ~200, else by month. */
export function series(daily: Day[], key: DailyKey, r: Range) {
  const rows = daily.filter((x) => inRange(x.d, r));
  const n = daysBetween(r.from, r.to);
  const bucket = n <= 45 ? (d: string) => d : n <= 200 ? (d: string) => { const x = new Date(`${d}T12:00:00`); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return iso(x); } : (d: string) => d.slice(0, 7);
  const out = new Map<string, number | null>();
  for (const x of rows) {
    const k = bucket(x.d), v = x[key];
    if (v == null) { if (!out.has(k)) out.set(k, null); continue; }
    out.set(k, key === 'followers' ? v : (out.get(k) ?? 0) + v);
  }
  return { unit: n <= 45 ? 'day' as const : n <= 200 ? 'week' as const : 'month' as const, points: [...out].map(([k, v]) => ({ k, v })) };
}

export const postsIn = (posts: StatPost[], r: Range) => posts.filter((p) => inRange(p.date.slice(0, 10), r));
/** Which daily keys a network has any value for (LinkedIn has no stories, YouTube no reach…). */
export const keysOf = (daily: Day[]) => new Set(daily.flatMap((x) => Object.keys(x).filter((k) => k !== 'd' && x[k as DailyKey] != null)) as DailyKey[]);
