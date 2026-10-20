// Copies a few real brands from `braindy-app` (read-only) into the LOCAL emulators for visual QA,
// and creates a local test admin. Never writes to production.
//   FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST must point at the emulators.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const emu = { firestore: process.env.SEED_FIRESTORE_EMULATOR, auth: process.env.SEED_AUTH_EMULATOR };
if (!emu.firestore || !emu.auth) throw new Error('Set SEED_FIRESTORE_EMULATOR and SEED_AUTH_EMULATOR (host:port)');

// 1 · read from production (no emulator env set while reading). SEED_OFFLINE=1 uses synthetic brands instead.
const offline = process.env.SEED_OFFLINE === '1';
const prod = getFirestore(initializeApp({ credential: applicationDefault(), projectId: 'braindy-brand-guideline' }, 'prod'), 'braindy-app');
const ids = (process.env.SEED_BRANDS ?? 'legadus,grupo-berrio,grupo-ibmt,ipark,quimiolab,taxcan').split(',');
const docs: Array<{ path: string; data: FirebaseFirestore.DocumentData }> = [];
for (const id of offline ? [] : ids) {
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
if (offline) {
  const now = new Date();
  const brand = (id: string, name: string, extra: Record<string, unknown> = {}) => docs.push({ path: `brands/${id}`, data: { name, slug: id, kind: 'brand', groupId: null, ancestors: [], status: 'active', logoUrl: null, legacyIds: {}, createdAt: now, ...extra } });
  brand('grupo-demo', 'Grupo Demo', { kind: 'group' });
  brand('demo-uno', 'Demo Uno', { groupId: 'grupo-demo', ancestors: ['grupo-demo'] });
  brand('demo-dos', 'Demo Dos', { groupId: 'grupo-demo', ancestors: ['grupo-demo'] });
  docs.push({ path: 'brands/demo-uno/context/identity', data: { colors: [{ hex: '#0097D6', name: 'Azul' }, { hex: '#001A4D', name: 'Noche' }], typography: [{ fontFamily: 'Poppins', type: 'google', role: 'Headlines' }] } });
  for (const [i, status] of ['in_production', 'to_approve', 'approved'].entries()) {
    docs.push({ path: `brands/demo-uno/requests/r${i}`, data: { title: `Pieza de prueba ${i + 1}`, status, stage: status === 'to_approve' ? 'clientApproval' : status === 'approved' ? 'approved' : 'work', leadBrain: 'creator', helperBrains: ['marketer'], approvalLevel: 'self', versionCount: 2, latestVersion: 'v2', category: 'social', createdAt: now, updatedAt: now, ...(status === 'approved' ? { approvedAt: now } : {}) } });
    for (const n of [1, 2]) docs.push({ path: `brands/demo-uno/requests/r${i}/versions/v${n}`, data: { n, files: [{ name: `v${n}.png`, contentType: 'image/png', url: `https://placehold.co/800x600/${n === 1 ? '0097D6' : '001A4D'}/FFFFFF/png?text=v${n}` }], notes: `Versión ${n}`, reason: 'Contraste y jerarquía más claros.', brain: 'creator', published: true, approval: { state: n === 1 ? 'changes_requested' : 'pending' }, createdAt: now } });
  }
  docs.push({ path: 'brands/demo-uno/requests/r1/comments/c1', data: { author: 'seed', text: 'Más grande el logo, por favor.', versionId: 'v1', kind: 'changes_requested', createdAt: now } });
}
console.log(`read ${docs.length} docs from ${offline ? 'synthetic seed' : 'production'}`);

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
