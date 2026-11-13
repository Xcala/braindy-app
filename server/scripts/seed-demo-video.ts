// Copies ONE real brand (default caobos) from `braindy-app` (read-only) into the LOCAL emulators, plus a
// local client owner, for recording the client tour video. Writes only to the emulators.
//   SEED_FIRESTORE_EMULATOR=127.0.0.1:8081 SEED_AUTH_EMULATOR=127.0.0.1:9099 npx tsx server/scripts/seed-demo-video.ts
// Local-only test login: video-demo@braindy.test / demo-local-only
// Access secrets live in accessSecrets/* and are never read: only access metadata is copied.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const emu = { firestore: process.env.SEED_FIRESTORE_EMULATOR, auth: process.env.SEED_AUTH_EMULATOR };
if (!emu.firestore || !emu.auth) throw new Error('Set SEED_FIRESTORE_EMULATOR and SEED_AUTH_EMULATOR (host:port)');
const BID = process.env.SEED_BRAND ?? 'caobos';

// 1 · read from production (no emulator env set while reading)
const prod = getFirestore(initializeApp({ credential: applicationDefault(), projectId: 'braindy-brand-guideline' }, 'prod'), 'braindy-app');
const docs: Array<{ path: string; data: FirebaseFirestore.DocumentData }> = [];
/** What goes on video: logins can be tax IDs or account numbers, and the client's people keep their emails. */
function masked(sub: string, x: FirebaseFirestore.DocumentData) {
  if (sub === 'accesses') return { ...x, username: '•••' };
  if (sub === 'members' && x.email) return { ...x, email: String(x.email).replace(/^(.)[^@]*/, '$1•••'), ...(x.name ? { name: String(x.name).includes('@') ? String(x.name).replace(/^(.)[^@]*/, '$1•••') : String(x.name).split(' ')[0] } : {}) };
  return x;
}
const brand = await prod.doc(`brands/${BID}`).get();
if (!brand.exists) throw new Error(`brand ${BID} not found`);
docs.push({ path: brand.ref.path, data: brand.data()! });
for (const sub of ['context', 'members', 'assets', 'links', 'reports', 'insights', 'siteChanges', 'settings', 'accesses', 'accessLog', 'socialPosts', 'brainEvents', 'meetings', 'folders', 'uploads', 'contracts', 'invoices', 'people', 'brains', 'approvals', 'analysis', 'launches', 'siteComments', 'socialStats', 'notices']) {
  (await prod.collection(`brands/${BID}/${sub}`).limit(1000).get()).docs.forEach((d) => docs.push({ path: d.ref.path, data: masked(sub, d.data()) }));
}
// legacy assets (market maps, logo decks) can fall past the 1000 limit of big brands
(await prod.collection(`brands/${BID}/assets`).where('source', '==', 'legacy').get()).docs.forEach((d) => docs.push({ path: d.ref.path, data: d.data() }));
for (const r of (await prod.collection(`brands/${BID}/requests`).orderBy('createdAt', 'desc').limit(40).get()).docs) {
  docs.push({ path: r.ref.path, data: r.data() });
  for (const sub of ['versions', 'comments']) {
    (await r.ref.collection(sub).get()).docs.forEach((d) => docs.push({ path: d.ref.path, data: d.data() }));
  }
}
console.log(`read ${docs.length} docs of ${BID} from production`);

// 2 · write to the emulators
process.env.FIRESTORE_EMULATOR_HOST = emu.firestore;
process.env.FIREBASE_AUTH_EMULATOR_HOST = emu.auth;
const local = initializeApp({ projectId: 'braindy-brand-guideline' }, 'local');
const ldb = getFirestore(local, 'braindy-app');
for (const d of docs) await ldb.doc(d.path).set(d.data);

const uid = 'video-demo', email = 'video-demo@braindy.test';
try { await getAuth(local).getUser(uid); } catch { await getAuth(local).createUser({ uid, email, password: 'demo-local-only', displayName: brand.data()!.name }); }
await ldb.doc(`users/${uid}`).set({ email, name: brand.data()!.name, role: 'client', brandIds: [BID] });
await ldb.doc(`brands/${BID}/members/${uid}`).set({ role: 'client_owner', canApprove: true });
console.log(`seeded ${docs.length} docs + local client owner ${email}`);
