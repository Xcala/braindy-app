// End-to-end of the contract flow through the real routes, on LOCAL EMULATORS ONLY (npm run test:contracts).
// Creates throwaway users in the auth emulator; never touches the real project.
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Hono } from 'hono';
import { getStorage } from 'firebase-admin/storage';
import type { AuthEnv } from '../src/auth.js';
import { deflateSync } from 'node:zlib';

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_STORAGE_EMULATOR_HOST) throw new Error('emulators only');
// The demo project id keeps the Admin SDK on the emulators; set it before the app modules load.
process.env.GOOGLE_CLOUD_PROJECT = 'demo-braindy';
const { adminAuth, db } = await import('../src/firebase.js');
const { requireUser } = await import('../src/auth.js');
const { contracts } = await import('../src/contracts/routes.js');
const { adminContracts } = await import('../src/contracts/admin.js');
const { withClient } = await import('../src/contracts/terms.js');
const app = new Hono<AuthEnv>();
app.use('/v1/*', requireUser);
app.route('/v1', contracts);
app.route('/v1/admin', adminContracts);

async function user(email: string) {
  const u = await adminAuth.createUser({ email, password: 'local-e2e-only', emailVerified: true });
  const r = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'local-e2e-only', returnSecureToken: true }) });
  return { uid: u.uid, token: ((await r.json()) as { idToken: string }).idToken };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const call = async (token: string, method: string, path: string, body?: unknown): Promise<{ status: number; json: any }> => {
  const res = await app.request(path, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Forwarded-For': '203.0.113.9', 'User-Agent': 'e2e-test' }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, json: await res.json().catch(() => null) };
};
const check = (label: string, ok: boolean, extra: unknown = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} · ${label}`, ok ? '' : JSON.stringify(extra)); if (!ok) process.exitCode = 1; };

const admin = await user('admin@e2e.local');
const rep = await user('rep@e2e.local');
const other = await user('other@e2e.local');
await db.doc(`users/${admin.uid}`).set({ role: 'admin' });
await db.doc('brands/e2e').set({ name: 'Marca E2E' });
await db.doc(`brands/e2e/members/${rep.uid}`).set({ role: 'client_member' });
await db.doc(`brands/e2e/members/${other.uid}`).set({ role: 'client_member' });
await db.doc('config/contractor').set({ nombre: 'Contratista Prueba', tipoDoc: 'C.C.', doc: '000', correo: 'c@e2e.local', direccion: 'Dirección prueba' });
const sig = `data:image/png;base64,${wavePng().toString('base64')}`;
const C = (id: string, rest = '') => `/v1/admin/brands/e2e/contracts/${id}${rest}`;

const created = await call(admin.token, 'POST', '/v1/admin/brands/e2e/contracts', { preset: 'brand3m' });
check('admin creates draft', created.status === 200, created);
const id = created.json.id as string;
check('brand moves to step contract', (await db.doc('brands/e2e').get()).get('onboarding.step') === 'contract');
check('client cannot create', (await call(rep.token, 'POST', '/v1/admin/brands/e2e/contracts', {})).status === 403);
const early = await call(admin.token, 'POST', C(id, '/send'));
check('send refuses missing terms and signature', early.status === 400 && early.json.fields.includes('signer.email') && early.json.fields.includes('signature'), early.json);
const saved = await call(admin.token, 'POST', C(id), {
  // Only what the one-step form asks: the total, contact and approvers are filled in at send.
  terms: { objeto: 'estrategia e identidad', 'plazo.inicio': '2026-11-02', 'plazo.meses': '3', 'pago.cuota': '4.000.000' },
  signer: { email: 'REP@e2e.local', name: 'Rep Prueba' }, scope: '1. Identidad\n2. Manual',
});
check('admin saves draft', saved.status === 200, saved);
check('send without your signature refused', (await call(admin.token, 'POST', C(id, '/send'))).status === 400);
check('admin signs and sends', (await call(admin.token, 'POST', C(id, '/send'), { signature: sig })).status === 200);
check('draft locked after send', (await call(admin.token, 'POST', C(id), { scope: 'x' })).status === 409);

const sent = (await db.doc(`brands/e2e/contracts/${id}`).get()).data()!;
check('sent with contractor signature', !!sent.signatures?.contractor?.imagePath && sent.signatures.contractor.consent.includes('CONTRATISTA'));
check('total, date and contact filled in', sent.terms['valor.monto'] === '12000000' && sent.terms['cliente.aprobadores'] === 'Rep Prueba'
  && String(sent.sentText).includes('$12.000.000 COP') && String(sent.sentText).includes('2 de noviembre de 2026') && String(sent.sentText).includes('por $4.000.000 COP'));
check('schedule starts the week of the start date', sent.schedule.start === '2026-11-02');
const client = { razonSocial: 'Marca E2E S.A.S.', nit: '000-1', direccion: 'Calle prueba', representante: 'Rep Prueba', tipoDoc: 'C.C.', doc: '111', cargo: 'Representante legal' };
// Same replacement the web page does (web/src/contracts/text.ts), written out here so a server bug cannot hide.
const seen = String(sent.sentText).replace(/\{\{cliente\.(\w+)\}\}/g, (_, k: string) => ({ ...client, correo: 'rep@e2e.local' } as Record<string, string>)[k] ?? '________');
check('server fills client data like the page', withClient(sent.sentText, { ...client, correo: 'rep@e2e.local' }) === seen && !seen.includes('{{') && seen.includes('Marca E2E S.A.S.'));
const hash = createHash('sha256').update(seen).digest('hex');
const S = `/v1/brands/e2e/contracts/${id}/sign`;
check('other member cannot sign', (await call(other.token, 'POST', S, { client, signature: sig, consent: true, textHash: hash })).status === 403);
check('admin cannot sign as client', (await call(admin.token, 'POST', S, { client, signature: sig, consent: true })).status === 403);
check('no consent refused', (await call(rep.token, 'POST', S, { client, signature: sig, consent: false, textHash: hash })).status === 400);
check('wrong hash refused', (await call(rep.token, 'POST', S, { client, signature: sig, consent: true, textHash: 'abc' })).status === 409);
const signed = await call(rep.token, 'POST', S, { client, signature: sig, consent: true, textHash: hash });
check('signer signs and that closes it', signed.status === 200 && signed.json.textHash === hash && !!signed.json.pdf?.sha256, signed);
check('cannot sign twice', (await call(rep.token, 'POST', S, { client, signature: sig, consent: true })).status === 409);
check('cannot reopen after signed', (await call(admin.token, 'POST', C(id, '/reopen'))).status === 409);

const final = (await db.doc(`brands/e2e/contracts/${id}`).get()).data()!;
check('status signed with pdf', final.status === 'signed' && !!final.pdf?.sha256);
check('sealed text has the client data and no blanks', String(final.text).includes('Marca E2E S.A.S.') && !String(final.text).includes('{{') && !String(final.text).includes('________'));
check('ip and browser recorded', final.signatures.client.ip === '203.0.113.9' && final.signatures.client.userAgent === 'e2e-test');
check('brand moves to kickoff', (await db.doc('brands/e2e').get()).get('onboarding.step') === 'kickoff');
check('live schedule and checklist created', (await db.doc('brands/e2e/context/schedule').get()).exists && (await db.doc('brands/e2e/context/kickoff').get()).get('items').length > 0);
check('signed contract is immutable', (await call(admin.token, 'POST', C(id), { scope: 'x' })).status === 409);
check('member ticks checklist', (await call(other.token, 'POST', '/v1/brands/e2e/kickoff/k1', { done: true })).status === 200);
check('member without billing cannot download', (await call(other.token, 'GET', `/v1/brands/e2e/contracts/${id}/pdf`)).status === 403);
const [bytes] = await getStorage().bucket('braindy-app-files').file(final.pdf.storagePath).download();
check('stored pdf matches its hash', createHash('sha256').update(bytes).digest('hex') === final.pdf.sha256);
if (process.env.E2E_PDF_OUT) writeFileSync(process.env.E2E_PDF_OUT, bytes);
const dl = await call(rep.token, 'GET', `/v1/brands/e2e/contracts/${id}/pdf`).catch((e) => ({ status: 0, json: String(e) }));
console.log('signer download (signed URLs need a service account; Cloud Run has one):', dl.status, dl.json?.url ? 'url ok' : dl.json);

// A contract signed outside Braindy, uploaded by NickMark for an existing client (no onboarding).
const { PDFDocument } = await import('pdf-lib');
const outside = await PDFDocument.create(); outside.addPage().drawText('Contrato firmado fuera de Braindy');
const outsideB64 = Buffer.from(await outside.save()).toString('base64');
await db.doc('brands/e2e-old').set({ name: 'Cliente antiguo' });
const U = '/v1/admin/brands/e2e-old/signed-contracts';
const upBody = { pdf: outsideB64, fileName: 'Contrato 2026.pdf', title: 'Plan 2026', signedOn: '2026-03-15', clientName: 'Rep', clientRole: 'Representante legal' };
check('client cannot upload a signed contract', (await call(rep.token, 'POST', U, upBody)).status === 403);
check('upload refuses a file that is not a PDF', (await call(admin.token, 'POST', U, { ...upBody, pdf: Buffer.from('x'.repeat(2000)).toString('base64') })).status === 400);
const up = await call(admin.token, 'POST', U, upBody);
check('admin uploads a signed contract', up.status === 200, up);
const old = (await db.doc('brands/e2e-old').get()).data()!;
const upDoc = (await db.doc(`brands/e2e-old/contracts/${up.json.id}`).get()).data()!;
check('uploaded contract is signed and linked, brand stays out of onboarding', upDoc.status === 'signed' && upDoc.source === 'external' && old.onboarding.contractId === up.json.id && old.onboarding.step === 'live');
const [upBytes] = await getStorage().bucket('braindy-app-files').file(upDoc.pdf.storagePath).download();
check('uploaded pdf stored as sent', createHash('sha256').update(upBytes).digest('hex') === upDoc.pdf.sha256 && upBytes.toString('base64') === outsideB64);

/** A drawn-looking signature (a wave) as a real PNG, so the PDF embeds an image like the browser sends. */
function wavePng() {
  const crc = (b: Buffer) => { let c = ~0; for (const x of b) { c ^= x; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1; } return ~c >>> 0; };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]); const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const W = 300, H = 90, raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * (W * 4 + 1) + 1 + x * 4;
    raw.set([20, 30, 60, Math.abs(y - 45 - 30 * Math.sin(x / 25)) < 2 ? 255 : 0], i);
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
