// Fills the Open Graph preview image of every brand link that has none yet (braindy-app only).
// Idempotent; --dry-run reads the images without writing; --all re-checks links that already have one.
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../src/firebase.js';
import { readOgImage } from '../src/og.js';

const dry = process.argv.includes('--dry-run');
const all = process.argv.includes('--all');
let found = 0, none = 0, skipped = 0;
for (const brand of (await db.collection('brands').select().get()).docs) {
  for (const link of (await db.collection(`brands/${brand.id}/links`).get()).docs) {
    if (link.get('ogImage') && !all) { skipped++; continue; }
    const ogImage = await readOgImage(String(link.get('url') ?? ''));
    console.log(`${brand.id} · ${link.get('title')} → ${ogImage ?? '(sin imagen)'}`);
    ogImage ? found++ : none++;
    if (!dry) await link.ref.update({ ogImage: ogImage ?? null, ogCheckedAt: FieldValue.serverTimestamp() });
  }
}
console.log(`${dry ? 'DRY RUN · ' : ''}con imagen: ${found} · sin imagen: ${none} · ya tenían: ${skipped}`);
