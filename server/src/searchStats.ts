// Google search results from Search Console, read server-side with the braindy-api service account (added as a Restricted user on each property).
// One document per brand in brands/{brandId}/webStats/gsc: clicks, impressions and position by day (they add up, so any period
// is computed in the app; position is weighted by impressions) and the top searches and pages for 30/90/365 days.
// Shown in Results › Website only where NickMark switched Results on, like the Google Analytics numbers.
import { GoogleAuth } from 'google-auth-library';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';

const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
export const SEARCH_PERIODS = ['30', '90', '365'] as const;
const LISTS = { queries: 'query', pages: 'page', devices: 'device' } as const;

type Row = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };
const day = (offset: number) => new Date(Date.now() - offset * 864e5).toISOString().slice(0, 10);
const r1 = (x: number) => Math.round(x * 10) / 10;

async function query(site: string, body: Record<string, unknown>) {
  const client = await auth.getClient();
  const r = await client.request<{ rows?: Row[] }>({
    url: `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    method: 'POST', data: { dataState: 'all', ...body },
  });
  return r.data.rows ?? [];
}

/** Reads the property and replaces the brand's search stats (days merge with what is stored; Search Console keeps 16 months). */
export async function syncSearchStats(brandId: string) {
  const brand = await db.doc(`brands/${brandId}`).get();
  const site = String(brand.get('gscSite') ?? '');
  if (!/^(sc-domain:|https?:\/\/)/.test(site)) throw new Error(`${brandId} no tiene propiedad de Search Console`);
  const daily = (await query(site, { startDate: day(480), endDate: day(1), dimensions: ['date'], rowLimit: 1000 }))
    .map((r) => ({ d: r.keys![0]!, clicks: r.clicks, impr: r.impressions, pos: r1(r.position) }));
  const lists: Record<string, Record<string, Array<{ name: string; n: number; i: number; pos: number }>>> = {};
  for (const p of SEARCH_PERIODS) {
    lists[p] = {};
    for (const [k, dim] of Object.entries(LISTS)) {
      const rows = await query(site, { startDate: day(+p), endDate: day(1), dimensions: [dim], rowLimit: k === 'devices' ? 5 : 15 });
      lists[p][k] = rows.map((r) => ({ name: r.keys![0]!.slice(0, 200), n: r.clicks, i: r.impressions, pos: r1(r.position) }));
    }
  }

  const ref = db.doc(`brands/${brandId}/webStats/gsc`);
  const merged = new Map<string, Record<string, unknown>>(((await ref.get()).get('daily') ?? []).map((x: { d: string }) => [x.d, x]));
  for (const x of daily) merged.set(x.d, x);
  const all = [...merged.values()].sort((a, b) => String(a.d).localeCompare(String(b.d))).slice(-1100);
  await ref.set({ site, daily: all, lists, updatedAt: FieldValue.serverTimestamp() });
  const last30 = all.filter((x) => String(x.d) >= day(30)).reduce((n, x) => n + Number(x.clicks ?? 0), 0);
  return { days: all.length, from: all[0]?.d ?? null, to: all.at(-1)?.d ?? null, clicks30: last30 };
}

/** Every brand with a Search Console property, one after the other; a failing property doesn't stop the rest. */
export async function syncAllSearchStats() {
  const brands = await db.collection('brands').where('gscSite', '!=', '').select('name').get();
  const out: Array<{ brandId: string; ok: boolean; note: string }> = [];
  for (const b of brands.docs) {
    try { const r = await syncSearchStats(b.id); out.push({ brandId: b.id, ok: true, note: `${r.days} días, ${r.clicks30} clics en 30 días` }); }
    catch (e) { out.push({ brandId: b.id, ok: false, note: (e as Error).message.slice(0, 200) }); }
  }
  return out;
}
