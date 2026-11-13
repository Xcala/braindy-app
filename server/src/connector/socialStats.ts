// Social media results, mirrored from Metricool by the Braindy connector (there is no Metricool API on our plan).
// One document per network in brands/{brandId}/socialStats/{network}: daily evolution, every post with its numbers, audience.
// Shown in Results only for brands where NickMark switched Results on (brands/{id}.resultsOn).
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';

export const STAT_NETWORKS = ['instagram', 'facebook', 'linkedin', 'youtube', 'tiktok', 'twitter', 'threads', 'pinterest', 'gmb'] as const;
/** Daily keys the app knows how to show; anything else is dropped. */
export const DAILY_KEYS = ['followers', 'views', 'reach', 'interactions', 'posts', 'stories', 'engaged', 'gained', 'lost', 'clicks', 'likes', 'comments', 'shares', 'saves', 'watchMinutes', 'reels', 'feedPosts', 'pageViews'] as const;
/** Audience lists: where followers are, and on LinkedIn who they are professionally. */
export const AUDIENCE_LISTS = ['countries', 'cities', 'industry', 'seniority', 'function', 'companySize'] as const;
const POST_KEYS = ['views', 'reach', 'likes', 'comments', 'saves', 'shares', 'interactions', 'engagement', 'clicks', 'watchTime', 'follows'] as const;

export interface StatsInput {
  handle?: string;
  daily: Array<Record<string, number | string | null>>;
  posts?: Array<Record<string, number | string | null>>;
  audience?: { ageGender?: Array<{ age: string; gender: string; v: number }> } & Partial<Record<(typeof AUDIENCE_LISTS)[number], Array<{ name: string; n: number }>>>;
}

const num = (v: unknown) => (v == null || v === '' || !isFinite(Number(v)) ? null : Math.round(Number(v) * 100) / 100);
const httpsUrl = (u: unknown) => (typeof u === 'string' && /^https:\/\//i.test(u) ? u.slice(0, 600) : '');
const str = (v: unknown, n: number) => String(v ?? '').slice(0, n);

/** Replaces one network's stats. Days merge with what is stored (a later sync of a short range keeps older days). */
export async function syncSocialStats(brandId: string, network: string, input: StatsInput) {
  const net = network.toLowerCase();
  if (!(STAT_NETWORKS as readonly string[]).includes(net)) throw new Error(`Red no soportada: ${network}`);
  const ref = db.doc(`brands/${brandId}/socialStats/${net}`);
  const prev = (await ref.get()).data() ?? {};
  const days = new Map<string, Record<string, number | null | string>>((prev.daily ?? []).map((d: { d: string }) => [d.d, d]));
  for (const row of input.daily) {
    const d = str(row.d, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const clean: Record<string, number | null | string> = { d };
    for (const k of DAILY_KEYS) if (row[k] !== undefined) clean[k] = num(row[k]);
    days.set(d, { ...(days.get(d) ?? {}), ...clean });
  }
  const daily = [...days.values()].sort((a, b) => String(a.d).localeCompare(String(b.d))).slice(-1100);
  const posts = new Map<string, Record<string, unknown>>((prev.posts ?? []).map((p: { id: string }) => [p.id, p]));
  for (const p of input.posts ?? []) {
    const id = str(p.id, 80).replace(/[^\w:.-]/g, '');
    if (!id) continue;
    const clean: Record<string, unknown> = { id, date: str(p.date, 25), type: str(p.type, 20).toLowerCase(), text: str(p.text, 280), image: httpsUrl(p.image), url: httpsUrl(p.url) };
    for (const k of POST_KEYS) clean[k] = num(p[k]);
    posts.set(id, clean);
  }
  const postList = [...posts.values()].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 600);
  const top = (l?: Array<{ name: string; n: number }>) => (l ?? []).filter((x) => x.name).map((x) => ({ name: str(x.name, 60), n: num(x.n) ?? 0 })).sort((a, b) => b.n - a.n).slice(0, 15);
  const audience = input.audience ? {
    ...Object.fromEntries(AUDIENCE_LISTS.map((k) => [k, top(input.audience![k])])),
    ageGender: (input.audience.ageGender ?? []).map((x) => ({ age: str(x.age, 10), gender: str(x.gender, 2).toUpperCase(), v: num(x.v) ?? 0 })).slice(0, 30),
  } : prev.audience ?? null;
  await ref.set({ network: net, handle: str(input.handle ?? prev.handle, 80), daily, posts: postList, audience, source: 'metricool', updatedAt: FieldValue.serverTimestamp() });
  await db.doc(`brands/${brandId}`).set({ socialStatsAt: FieldValue.serverTimestamp() }, { merge: true });
  return { days: daily.length, posts: postList.length, from: daily[0]?.d ?? '', to: daily.at(-1)?.d ?? '' };
}
