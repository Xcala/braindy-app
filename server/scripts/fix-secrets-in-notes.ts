// Moves credentials pasted in the (plain text) notes of an access into its encrypted value (Cloud KMS),
// and leaves the rest of the notes. Never prints or logs values: only brand, platform and counts.
// Idempotent: once moved, the notes no longer match. If the access already has a value, the moved lines are appended.
//   npx tsx scripts/fix-secrets-in-notes.ts            (dry-run report)
//   npx tsx scripts/fix-secrets-in-notes.ts --write    (needs encrypt/decrypt on the KMS key `accesses`)
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { open, seal } from '../src/vault.js';
import { splitSecretLines } from '../src/lib/secrets.js';

const write = process.argv.includes('--write');
const app = initializeApp({ credential: applicationDefault(), projectId: 'braindy-brand-guideline' });
const db = getFirestore(app, 'braindy-app');
let scanned = 0, found = 0, fixed = 0;

const brands = await db.collection('brands').select().get();
for (const b of brands.docs) {
  const accesses = await b.ref.collection('accesses').get();
  for (const a of accesses.docs) {
    scanned++;
    const { secret, rest } = splitSecretLines(String(a.get('notes') ?? ''));
    if (!secret) continue;
    found++;
    console.log(`${write ? 'moving' : 'would move'}: ${b.id} / ${a.get('platform')} (${secret.split('\n').length} line(s))`);
    if (!write) continue;
    const aad = `brands/${b.id}/accesses/${a.id}`;
    const secretRef = db.doc(`accessSecrets/${b.id}__${a.id}`);
    let value = secret.replace(/\n+/g, ' ');
    if (a.get('hasSecret') === true) {
      const s = await secretRef.get();
      if (s.exists) value = `${await open(s.get('ciphertext'), aad, s.get('scheme'))} ${value}`;
    }
    const sealed = await seal(value, aad);
    await secretRef.set({ ...sealed, brandId: b.id, accessId: a.id, updatedAt: FieldValue.serverTimestamp() });
    await a.ref.update({ notes: rest, hasSecret: true, updatedAt: FieldValue.serverTimestamp(), updatedByName: 'Braindy (seguridad)' });
    await b.ref.collection('accessLog').doc().set({
      accessId: a.id, platform: a.get('platform'), action: 'updated', by: 'system', byName: 'Braindy (seguridad)', at: FieldValue.serverTimestamp(),
    });
    fixed++;
  }
}
console.log(`\nScanned ${scanned} accesses · ${found} with credentials in notes · ${write ? `${fixed} moved to the encrypted value` : 'dry-run, nothing written'}`);
