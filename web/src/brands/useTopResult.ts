import { useBrandDoc } from './useBrandDoc';

type Day = { d: string; [k: string]: number | string };
export type TopResult = { key: 'visits' | 'impr' | 'clicks'; value: number; change: number | null };

/** Sum of one field over the last 28 days of data and over the 28 days before (dates are YYYY-MM-DD). */
function windows(daily: Day[] | undefined, field: string) {
  if (!daily?.length) return null;
  const last = daily.map((x) => x.d).sort().at(-1)!;
  const day = (n: number) => new Date(Date.parse(`${last}T12:00:00Z`) - n * 86400000).toISOString().slice(0, 10);
  const cut = day(28), prevCut = day(56);
  let now = 0, before = 0;
  for (const x of daily) {
    const v = Number(x[field]) || 0;
    if (x.d > cut) now += v; else if (x.d > prevCut) before += v;
  }
  return { now, before };
}

/**
 * The strongest web result of a brand in its last 28 days (2026-11-20): site visits (GA4), times it showed on Google
 * and clicks from Google (Search Console). It picks the one that grew the most against the 28 days before; with no
 * growth, the biggest number. Null when the brand has no results or this person cannot see them (rules hide them).
 */
export function useTopResult(brandId: string, on: boolean): TopResult | null {
  const ga4 = useBrandDoc(on ? brandId : undefined, 'webStats/ga4').data as { daily?: Day[] } | null;
  const gsc = useBrandDoc(on ? brandId : undefined, 'webStats/gsc').data as { daily?: Day[] } | null;
  if (!on) return null;
  const all: TopResult[] = [];
  const add = (key: TopResult['key'], w: ReturnType<typeof windows>) => {
    if (!w || w.now <= 0) return;
    all.push({ key, value: w.now, change: w.before > 0 ? Math.round(((w.now - w.before) / w.before) * 100) : null });
  };
  add('visits', windows(ga4?.daily, 'users'));
  add('impr', windows(gsc?.daily, 'impr'));
  add('clicks', windows(gsc?.daily, 'clicks'));
  if (!all.length) return null;
  const grew = all.filter((r) => (r.change ?? 0) > 0).sort((a, b) => b.change! - a.change!);
  return grew[0] ?? all.sort((a, b) => b.value - a.value)[0]!;
}
