// Links each brand to its Search Console property (brands/{id}.gscSite). Idempotent; --dry-run prints only.
// Usage: tsx scripts/set-gsc-sites.ts [--dry-run]
import { db } from '../src/firebase.js';

const MAP: Record<string, string> = {
  quimiolab: 'sc-domain:quimiolab.com', milohas: 'sc-domain:milohaspastries.com', 'revista-level': 'https://www.revistalevel.com.co/',
  caobos: 'http://gimnasioloscaobos.com/', braindy: 'sc-domain:braindy.co', tinyroots: 'sc-domain:tinyroots.com.co',
  legadus: 'sc-domain:legadus.co', 'ms-dyer': 'sc-domain:msdyer.com',
};
const dry = process.argv.includes('--dry-run');
for (const [id, site] of Object.entries(MAP)) {
  const b = await db.doc(`brands/${id}`).get();
  if (!b.exists) { console.log(`✗ ${id}: no existe`); continue; }
  const was = b.get('gscSite');
  console.log(`${was === site ? '=' : '→'} ${id}: ${site}${was && was !== site ? ` (antes ${was})` : ''} · resultados ${b.get('resultsOn') ? 'sí' : 'no'}`);
  if (!dry && was !== site) await b.ref.set({ gscSite: site }, { merge: true });
}
console.log(dry ? 'DRY RUN: nada escrito.' : 'Listo.');
