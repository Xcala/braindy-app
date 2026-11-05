// End-to-end of the Brand Brain feed through a RUNNING braindy-api on LOCAL EMULATORS ONLY (demo- project id).
// Each action must leave its event in brands/{id}/brainEvents with the right area, and nothing internal may land there.
//   GOOGLE_CLOUD_PROJECT=demo-braindy FIRESTORE_EMULATOR_HOST=… FIREBASE_AUTH_EMULATOR_HOST=… FIREBASE_STORAGE_EMULATOR_HOST=…
//   API_URL=http://localhost:8798 [BRAND=demo-uno] [PAUSE_MS=2500] npx tsx scripts/e2e-brain-events.ts
const project = process.env.GOOGLE_CLOUD_PROJECT ?? '';
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST || !project.startsWith('demo-')) throw new Error('emulators only');
const API = process.env.API_URL ?? 'http://localhost:8798';
const B = process.env.BRAND ?? 'demo-uno';
const PAUSE = Number(process.env.PAUSE_MS ?? 0); // time to watch each event arrive on /brand/brain
const { adminAuth, db } = await import('../src/firebase.js');
const { getStorage } = await import('firebase-admin/storage');

async function user(email: string) {
  const u = await adminAuth.getUserByEmail(email).catch(() => adminAuth.createUser({ email, password: 'local-e2e-only', emailVerified: true }));
  const r = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'local-e2e-only', returnSecureToken: true }) });
  return { uid: u.uid, token: ((await r.json()) as { idToken: string }).idToken };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const call = async (token: string, method: string, path: string, body?: unknown): Promise<{ status: number; json: any }> => {
  const res = await fetch(`${API}${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, json: await res.json().catch(() => null) };
};
const check = (label: string, ok: boolean, extra: unknown = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} · ${label}`, ok ? '' : JSON.stringify(extra)); if (!ok) process.exitCode = 1; };
const pause = () => new Promise((r) => setTimeout(r, PAUSE));
const events = db.collection(`brands/${B}/brainEvents`);
const newest = async (n: number) => (await events.orderBy('at', 'desc').limit(n).get()).docs.map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>);

// Setup: an admin, a client owner of the brand, a published version to decide on, and a folder the client does not see.
const admin = await user('admin@brain.e2e');
const client = await user('owner@brain.e2e');
await db.doc(`users/${admin.uid}`).set({ role: 'admin', email: 'admin@brain.e2e' });
await db.doc(`users/${client.uid}`).set({ email: 'owner@brain.e2e', name: 'Cliente E2E', brandIds: [B] }, { merge: true });
await db.doc(`brands/${B}`).set({ name: 'Demo Uno', kind: 'brand', fileAccess: { mode: 'selected', folders: ['Entregas'] } }, { merge: true });
await db.doc(`brands/${B}/members/${client.uid}`).set({ role: 'client_owner' });

// 1 · a request
const req = await call(client.token, 'POST', `/v1/brands/${B}/requests`, { category: 'social', title: 'Lanzamiento de temporada', cards: { product: { text: 'Un post para el lanzamiento' } } });
check('client creates a request', req.status === 200, req);
const rid = req.json?.requestId as string;
const e1 = (await events.doc(`req-${rid}`).get()).data();
check('request → event request · work', e1?.kind === 'request' && e1?.area === 'work' && e1?.text === 'Lanzamiento de temporada', e1);
await pause();

// 2 · approve one version, ask for changes on another
const version = (n: number) => ({ n, files: [], notes: `Versión ${n}`, reason: 'El contraste guía la mirada al producto.', brain: 'creator', published: true, approval: { state: 'pending' }, createdAt: new Date() });
await db.doc(`brands/${B}/requests/${rid}/versions/v1`).set(version(1));
await db.doc(`brands/${B}/requests/${rid}/versions/v2`).set(version(2));
const ch = await call(client.token, 'POST', `/v1/brands/${B}/requests/${rid}/versions/v1/decision`, { state: 'changes_requested', note: 'Más grande el logo, por favor.' });
check('client asks for changes', ch.status === 200, ch);
const e2 = (await events.doc(`ver-${rid}-v1-changes_requested`).get()).data();
check('changes → event changed · work, with the client note', e2?.kind === 'changed' && e2?.area === 'work' && String(e2?.text).includes('Más grande el logo'), e2);
await pause();
const ap = await call(client.token, 'POST', `/v1/brands/${B}/requests/${rid}/versions/v2/decision`, { state: 'approved' });
check('client approves', ap.status === 200, ap);
const e3 = (await events.doc(`ver-${rid}-v2-approved`).get()).data();
check('approval → event approved · work', e3?.kind === 'approved' && e3?.area === 'work' && String(e3?.text).includes('contraste'), e3);
await pause();

// 3 · Mi marca from the admin editor (one tab per save, as the panel does)
const before = (await events.where('kind', '==', 'identity').get()).size;
const col = await call(admin.token, 'POST', `/v1/admin/brands/${B}/identity`, { colors: [{ hex: '#0097D6', name: 'Azul' }, { hex: '#001A4D', name: 'Noche' }, { hex: '#F5B301', name: 'Sol' }] });
check('admin saves colors', col.status === 200, col);
await pause();
const voice = await call(admin.token, 'POST', `/v1/admin/brands/${B}/identity`, { voice: { essence: { title: 'Cercana y clara' }, keyLanguage: ['hecho a mano'] } });
check('admin saves tone and voice', voice.status === 200, voice);
await pause();
const strat = await call(admin.token, 'POST', `/v1/admin/brands/${B}/identity`, { strategy: { position: 'La marca local que explica', avoid: 'Nunca usar fotos de stock genéricas' } });
check('admin saves strategy', strat.status === 200, strat);
const ids = (await newest(6)).filter((e) => e.kind === 'identity');
const areaOf = (p: string) => ids.find((e) => (e.parts as string[] | undefined)?.includes(p))?.area;
check('Mi marca → identity · identity (colors), voice (voice), strategy, rules (avoid)',
  areaOf('colors') === 'identity' && areaOf('voice') === 'voice' && areaOf('strategy') === 'strategy' && areaOf('avoid') === 'rules'
  && (await events.where('kind', '==', 'identity').get()).size - before === 4, ids);
await pause();

// 4 · a file from the app (signed upload), and one NickMark keeps in a folder the client does not see
async function upload(token: string, fileName: string, folder?: string) {
  const start = await call(token, 'POST', `/v1/brands/${B}/uploads`, { fileName, size: 11, contentType: 'text/plain', ...(folder ? { folder } : {}) });
  if (start.status !== 200) return { start };
  let put = (await fetch(start.json.url as string, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: 'hola brain!' })).status;
  if (put === 501) { // the Storage emulator does not take signed-URL PUTs: put the same bytes at the same path, as the browser would
    const path = decodeURIComponent(new URL(start.json.url as string).pathname).split('/').slice(2).join('/');
    await getStorage().bucket('braindy-app-files').file(path).save('hola brain!', { contentType: 'text/plain' });
    put = 200;
  }
  const done = await call(token, 'POST', `/v1/brands/${B}/uploads/${start.json.assetId}/complete`);
  return { start, put, done, assetId: start.json.assetId as string };
}
const up = await upload(client.token, 'brief-lanzamiento.txt');
check('client uploads a file', up.done?.status === 200, up);
const e4 = up.assetId ? (await events.doc(`file-${up.assetId}`).get()).data() : undefined;
check('upload → event file · work', e4?.kind === 'file' && e4?.area === 'work' && e4?.text === 'brief-lanzamiento.txt', e4);
const hidden = await upload(admin.token, 'costos-internos.txt', 'Interno');
check('admin uploads to a folder the client does not see', hidden.done?.status === 200, hidden);
check('hidden file leaves no event', !!hidden.assetId && !(await events.doc(`file-${hidden.assetId}`).get()).exists);

// Nothing internal in the feed, and every event is dated.
const all = (await events.get()).docs.map((d) => d.data());
check('no internal text in the feed', !all.some((e) => /costos-internos/i.test(String(e.text ?? ''))), all.map((e) => e.text));
check('every event has its date', all.every((e) => !!e.at));
console.log(process.exitCode ? 'Brain feed: FAILED' : `Brain feed: all checks passed (${all.length} events in ${B})`);
process.exit();
