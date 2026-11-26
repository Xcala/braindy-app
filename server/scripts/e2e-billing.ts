// End-to-end of cuentas de cobro through the real routes, on LOCAL EMULATORS ONLY (npm run test:billing).
// The Blacky acceptance: 6 cuentas Sept 2026â€“Feb 2027 for 6.500.000 = 5 Ã— 1.083.333 + 1.083.335; past and current
// months issue today, the rest wait; the 3.250.000 advance gives RC-0001; an issued cuenta only voids; the client
// sees only their own brand. Throwaway users and data; never touches the real project.
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { Hono } from 'hono';
import type { AuthEnv } from '../src/auth.js';

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_STORAGE_EMULATOR_HOST) throw new Error('emulators only');
process.env.GOOGLE_CLOUD_PROJECT = 'demo-braindy';
const { adminAuth, db } = await import('../src/firebase.js');
const { requireUser } = await import('../src/auth.js');
const { adminInvoicing, invoicing, publicInvoicing } = await import('../src/invoicing/routes.js');
const { readFile } = await import('../src/invoicing/store.js');
const { todayBogota } = await import('../src/invoicing/money.js');
const app = new Hono<AuthEnv>();
app.route('/public', publicInvoicing);
app.use('/v1/*', requireUser);
app.route('/v1', invoicing);
app.route('/v1/admin', adminInvoicing);

async function user(email: string) {
  const u = await adminAuth.createUser({ email, password: 'local-e2e-only', emailVerified: true });
  const r = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'local-e2e-only', returnSecureToken: true }) });
  return { uid: u.uid, token: ((await r.json()) as { idToken: string }).idToken };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const call = async (token: string, method: string, path: string, body?: unknown): Promise<{ status: number; json: any }> => {
  const res = await app.request(path, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, json: await res.json().catch(() => null) };
};
const check = (label: string, ok: boolean, extra: unknown = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} Â· ${label}`, ok ? '' : JSON.stringify(extra)); if (!ok) process.exitCode = 1; };

const admin = await user('admin@e2e.local');
const owner = await user('owner@e2e.local');
const other = await user('other@e2e.local');
await db.doc(`users/${admin.uid}`).set({ role: 'admin' });
await db.doc('brands/blacky').set({ name: 'Blacky Meals' });
await db.doc('brands/otra').set({ name: 'Otra' });
await db.doc(`brands/blacky/members/${owner.uid}`).set({ role: 'client_owner' });
await db.doc(`brands/otra/members/${other.uid}`).set({ role: 'client_owner' });
const A = admin.token, B = '/v1/admin/brands/blacky/invoicing';

// Issuer + signature + client profile.
let r = await call(A, 'PUT', '/v1/admin/issuers/nicolas', {
  name: 'NicolÃ¡s MÃ¡rquez Villegas', docType: 'CC', docNumber: '1.020.000.000', docCity: 'BogotÃ¡', city: 'BogotÃ¡',
  bank: { bankName: 'Banco E2E', accountType: 'Ahorros', accountNumber: '000011112222', holder: 'NicolÃ¡s MÃ¡rquez Villegas' },
  legalDeclarations: ['No soy responsable de IVA.', 'Declaro que no he contratado trabajadores para esta labor.'], web: 'braindy.co',
});
check('issuer saved, account number masked', r.status === 200 && r.json.issuer.bank.accountNumber === '****2222', r);
r = await call(A, 'PUT', '/v1/admin/issuers/nicolas/signature', { png: `data:image/png;base64,${wavePng().toString('base64')}` });
check('signature saved', r.status === 200, r);
r = await call(A, 'PUT', `${B}/profile`, { legalName: 'Blacky Meals SAS', taxId: '902038455-4', city: 'BogotÃ¡', accountingEmail: '' });
check('profile saved, NIT check digit valid', r.status === 200 && r.json.nitOk === true, r);

// The Blacky agreement.
const agreement = {
  title: 'Branding y Marketing Digital Blacky Meals', concept: 'Servicios de branding y marketing digital para Blacky Meals.',
  packs: [{ name: 'Pack A Â· Marca', description: 'Estrategia e identidad.' }, { name: 'Pack C Â· Brand OS y pauta', description: 'OperaciÃ³n mensual y pauta.' }],
  servicePeriod: { from: '2026-09', to: '2027-02' }, executionPlace: 'BogotÃ¡', totalAmount: 6500000, installments: 6, startMonth: '2026-09', issueDay: 5,
  numberingPrefix: 'BM-06', distributionNote: 'Distribuido en 6 cuentas mensuales', autoSend: false,
};
r = await call(A, 'POST', `${B}/preview`, agreement);
const amounts = (r.json.rows as Array<{ amount: number }>).map((x) => x.amount);
check('preview: 5 Ã— 1.083.333 + 1.083.335 = 6.500.000', JSON.stringify(amounts) === JSON.stringify([1083333, 1083333, 1083333, 1083333, 1083333, 1083335]) && r.json.matches, r.json);
r = await call(A, 'POST', `${B}/agreements`, agreement);
const agId = r.json.id as string;
r = await call(A, 'POST', `${B}/agreements/${agId}/activate`);
check('activate: Septâ€“Nov issued, Decâ€“Feb scheduled', JSON.stringify(r.json.issued) === '["BM-06-01","BM-06-02","BM-06-03"]' && JSON.stringify(r.json.scheduled) === '["BM-06-04","BM-06-05","BM-06-06"]', r.json);
r = await call(A, 'GET', B);
const docs = r.json.docs as Array<{ id: string; number: string; status: string; issueDate: string | null; scheduledDate: string; amount: number; hasPdf: boolean }>;
const today = todayBogota();
check('issued ones carry today\'s date and a PDF', docs.slice(0, 3).every((d) => d.status === 'issued' && d.issueDate === today && d.hasPdf), docs);
check('scheduled ones wait for the 5th of their month', docs.slice(3).map((d) => d.scheduledDate).join() === '2026-12-05,2027-01-05,2027-02-05', docs);
r = await call(A, 'POST', `${B}/agreements/${agId}/activate`);
check('activating twice is refused', r.status === 409, r);
r = await call(A, 'PUT', `${B}/agreements/${agId}`, { stageProgress: [100, 37.4, 80], stageValue: [2500000, 4000000] });
check('stage progress on an active project: whole %, one per stage, with its value', r.status === 200 && JSON.stringify(r.json.stageProgress) === '[100,37]' && JSON.stringify(r.json.stageValue) === '[2500000,4000000]', r.json);

// PDF of cuenta 3 (saved to look at).
const snap = await db.doc('brands/blacky/billingDocs/BM-06-03').get();
const pdf = await readFile(String(snap.get('pdfStoragePath')));
writeFileSync(process.env.E2E_OUT ?? join(tmpdir(), 'e2e-BM-06-03.pdf'), pdf);
check('PDF stored with its hash', pdf.length > 3000 && !!snap.get('pdfHash'));

// Immutable: issuing again is refused; the client cannot see held cuentas yet.
r = await call(A, 'POST', `${B}/docs/BM-06-03/issue`);
check('an issued cuenta cannot be issued again', r.status === 409 && r.json.error === 'already_issued', r);
r = await call(owner.token, 'GET', '/v1/brands/blacky/cuentas');
check('held cuentas wait for NickMark (client sees none yet)', r.status === 200 && r.json.docs.length === 0, r.json);
r = await call(A, 'GET', B);
check('admin screen counts the people who see Billing', r.json.billingPeople === 1, r.json.billingPeople);
// No email or WhatsApp on file: «Enviar» still puts it in the client's app and leaves a notice for the bell.
r = await call(A, 'POST', `${B}/docs/BM-06-01/send`);
const notice = await db.doc('brands/blacky/billingNotices/BM-06-01').get();
check('send without channels releases it to the app and notifies', r.status === 200 && r.json.via.length === 0 && r.json.people === 1 && notice.get('number') === 'BM-06-01', r.json);
r = await call(owner.token, 'GET', '/v1/brands/blacky/cuentas');
check('the client sees the sent cuenta', r.json.docs.length === 1 && r.json.docs[0].number === 'BM-06-01' && !('pdfStoragePath' in r.json.docs[0]), r.json);
r = await call(other.token, 'GET', '/v1/brands/blacky/cuentas');
check('another brand sees nothing', r.status === 403, r);
r = await call(other.token, 'GET', '/v1/brands/blacky/cuentas/BM-06-01/pdf');
check('another brand cannot download', r.status === 403, r);
r = await call(owner.token, 'GET', B);
check('the client cannot use admin routes', r.status === 403, r);

// The emulator cannot sign Storage links (no service account): «allowed» = got past the access check (not 403/404).
const allowed = (x: { status: number }) => x.status !== 403 && x.status !== 404;
// Documents for accounting (RUT, bank certificate…): the admin uploads several, billing people download, others not.
const pdfData = `data:application/pdf;base64,${Buffer.from('%PDF-1.4\n%%EOF').toString('base64')}`;
const f1 = await call(A, 'POST', `${B}/files`, { file: pdfData, name: 'RUT Nicolás.pdf' });
const f2 = await call(A, 'POST', `${B}/files`, { file: pdfData, name: 'Certificación bancaria' });
r = await call(owner.token, 'GET', '/v1/brands/blacky/cuentas/files');
check('admin uploads documents; the client lists them', f1.status === 200 && f2.status === 200 && r.json.files.length === 2 && r.json.files.some((f: { name: string }) => f.name === 'Certificación bancaria.pdf') && !('storagePath' in r.json.files[0]), r.json);
r = await call(owner.token, 'GET', `/v1/brands/blacky/cuentas/files/${f1.json.id}`);
const otherFile = await call(other.token, 'GET', `/v1/brands/blacky/cuentas/files/${f1.json.id}`);
const clientUpload = await call(owner.token, 'POST', `${B}/files`, { file: pdfData, name: 'x' });
check('the client downloads; another brand and client uploads are refused', allowed(r) && otherFile.status === 403 && clientUpload.status === 403, { r, otherFile, clientUpload });
await call(A, 'DELETE', `${B}/files/${f2.json.id}`);
r = await call(owner.token, 'GET', '/v1/brands/blacky/cuentas/files');
check('a removed document stops showing', r.json.files.length === 1, r.json);

// The client's payment proof: «Ya pagué» on a sent cuenta; the admin opens the proof, the client cannot.
r = await call(owner.token, 'POST', '/v1/brands/blacky/cuentas/BM-06-01/paid', { proof: pdfData, date: '2026-09-05', amount: 1000, method: 'Transferencia' });
const claim = r.json.paymentId as string;
const seen = await call(A, 'GET', `${B}/docs/BM-06-01/proofs/${claim}`);
const notClient = await call(owner.token, 'GET', `${B}/docs/BM-06-01/proofs/${claim}`);
check('the client uploads a proof; only the admin opens it', r.status === 200 && allowed(seen) && notClient.status === 403, { r, seen, notClient });

// The 3.250.000 advance â†’ c1â€“c3 paid, 1 peso on c4, recibo RC-0001.
r = await call(A, 'POST', `${B}/payments`, { agreementId: agId, amount: 3250000, date: '2026-09-04', method: 'Transferencia Davivienda', receipt: true });
check('advance gives recibo RC-0001', r.status === 200 && r.json.receipt?.number === 'RC-0001', r.json);
r = await call(A, 'GET', B);
const by = Object.fromEntries((r.json.docs as Array<{ number: string; status: string; paid: number }>).map((d) => [d.number, d]));
check('c1â€“c3 paid, c4 has 1 peso and stays scheduled', ['BM-06-01', 'BM-06-02', 'BM-06-03'].every((n) => by[n].status === 'paid') && by['BM-06-04'].paid === 1 && by['BM-06-04'].status === 'scheduled', by);

// Void: refused with payments; allowed with a reason otherwise, number kept.
r = await call(A, 'POST', `${B}/docs/BM-06-02/void`, { reason: 'prueba' });
check('a paid cuenta cannot be voided', r.status === 409 && r.json.error === 'has_payments', r);
r = await call(A, 'POST', `${B}/docs/BM-06-06/void`, { reason: '' });
check('voiding needs a reason', r.status === 409, r);
r = await call(A, 'POST', `${B}/docs/BM-06-06/void`, { reason: 'Se cobra en otra cuenta' });
const num = await db.doc('issuers/nicolas/numbers/BM-06-06').get();
check('voided, the number stays used', r.status === 200 && num.exists, r);

// Public link (as sent to accounting): unknown token is refused.
const pub = await app.request('/public/billing/abcdefghijklmnopqrstuvwxyz012345');
check('a wrong public link is refused', pub.status === 404);

// USA profile: USD in cents, English invoice, its own receipt numbering, same signature reused.
r = await call(A, 'PUT', '/v1/admin/issuers/nicolas-us', {
  name: 'NicolÃ¡s MÃ¡rquez Villegas', docType: 'EIN', docNumber: '00-0000000', city: 'Miami, FL', address: '100 E2E St, Miami, FL 33101',
  bank: { bankName: 'E2E Bank', accountType: 'Checking', accountNumber: '000099998888', holder: 'NicolÃ¡s MÃ¡rquez Villegas', routingNumber: '000000000', swift: 'E2EBUS33' },
});
check('USA profile saved (EIN, account masked)', r.status === 200 && r.json.issuer.docType === 'EIN' && r.json.issuer.bank.accountNumber === '****8888', r);
r = await call(A, 'PUT', '/v1/admin/issuers/nicolas-us/signature', { copyFrom: 'nicolas' });
check('USA profile reuses the Colombian signature', r.status === 200, r);
r = await call(A, 'GET', '/v1/admin/issuers');
check('both profiles listed with their currency', r.json.issuers.map((x: { id: string; currency: string; issuer: { hasSignature: boolean } }) => `${x.id}:${x.currency}:${x.issuer?.hasSignature}`).join() === 'nicolas:COP:true,nicolas-us:USD:true', r.json);
await call(A, 'PUT', '/v1/admin/brands/otra/invoicing/profile', { legalName: 'Otra Inc', taxId: '12-3456789' });
r = await call(A, 'POST', '/v1/admin/brands/otra/invoicing/agreements', { ...agreement, issuerId: 'nicolas-us', title: 'Website', totalAmount: 650000, numberingPrefix: 'OT-01', executionPlace: 'United States' });
const usId = r.json.id as string;
r = await call(A, 'POST', `/v1/admin/brands/otra/invoicing/agreements/${usId}/activate`);
check('USD agreement activates (3 issued, 3 scheduled)', r.json.issued?.length === 3 && r.json.scheduled?.length === 3, r.json);
const us1 = (await db.doc('brands/otra/billingDocs/OT-01-01').get()).data()!;
check('USD invoice: cents, currency and English words', us1.amount === 108333 && us1.currency === 'USD' && us1.amountWords === 'ONE THOUSAND EIGHTY-THREE AND 33/100 US DOLLARS', us1);
writeFileSync(process.env.E2E_OUT_US ?? join(tmpdir(), 'e2e-OT-01-01.pdf'), await readFile(String(us1.pdfStoragePath)));
r = await call(A, 'POST', '/v1/admin/brands/otra/invoicing/payments', { agreementId: usId, amount: 108333, date: today, method: 'ACH', receipt: true });
check('USD payment gives its own receipt RC-US-0001', r.json.receipt?.number === 'RC-US-0001', r.json);

// Card payment: a held cuenta cannot be paid; Stripe is not reachable here (503). The webhook is simulated: the card
// fee line (paid by the client) is not recorded as payment; the cuenta is paid and its recibo goes out by itself.
r = await call(other.token, 'POST', '/v1/brands/otra/cuentas/OT-01-03/checkout', { lang: 'en' });
const heldPay = r.status;
await call(A, 'POST', '/v1/admin/brands/otra/invoicing/docs/OT-01-02/send');
r = await call(other.token, 'POST', '/v1/brands/otra/cuentas/OT-01-02/checkout', { lang: 'en' });
check('card checkout: held cuenta refused, no Stripe here', heldPay === 409 && r.status === 503, { heldPay, r });
const { onCuentaPaid, cardFee } = await import('../src/invoicing/card.js');
const fee = cardFee(108333);
await onCuentaPaid({ id: 'cs_test_1', payment_status: 'paid', amount_total: 108333 + fee, metadata: { kind: 'cuenta', brandId: 'otra', docId: 'OT-01-02', amount: '108333', fee: String(fee) } });
const paid2 = (await db.doc('brands/otra/billingDocs/OT-01-02').get()).data()!;
const rc2 = (await db.doc('brands/otra/billingDocs/RC-US-0002').get()).data();
check('card payment: cuenta paid without the fee, recibo sent to the app', paid2.status === 'paid' && paid2.paid === 108333 && rc2?.amount === 108333 && rc2?.held === false && /Stripe/.test(String(paid2.payments.at(-1).method)), { status: paid2.status, paid: paid2.paid, rc2: rc2 && { amount: rc2.amount, held: rc2.held } });

// NickMark sets the state by hand: in mora, back on time (the daily check leaves it), paid.
const OA = '/v1/admin/brands/otra/invoicing';
r = await call(A, 'POST', `${OA}/docs/OT-01-03/overdue`, { on: true });
const mora = r.json.status;
r = await call(A, 'POST', `${OA}/docs/OT-01-03/overdue`, { on: false });
const back = (await db.doc('brands/otra/billingDocs/OT-01-03').get()).data()!;
check('mora by hand, then back on time (and the daily check leaves it)', mora === 'overdue' && r.json.status !== 'overdue' && back.overdueOff === true, { mora, r: r.json });
r = await call(A, 'POST', `${OA}/payments`, { docIds: ['OT-01-03'], amount: back.amount - (back.paid ?? 0), date: todayBogota(), method: 'Transfer', receipt: false });
const p3 = (await db.doc('brands/otra/billingDocs/OT-01-03').get()).data()!;
check('«Pagada» on one cuenta records what it still owed', r.status === 200 && p3.status === 'paid' && p3.paid === p3.amount, { r, p3: p3.status });

function wavePng() {
  const crc = (b: Buffer) => { let c = ~0; for (const x of b) { c ^= x; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1; } return ~c >>> 0; };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]); const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const W = 300, H = 90, raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) raw.set([20, 30, 60, Math.abs(y - 45 - 30 * Math.sin(x / 25)) < 2 ? 255 : 0], y * (W * 4 + 1) + 1 + x * 4);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
process.exit();
