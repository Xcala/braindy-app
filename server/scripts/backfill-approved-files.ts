// Files every already-approved version into "Entregas aprobadas/<request>" (braindy-app only), like an approval does now.
// Idempotent (fixed asset ids); --dry-run counts without writing; --brand <id> limits it to one brand.
import { db } from '../src/firebase.js';
import { fileApproved } from '../src/approvedFiles.js';

const dry = process.argv.includes('--dry-run');
const only = process.argv.includes('--brand') ? process.argv[process.argv.indexOf('--brand') + 1] : null;
let versions = 0, added = 0, none = 0;
const brands = only ? [only] : (await db.collection('brands').select().get()).docs.map((d) => d.id);
for (const brandId of brands) {
  const approved = await db.collection(`brands/${brandId}/requests`).where('status', 'in', ['approved', 'published']).get();
  for (const req of approved.docs) {
    const vers = await req.ref.collection('versions').where('approval.state', '==', 'approved').get();
    for (const v of vers.docs) {
      versions++;
      const n = await fileApproved(brandId, req.id, v.id, dry);
      n ? added += n : none++;
      if (n) console.log(`${brandId} · ${req.get('title')} · ${v.id} → ${n} archivo(s)`);
    }
  }
}
console.log(`${dry ? 'DRY RUN · ' : ''}versiones aprobadas: ${versions} · archivos nuevos: ${added} · sin archivos nuevos (ya estaban o solo enlaces): ${none}`);
