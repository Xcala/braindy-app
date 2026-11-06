// Links each brand to its Google Analytics 4 property (brands/{id}.gaPropertyId). Idempotent; --dry-run prints only.
// Usage: tsx scripts/set-ga-properties.ts [--dry-run]
import { db } from '../src/firebase.js';

const MAP: Record<string, string> = {
  quimiolab: '399281454', 'revista-level': '394414363', milohas: '560776290', braindy: '370713514', caobos: '393662371',
  'hacienda-parrilla-bar': '507252452', 'puerta-del-sol': '506922767', 'casa-en-el-aire': '514975213', 'window-tinting': '512350696',
};
const dry = process.argv.includes('--dry-run');
for (const [id, prop] of Object.entries(MAP)) {
  const b = await db.doc(`brands/${id}`).get();
  if (!b.exists) { console.log(`✗ ${id}: no existe`); continue; }
  const was = b.get('gaPropertyId');
  console.log(`${was === prop ? '=' : '→'} ${id}: ${prop}${was && was !== prop ? ` (antes ${was})` : ''} · resultados ${b.get('resultsOn') ? 'sí' : 'no'}`);
  if (!dry && was !== prop) await b.ref.set({ gaPropertyId: prop }, { merge: true });
}
console.log(dry ? 'DRY RUN: nada escrito.' : 'Listo.');
