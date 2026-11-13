// Website results from Google Analytics 4, read server-side with the braindy-api service account (added as Viewer on each property).
// One document per brand in brands/{brandId}/webStats/ga4: daily numbers, period totals (users don't add up day by day,
// so 30/90/365-day totals and the period before come straight from GA), and top lists per period.
// Shown in Results only where NickMark switched Results on (brands/{id}.resultsOn), like the social numbers.
import { GoogleAuth } from 'google-auth-library';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';

const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/analytics.readonly'] });
const METRICS = ['activeUsers', 'newUsers', 'sessions', 'engagedSessions', 'screenPageViews', 'userEngagementDuration', 'keyEvents'] as const;
/** GA metric → the key Braindy stores. */
const KEY: Record<(typeof METRICS)[number], string> = { activeUsers: 'users', newUsers: 'newUsers', sessions: 'sessions', engagedSessions: 'engaged', screenPageViews: 'views', userEngagementDuration: 'engTime', keyEvents: 'keyEvents' };
export const WEB_PERIODS = ['30', '90', '365'] as const;
/** Top lists: GA dimension, the measure that ranks it, how many rows. */
const LISTS = {
  pages: { dim: 'pagePath', metric: 'screenPageViews', limit: 12 },
  channels: { dim: 'sessionDefaultChannelGroup', metric: 'sessions', limit: 10 },
  sources: { dim: 'sessionSource', metric: 'sessions', limit: 10 },
  countries: { dim: 'country', metric: 'activeUsers', limit: 8 },
  cities: { dim: 'city', metric: 'activeUsers', limit: 8 },
  devices: { dim: 'deviceCategory', metric: 'activeUsers', limit: 4 },
} as const;

type Req = Record<string, unknown>;
type Report = { rows?: Array<{ dimensionValues?: Array<{ value: string }>; metricValues: Array<{ value: string }> }> };
const range = (days: number, offset = 0) => ({ startDate: `${days + offset}daysAgo`, endDate: offset ? `${offset + 1}daysAgo` : 'yesterday' });
const n = (v: string | undefined) => { const x = Number(v); return isFinite(x) ? Math.round(x * 100) / 100 : null; };

/** GA allows five reports per batch call. */
async function batch(propertyId: string, requests: Req[]) {
  const client = await auth.getClient();
  const out: Report[] = [];
  for (let i = 0; i < requests.length; i += 5) {
    const r = await client.request<{ reports: Report[] }>({
      url: `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:batchRunReports`,
      method: 'POST', data: { requests: requests.slice(i, i + 5) },
    });
    out.push(...r.data.reports);
  }
  return out;
}

const metricsOf = (r: { metricValues: Array<{ value: string }> }) =>
  Object.fromEntries(METRICS.map((m, i) => [KEY[m], n(r.metricValues[i]?.value)]));

/** Reads the property and replaces the brand's web stats (days merge with what is stored). */
export async function syncWebStats(brandId: string) {
  const brand = await db.doc(`brands/${brandId}`).get();
  const propertyId = String(brand.get('gaPropertyId') ?? '');
  if (!/^\d{6,12}$/.test(propertyId)) throw new Error(`${brandId} no tiene propiedad de Google Analytics`);
  const metrics = METRICS.map((name) => ({ name }));
  const listKeys = Object.keys(LISTS) as Array<keyof typeof LISTS>;
  const requests: Req[] = [
    { dateRanges: [range(400)], dimensions: [{ name: 'date' }], metrics, limit: 1000 },
    ...WEB_PERIODS.map((p) => ({ dateRanges: [range(+p), range(+p, +p)], metrics })),
    ...WEB_PERIODS.flatMap((p) => listKeys.map((k) => ({
      dateRanges: [range(+p)], dimensions: [{ name: LISTS[k].dim }],
      metrics: [{ name: LISTS[k].metric }, ...(k === 'pages' ? [{ name: 'activeUsers' }] : [])],
      orderBys: [{ metric: { metricName: LISTS[k].metric }, desc: true }], limit: LISTS[k].limit,
    }))),
  ];
  const [daily, ...rest] = await batch(propertyId, requests);
  const totalsR = rest.slice(0, WEB_PERIODS.length);
  const listsR = rest.slice(WEB_PERIODS.length);

  const days = (daily!.rows ?? []).map((r) => {
    const d = r.dimensionValues![0]!.value;
    return { d: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`, ...metricsOf(r) };
  });
  // With two date ranges GA adds a dateRange dimension (date_range_0 = this period, date_range_1 = the one before).
  const totals = Object.fromEntries(WEB_PERIODS.map((p, i) => {
    const rows = totalsR[i]!.rows ?? [];
    const pick = (tag: string) => { const r = rows.find((x) => x.dimensionValues?.[0]?.value === tag); return r ? metricsOf(r) : null; };
    return [p, { cur: pick('date_range_0'), prev: pick('date_range_1') }];
  }));
  const lists = Object.fromEntries(WEB_PERIODS.map((p, i) => [p, Object.fromEntries(listKeys.map((k, j) => {
    const rows = listsR[i * listKeys.length + j]!.rows ?? [];
    return [k, rows.filter((r) => !/^\(not set\)$/.test(r.dimensionValues![0]!.value)).map((r) => ({
      name: r.dimensionValues![0]!.value.slice(0, 200), n: n(r.metricValues[0]!.value) ?? 0,
      ...(k === 'pages' ? { u: n(r.metricValues[1]?.value) ?? 0 } : {}),
    }))];
  }))]));

  const ref = db.doc(`brands/${brandId}/webStats/ga4`);
  const merged = new Map<string, Record<string, unknown>>(((await ref.get()).get('daily') ?? []).map((x: { d: string }) => [x.d, x]));
  for (const x of days) merged.set(x.d, x);
  const all = [...merged.values()].sort((a, b) => String(a.d).localeCompare(String(b.d))).slice(-1100);
  await ref.set({ propertyId, daily: all, totals, lists, updatedAt: FieldValue.serverTimestamp() });
  return { days: all.length, from: all[0]?.d ?? null, to: all.at(-1)?.d ?? null, users30: totals['30']?.cur?.users ?? null };
}

/** Every brand with a GA property, one after the other; a failing property doesn't stop the rest. */
export async function syncAllWebStats() {
  const brands = await db.collection('brands').where('gaPropertyId', '!=', '').select('name').get();
  const out: Array<{ brandId: string; ok: boolean; note: string }> = [];
  for (const b of brands.docs) {
    try { const r = await syncWebStats(b.id); out.push({ brandId: b.id, ok: true, note: `${r.days} días, ${r.users30 ?? 0} usuarios en 30 días` }); }
    catch (e) { out.push({ brandId: b.id, ok: false, note: (e as Error).message.slice(0, 200) }); }
  }
  return out;
}
