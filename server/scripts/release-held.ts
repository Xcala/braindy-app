// Lists (default, dry run) or releases (--apply) the versions held «Para tu ojo» of one brand: each one is published to
// the client exactly as «Approve and send» does (requests.publishVersion). Idempotent: a released request is no longer held.
//   npx tsx scripts/release-held.ts --brand <brandId|name words> [--only-site] [--apply]
import { db } from '../src/firebase.js';
import { publishVersion } from '../src/requests.js';
import { adminUids } from '../src/push/send.js';

const arg = (k: string) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] ?? '' : ''; };
const apply = process.argv.includes('--apply'), onlySite = process.argv.includes('--only-site');
const want = arg('--brand').toLowerCase();
if (!want) { console.error('Missing --brand'); process.exit(1); }

const brands = (await db.collection('brands').select('name').get()).docs.filter((b) => b.id === want || String(b.get('name') ?? '').toLowerCase().includes(want));
if (brands.length !== 1) { console.error(`Expected one brand, found ${brands.length}: ${brands.map((b) => `${b.id} (${b.get('name')})`).join(', ')}`); process.exit(1); }
const brand = brands[0]!;
const uid = (await adminUids())[0] ?? 'script';
const held = (await db.collection(`brands/${brand.id}/requests`).where('held.versionId', '>', '').get()).docs;
let done = 0, skipped = 0, failed = 0;
console.log(`${apply ? 'APPLY' : 'DRY RUN'} · ${brand.get('name')} (${brand.id}) · ${held.length} held`);
for (const r of held) {
  const title = String(r.get('title') ?? ''), v = String(r.get('held.versionId'));
  const site = r.get('siteAdjust') === true || /^\s*(ajuste del sitio|site adjustment)\b/i.test(title);
  if (r.get('archived') || r.get('cancelled') || (onlySite && !site)) { skipped++; console.log(`  skip  ${r.id} · ${title.slice(0, 70)}${site ? '' : ' (not a site adjustment)'}`); continue; }
  if (!apply) { done++; console.log(`  would release ${r.id} ${v} · ${title.slice(0, 70)} · ${r.get('held.why') ?? ''}`); continue; }
  const out = await publishVersion(brand.id, r.id, v, uid);
  if ('error' in out) { failed++; console.log(`  FAILED ${r.id} ${v} · ${out.error}`); continue; }
  done++; console.log(`  released ${r.id} ${v} · ${title.slice(0, 60)} · notice ${JSON.stringify(out.notice).slice(0, 80)}`);
}
console.log(`${apply ? 'Released' : 'Would release'} ${done} · skipped ${skipped} · failed ${failed}`);
process.exit(0);
