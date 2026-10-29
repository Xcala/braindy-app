// Creates the "Marcas personales" group and hangs the 16 personal brands from it (braindy-app only).
// Idempotent; --dry-run prints the report without writing.
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
const db = getFirestore(initializeApp({ projectId: 'braindy-brand-guideline' }), 'braindy-app');
const dry = process.argv.includes('--dry-run');
const GROUP = 'marcas-personales';
const CHILDREN = ['adriana-penuela-useche', 'andrea-carmona', 'andrea-perez', 'ms-dyer', 'claudia-rojas', 'cote', 'fernanda-gil', 'ivana', 'jema',
  'ariza-abogados', 'mariana-duenas', 'monica-bautista', 'nadia-olea', 'namen-vargas', 'rocio-suarez', 'rusmila-okuale'];

const batch = db.batch();
const g = await db.doc(`brands/${GROUP}`).get();
if (!g.exists) batch.set(g.ref, { kind: 'group', groupId: null, name: 'Marcas personales', logoUrl: null, slug: GROUP, ancestors: [], status: 'active', descendants: CHILDREN, createdAt: FieldValue.serverTimestamp() });
else batch.update(g.ref, { descendants: FieldValue.arrayUnion(...CHILDREN) });
let moved = 0, already = 0, skipped: string[] = [];
for (const id of CHILDREN) {
  const d = await db.doc(`brands/${id}`).get();
  if (!d.exists) { skipped.push(`${id} (missing)`); continue; }
  if (d.get('groupId') === GROUP) { already++; continue; }
  if (d.get('groupId')) { skipped.push(`${id} (already in ${d.get('groupId')})`); continue; }
  batch.update(d.ref, { groupId: GROUP, ancestors: [GROUP] }); moved++;
}
console.log(`${dry ? 'DRY RUN · ' : ''}group: ${g.exists ? 'exists' : 'create'} · move: ${moved} · already in group: ${already} · skipped: ${skipped.length ? skipped.join(', ') : 0}`);
if (!dry) await batch.commit();
