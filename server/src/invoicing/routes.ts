// Cuentas de cobro y recibos over HTTP.
// Admin (/v1/admin): issuer, client billing profile, agreements (import from a sample, preview, draft, activate),
// cuentas (issue now, send, void, PDF), payments and recibos.
// Client (/v1): billing people of the brand list their cuentas, download the PDF and say «Ya pagué» with a proof.
// Public (/public): the tokenized link sent to accounting redirects to a short signed URL of the frozen PDF.
import { randomUUID } from 'node:crypto';
import { Hono, type MiddlewareHandler } from 'hono';
import { db } from '../firebase.js';
import { brandAccess } from '../access.js';
import type { AuthEnv } from '../auth.js';
import { signaturePng } from '../contracts/store.js';
import { adminUids, pushTo } from '../push/send.js';
import { mask, nitValid, planOf } from './money.js';
import { activate, issueDoc, pdfLink, sendDoc } from './issue.js';
import { billingPeople as peopleWithBilling } from './notifyBilling.js';
import { billingFileRoutes, dataFile } from './files.js';
import { cardFeePct, cuentaCheckout } from './card.js';
import { claimPaid, confirmClaim, recordPayment, voidDoc } from './payments.js';
import { extractSample } from './importSample.js';
import {
  DEFAULT_ISSUER, ISSUERS, agreementProblems, isIssuerId, issuerStyle, agreementsCol, audit, docsCol, issuerRef, now, pickAgreement, pickIssuer, pickProfile, profileRef, saveFile, sha256,
  type BillingDoc, type Issuer,
} from './store.js';

const err = (e: unknown) => { const m = e instanceof Error ? e.message : String(e); return /^[a-z_]+$/.test(m) ? m : 'failed'; };

/** What a doc looks like outside the server: no storage paths, tokens or proof paths. */
export function publicDoc(id: string, d: BillingDoc & Record<string, unknown>) {
  return {
    id, type: d.type, number: d.number, index: d.index, of: d.of, billingMonth: d.billingMonth, scheduledDate: d.scheduledDate, issueDate: d.issueDate,
    amount: d.amount, amountWords: d.amountWords, currency: d.currency ?? 'COP', status: d.status, held: !!d.held, paid: d.paid ?? 0, hasPdf: !!d.pdfStoragePath, sentVia: d.sentVia ?? [], paidOn: d.paidOn ?? null,
    voidReason: d.voidReason ?? null, covers: (d.covers ?? []).map((c) => ({ number: c.number, amount: c.amount })), agreementId: d.agreementId,
    pendingProof: !!d.pendingProof,
    payments: (d.payments ?? []).map((p) => ({ id: p.id, date: p.date, amount: p.amount, method: p.method, status: p.status, hasProof: !!p.proofStoragePath })),
  };
}
const issuerView = (i: Partial<Issuer>) => ({
  ...i, bank: { ...(i.bank ?? { bankName: '', accountType: '', holder: '' }), accountNumber: mask(i.bank?.accountNumber) },
  hasSignature: !!i.signatureStoragePath, hasLogo: !!i.logoStoragePath, signatureStoragePath: undefined, logoStoragePath: undefined,
});

// ---------------- admin ----------------
export const adminInvoicing = new Hono<AuthEnv>();
const isAdmin = async (uid: string) => (await db.doc(`users/${uid}`).get()).get('role') === 'admin';
const adminOnly: MiddlewareHandler<AuthEnv> = async (c, next) => {
  if (!(await isAdmin(c.get('user').uid))) return c.json({ error: 'forbidden' }, 403);
  await next();
};
adminInvoicing.use('/issuers/*', adminOnly);
adminInvoicing.use('/brands/:brandId/invoicing/*', adminOnly);
adminInvoicing.use('/brands/:brandId/invoicing', adminOnly);
adminInvoicing.use('/invoicing/*', adminOnly);

/** Both profiles (Colombia and USA) with what each charges in. */
adminInvoicing.get('/issuers', async (c) => {
  const list = await Promise.all((Object.keys(ISSUERS) as Array<keyof typeof ISSUERS>).map(async (id) => {
    const s = await issuerRef(id).get();
    return { id, country: ISSUERS[id], ...issuerStyle({ country: ISSUERS[id] }), issuer: s.exists ? issuerView(s.data() as Issuer) : null };
  }));
  return c.json({ issuers: list });
});
adminInvoicing.get('/issuers/:id', async (c) => {
  if (!isIssuerId(c.req.param('id'))) return c.json({ error: 'not_found' }, 404);
  const s = await issuerRef(c.req.param('id')).get();
  return c.json({ issuer: s.exists ? issuerView(s.data() as Issuer) : null });
});
adminInvoicing.put('/issuers/:id', async (c) => {
  const id = c.req.param('id');
  if (!isIssuerId(id)) return c.json({ error: 'not_found' }, 404);
  const ref = issuerRef(id);
  const prev = ((await ref.get()).data() ?? {}) as Partial<Issuer>;
  const b = await c.req.json<Record<string, unknown>>().catch(() => ({} as Record<string, unknown>));
  const next = pickIssuer(b, prev, ISSUERS[id]);
  // The account number comes back masked: an empty or masked value keeps the stored one.
  if (!next.bank.accountNumber || String((b.bank as Record<string, unknown> | undefined)?.accountNumber ?? '').includes('*')) next.bank.accountNumber = prev.bank?.accountNumber ?? '';
  if (!next.name || !next.docNumber) return c.json({ error: 'name_and_document' }, 400);
  await ref.set({ ...next, nextReceipt: prev.nextReceipt ?? 1, updatedAt: now(), updatedBy: c.get('user').uid }, { merge: true });
  await audit('billing_issuer_saved', '-', c.get('user').uid, { issuerId: ref.id });
  return c.json({ issuer: issuerView(next) });
});
/** Signature (PNG with transparent background, drawn or uploaded) or logo. */
adminInvoicing.put('/issuers/:id/:kind{signature|logo}', async (c) => {
  const { id, kind } = c.req.param();
  if (!isIssuerId(id)) return c.json({ error: 'not_found' }, 404);
  const body = await c.req.json<{ png?: string; copyFrom?: string }>().catch(() => ({} as { png?: string; copyFrom?: string }));
  // Same person, two profiles: the signature (or logo) of the other profile can be reused as is.
  if (body.copyFrom && isIssuerId(body.copyFrom) && body.copyFrom !== id) {
    const from = (await issuerRef(body.copyFrom).get()).get(`${kind}StoragePath`) as string | undefined;
    if (!from) return c.json({ error: 'nothing_to_copy' }, 404);
    await issuerRef(id).set({ [`${kind}StoragePath`]: from, updatedAt: now() }, { merge: true });
    await audit(`billing_issuer_${kind}`, '-', c.get('user').uid, { issuerId: id, copiedFrom: body.copyFrom });
    return c.json({ ok: true });
  }
  const png = signaturePng(body.png);
  if (!png) return c.json({ error: 'bad_png' }, 400);
  const path = await saveFile(`issuers/${id}/${kind}-${Date.now()}.png`, png, 'image/png');
  await issuerRef(id).set({ [`${kind}StoragePath`]: path, updatedAt: now() }, { merge: true });
  await audit(`billing_issuer_${kind}`, '-', c.get('user').uid, { issuerId: id, sha256: sha256(png) });
  return c.json({ ok: true });
});

/** Everything about a brand's billing, for the admin screen. */
adminInvoicing.get('/brands/:brandId/invoicing', async (c) => {
  const b = c.req.param('brandId');
  const [p, ags, docs, people] = await Promise.all([profileRef(b).get(), agreementsCol(b).get(), docsCol(b).get(), peopleWithBilling(b).catch(() => [] as string[])]);
  return c.json({
    profile: p.exists ? p.data() : null, billingPeople: people.length,
    agreements: ags.docs.map((s) => ({ id: s.id, ...s.data(), sourceSamplePath: undefined })),
    docs: docs.docs.map((s) => publicDoc(s.id, s.data() as BillingDoc & Record<string, unknown>)).sort((x, y) => x.scheduledDate.localeCompare(y.scheduledDate) || x.number.localeCompare(y.number)),
  });
});
adminInvoicing.put('/brands/:brandId/invoicing/profile', async (c) => {
  const p = pickProfile(await c.req.json<Record<string, unknown>>().catch(() => ({})));
  if (!p.legalName) return c.json({ error: 'legalName' }, 400);
  await profileRef(c.req.param('brandId')).set({ ...p, updatedAt: now() }, { merge: true });
  return c.json({ profile: p, nitOk: nitValid(p.taxId) });
});

/** Reads a sample PDF (one or many cuentas) and proposes the agreement; nothing is saved but the sample. */
adminInvoicing.post('/brands/:brandId/invoicing/import', async (c) => {
  const b = c.req.param('brandId');
  const f = dataFile((await c.req.json<{ pdf?: string }>().catch(() => ({} as { pdf?: string }))).pdf);
  if (!f || f.type !== 'application/pdf') return c.json({ error: 'bad_pdf' }, 400);
  const path = await saveFile(`billing-samples/${b}/${randomUUID()}.pdf`, f.bytes, 'application/pdf');
  try {
    const x = await extractSample(f.bytes, b);
    return c.json({ extracted: { ...x, issuer: { ...x.issuer, bank: { ...x.issuer.bank, accountNumber: mask(x.issuer.bank.accountNumber), last4: x.issuer.bank.accountNumber.slice(-4) } } }, sourceSamplePath: path });
  } catch (e) { return c.json({ error: err(e), sourceSamplePath: path }, 502); }
});

/** The cuentas an agreement would make, before saving: numbers, months, dates, amounts and whether it adds up. */
adminInvoicing.post('/brands/:brandId/invoicing/preview', async (c) => {
  const a = pickAgreement(await c.req.json<Record<string, unknown>>().catch(() => ({})));
  const problems = agreementProblems(a);
  const rows = problems.length ? [] : planOf(a);
  return c.json({ rows, problems, sum: rows.reduce((n, r) => n + r.amount, 0), matches: rows.reduce((n, r) => n + r.amount, 0) === a.totalAmount });
});
/** Who charges a project: Colombia (COP) by default, or the USA profile (USD, English). */
const issuerOf = (b: Record<string, unknown>) => { const id = isIssuerId(b.issuerId) ? b.issuerId : DEFAULT_ISSUER; return { issuerId: id, currency: issuerStyle({ country: ISSUERS[id] }).currency }; };
adminInvoicing.post('/brands/:brandId/invoicing/agreements', async (c) => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({} as Record<string, unknown>));
  const a = pickAgreement(body);
  const problems = agreementProblems(a);
  if (problems.length) return c.json({ error: 'incomplete', problems }, 400);
  const ref = agreementsCol(c.req.param('brandId')).doc();
  await ref.set({ ...a, ...issuerOf(body), roundingRule: 'remainder_last', templateId: 'braindy', status: 'draft', createdAt: now(), createdBy: c.get('user').uid });
  return c.json({ id: ref.id });
});
adminInvoicing.put('/brands/:brandId/invoicing/agreements/:id', async (c) => {
  const ref = agreementsCol(c.req.param('brandId')).doc(c.req.param('id'));
  const s = await ref.get();
  if (!s.exists) return c.json({ error: 'not_found' }, 404);
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({} as Record<string, unknown>));
  // Active agreements only change whether cuentas go out by themselves; amounts and numbers are fixed.
  if (s.get('status') !== 'draft') {
    if (typeof body.autoSend !== 'boolean') return c.json({ error: 'not_draft' }, 409);
    await ref.update({ autoSend: body.autoSend, updatedAt: now() });
    return c.json({ ok: true });
  }
  const a = pickAgreement(body);
  const problems = agreementProblems(a);
  if (problems.length) return c.json({ error: 'incomplete', problems }, 400);
  await ref.update({ ...a, ...issuerOf(body), updatedAt: now() });
  return c.json({ ok: true });
});
adminInvoicing.post('/brands/:brandId/invoicing/agreements/:id/activate', async (c) => {
  try { return c.json(await activate(c.req.param('brandId'), c.req.param('id'), c.get('user').uid)); }
  catch (e) { return c.json({ error: err(e) }, 409); }
});

adminInvoicing.post('/brands/:brandId/invoicing/docs/:docId/:action{issue|send|void}', async (c) => {
  const { brandId, docId, action } = c.req.param();
  const by = c.get('user').uid;
  try {
    if (action === 'issue') return c.json(await issueDoc(brandId, docId, by));
    if (action === 'send') return c.json(await sendDoc(brandId, docId, by));
    const { reason } = await c.req.json<{ reason?: string }>().catch(() => ({} as { reason?: string }));
    await voidDoc(brandId, docId, by, String(reason ?? ''));
    return c.json({ ok: true });
  } catch (e) { return c.json({ error: err(e) }, 409); }
});
adminInvoicing.get('/brands/:brandId/invoicing/docs/:docId/pdf', async (c) => {
  try { return c.json({ url: await pdfLink(c.req.param('brandId'), c.req.param('docId')) }); }
  catch (e) { return c.json({ error: err(e) }, 404); }
});
adminInvoicing.post('/brands/:brandId/invoicing/payments', async (c) => {
  const b = await c.req.json<Record<string, unknown>>().catch(() => ({} as Record<string, unknown>));
  const brandId = c.req.param('brandId');
  const proof = dataFile(b.proof);
  const proofStoragePath = proof ? await saveFile(`brands/${brandId}/billing/proofs/${randomUUID()}.${proof.ext}`, proof.bytes, proof.type) : null;
  try {
    return c.json(await recordPayment(brandId, c.get('user').uid, {
      agreementId: typeof b.agreementId === 'string' ? b.agreementId : undefined, docIds: Array.isArray(b.docIds) ? b.docIds.map(String) : undefined,
      date: String(b.date ?? ''), amount: Math.round(Number(b.amount)), method: String(b.method ?? 'Transferencia').slice(0, 60), proofStoragePath, receipt: b.receipt === true,
    }));
  } catch (e) { return c.json({ error: err(e) }, 409); }
});
adminInvoicing.post('/brands/:brandId/invoicing/docs/:docId/payments/:paymentId/confirm', async (c) => {
  const { brandId, docId, paymentId } = c.req.param();
  const { receipt } = await c.req.json<{ receipt?: boolean }>().catch(() => ({} as { receipt?: boolean }));
  try { return c.json(await confirmClaim(brandId, docId, paymentId, c.get('user').uid, receipt !== false)); }
  catch (e) { return c.json({ error: err(e) }, 409); }
});

// ---------------- client ----------------
export const invoicing = new Hono<AuthEnv>();
const billingPeople: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const a = await brandAccess(c.get('user').uid, c.req.param('brandId')!);
  if (!a.admin && !a.sections.includes('billing')) return c.json({ error: 'forbidden' }, 403);
  await next();
};
invoicing.use('/brands/:brandId/cuentas', billingPeople);
invoicing.use('/brands/:brandId/cuentas/*', billingPeople);

/** Issued cuentas and recibos (scheduled ones are not shown to the client until they are issued). */
invoicing.get('/brands/:brandId/cuentas', async (c) => {
  const q = await docsCol(c.req.param('brandId')).get();
  const docs = q.docs.map((s) => publicDoc(s.id, s.data() as BillingDoc & Record<string, unknown>)).filter((d) => d.status !== 'scheduled' && !d.held);
  return c.json({ cardFeePct: cardFeePct(), docs: docs.sort((x, y) => (y.issueDate ?? '').localeCompare(x.issueDate ?? '') || y.number.localeCompare(x.number)) });
});
invoicing.get('/brands/:brandId/cuentas/:docId/pdf', async (c) => {
  const d = (await docsCol(c.req.param('brandId')).doc(c.req.param('docId')).get()).data() as BillingDoc | undefined;
  if (!d || d.status === 'scheduled' || d.held) return c.json({ error: 'not_found' }, 404);
  return c.json({ url: await pdfLink(c.req.param('brandId'), c.req.param('docId')) });
});
invoicing.post('/brands/:brandId/cuentas/:docId/paid', async (c) => {
  const { brandId, docId } = c.req.param();
  const b = await c.req.json<Record<string, unknown>>().catch(() => ({} as Record<string, unknown>));
  const proof = dataFile(b.proof);
  if (!proof) return c.json({ error: 'proof' }, 400);
  const d = (await docsCol(brandId).doc(docId).get()).data() as BillingDoc | undefined;
  if (!d || d.held) return c.json({ error: 'not_found' }, 404);
  const path = await saveFile(`brands/${brandId}/billing/proofs/${randomUUID()}.${proof.ext}`, proof.bytes, proof.type);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date)) ? String(b.date) : new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  try {
    const pay = await claimPaid(brandId, docId, c.get('user').uid, { date, amount: Number(b.amount) || 0, method: String(b.method ?? '').slice(0, 60), proofStoragePath: path });
    const brand = String((await db.doc(`brands/${brandId}`).get()).get('name') ?? '');
    await pushTo(await adminUids(), {
      kind: 'decisions', tag: `billing-paid-${docId}`, url: `/plan?brand=${brandId}&tab=payments`,
      title: { es: `${brand}: dice que pagó ${d.number}`, en: `${brand} says ${d.number} is paid` },
      body: { es: 'Revisa el comprobante y confírmalo.', en: 'Check the proof and confirm it.' },
    }).catch(() => undefined);
    return c.json({ ok: true, paymentId: pay.id });
  } catch (e) { return c.json({ error: err(e) }, 409); }
});

billingFileRoutes(adminInvoicing, invoicing);

/** Pay a cuenta by card: a Stripe Checkout link for what is still owed on it. */
invoicing.post('/brands/:brandId/cuentas/:docId/checkout', async (c) => {
  const { brandId, docId } = c.req.param();
  const { lang } = await c.req.json<{ lang?: string }>().catch(() => ({} as { lang?: string }));
  try { return c.json(await cuentaCheckout(brandId, docId, c.get('user').uid, lang === 'en' ? 'en' : 'es')); }
  catch (e) { const m = String((e as Error).message); return c.json({ error: m === 'not_open' || m === 'stripe_not_configured' ? m : 'failed' }, m === 'stripe_not_configured' ? 503 : 409); }
});

// ---------------- public ----------------
export const publicInvoicing = new Hono();
publicInvoicing.get('/billing/:token', async (c) => {
  const token = c.req.param('token');
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return c.text('Enlace no válido', 404);
  const q = await db.collectionGroup('billingDocs').where('publicTokenHash', '==', sha256(token)).limit(1).get();
  const s = q.docs[0];
  if (!s || s.get('status') === 'void') return c.text('Enlace no válido o vencido', 404);
  await s.ref.update({ openedAt: now() }).catch(() => undefined);
  return c.redirect(await pdfLink(s.ref.parent.parent!.id, s.id), 302);
});
