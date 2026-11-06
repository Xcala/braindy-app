// Loads a Metricool export (normalized JSON pulled through the Metricool connector in Claude) into brands/{id}/socialStats,
// the same write the connector tool braindy_social_stats_sync does. Idempotent (days merge, posts upsert by id).
// Usage: tsx scripts/load-metricool-stats.ts <export.json> [--dry-run] [--enable]   (--enable switches Results on for the brand)
import { readFileSync } from 'node:fs';
import { db } from '../src/firebase.js';
import { syncSocialStats, type StatsInput } from '../src/connector/socialStats.js';

type Row = Record<string, number | string | null>;
type Export = { brandId: string; networks: Record<string, { handle?: string; daily: Row[]; posts?: Row[]; audience?: StatsInput['audience'] }> };
const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const ex = JSON.parse(readFileSync(args[0]!, 'utf8')) as Export;
// Metricool export names → the keys Braindy stores.
const RENAME: Record<string, string> = { accountsEngaged: 'engaged', followersGained: 'gained', followersLost: 'lost', newFollowers: 'gained', pageImpressions: 'pageViews' };
const country = new Intl.DisplayNames(['en'], { type: 'region' });
/** Every audience list is stored as each row's share of all followers, per ten thousand (Metricool gives shares 0–1 or counts).
 *  ISO codes become names; 'Others' and unknown go (after the shares are taken, so the rest keep their true share). */
function list(rows?: Array<{ name: string; n: number; share?: number }>) {
  if (!rows?.length) return rows;
  const sum = rows.reduce((a, x) => a + x.n, 0) || 1;
  const share = (x: { n: number; share?: number }) => x.share ?? (rows.every((y) => y.n <= 1) ? x.n : x.n / sum);
  return rows.filter((x) => !/^(others?|zz|unknown)$/i.test(x.name))
    .map((x) => ({ name: /^[A-Z]{2}$/.test(x.name) ? country.of(x.name) ?? x.name : x.name, n: Math.round(share(x) * 10000) }));
}
/** Age and gender as share per ten thousand, from counts when Metricool gives them. */
function ageGender(rows?: Array<{ age: string; gender: string; v: number; n?: number }>) {
  if (!rows?.length) return rows;
  const val = (x: { v: number; n?: number }) => x.n ?? x.v;
  const sum = rows.reduce((a, x) => a + val(x), 0) || 1;
  return rows.map((x) => ({ age: x.age, gender: x.gender, v: Math.round((val(x) / sum) * 10000) }));
}

if (!(await db.doc(`brands/${ex.brandId}`).get()).exists) throw new Error(`No existe la marca ${ex.brandId}`);
for (const [network, n] of Object.entries(ex.networks)) {
  const daily = n.daily.map((d) => Object.fromEntries(Object.entries(d).map(([k, v]) => [RENAME[k] ?? k, v])));
  const withData = daily.filter((d) => Object.entries(d).some(([k, v]) => k !== 'd' && v != null)).length;
  console.log(`${ex.brandId} · ${network}: ${daily.length} días (${withData} con datos), ${n.posts?.length ?? 0} publicaciones, ${n.audience?.countries?.length ?? 0} países`);
  const a = n.audience as Record<string, Array<{ name: string; n: number }>> | undefined;
  const audience = a && { ...Object.fromEntries(Object.entries(a).filter(([k]) => k !== 'ageGender').map(([k, v]) => [k, list(v)])), ageGender: ageGender(n.audience?.ageGender) };
  if (!dry) console.log('  →', await syncSocialStats(ex.brandId, network, { handle: n.handle ?? undefined, daily, posts: n.posts, audience }));
}
if (args.includes('--enable') && !dry) {
  await db.doc(`brands/${ex.brandId}`).set({ resultsOn: true }, { merge: true });
  console.log('Resultados activado para', ex.brandId);
}
console.log(dry ? 'DRY RUN: nada escrito.' : 'Listo.');
