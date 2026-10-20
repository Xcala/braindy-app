// Copies a few real brands from `braindy-app` (read-only) into the LOCAL emulators for visual QA,
// and creates a local test admin. Never writes to production.
//   FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST must point at the emulators.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const emu = { firestore: process.env.SEED_FIRESTORE_EMULATOR, auth: process.env.SEED_AUTH_EMULATOR };
if (!emu.firestore || !emu.auth) throw new Error('Set SEED_FIRESTORE_EMULATOR and SEED_AUTH_EMULATOR (host:port)');

// 1 · read from production (no emulator env set while reading)
const prod = getFirestore(initializeApp({ credential: applicationDefault(), projectId: 'braindy-brand-guideline' }, 'prod'), 'braindy-app');
const ids = (process.env.SEED_BRANDS ?? 'legadus,grupo-berrio,grupo-ibmt,ipark,quimiolab,taxcan').split(',');
const docs: Array<{ path: string; data: FirebaseFirestore.DocumentData }> = [];
for (const id of ids) {
  const b = await prod.doc(`brands/${id}`).get();
  if (!b.exists) continue;
  docs.push({ path: b.ref.path, data: b.data()! });
  for (const sub of ['context', 'members']) {
    (await prod.collection(`brands/${id}/${sub}`).get()).docs.forEach((d) => docs.push({ path: d.ref.path, data: d.data() }));
  }
  (await prod.collection(`brands/${id}/assets`).where('source', '==', 'legacy').get()).docs.forEach((d) => docs.push({ path: d.ref.path, data: d.data() }));
  (await prod.collection(`brands/${id}/assets`).where('folder', '==', '').limit(40).get()).docs.forEach((d) => docs.push({ path: d.ref.path, data: d.data() }));
  for (const r of (await prod.collection(`brands/${id}/requests`).orderBy('createdAt', 'desc').limit(25).get()).docs) {
    docs.push({ path: r.ref.path, data: r.data() });
    for (const sub of ['versions', 'comments']) {
      (await r.ref.collection(sub).get()).docs.forEach((d) => docs.push({ path: d.ref.path, data: d.data() }));
    }
  }
}
console.log(`read ${docs.length} docs from production`);

// 2 · write to the emulators
process.env.FIRESTORE_EMULATOR_HOST = emu.firestore;
process.env.FIREBASE_AUTH_EMULATOR_HOST = emu.auth;
const local = initializeApp({ projectId: 'braindy-brand-guideline' }, 'local');
const ldb = getFirestore(local, 'braindy-app');
for (const d of docs) await ldb.doc(d.path).set(d.data);

const email = 'qa-admin@braindy.test';
const password = process.env.SEED_PASSWORD ?? 'qa-local-only';
let user;
try { user = await getAuth(local).getUserByEmail(email); } catch { user = await getAuth(local).createUser({ email, password, displayName: 'QA Admin' }); }
await ldb.doc(`users/${user.uid}`).set({ email, name: 'QA Admin', role: 'admin', brandIds: [] });
console.log(`seeded ${docs.length} docs + local admin ${email}`);
