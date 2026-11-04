// NickMark's side of the contract: draft from the template (+ accepted proposal + schedule preset), edit,
// send to the legal representative, countersign and seal. A signed contract is never edited again.
import { Hono, type MiddlewareHandler } from 'hono';
import type { DocumentData } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { brandAccess } from '../access.js';
import { notify } from '../notify.js';
import type { AuthEnv } from '../auth.js';
import { TEMPLATE_VERSION } from './template.js';
import { CONTRACTOR_KEYS, fill, missingTerms, pickRecord, pickTerms, type Contractor, type Terms } from './terms.js';
import { DEFAULT_CHECKLIST, PRESETS, cleanChecklist, cleanSchedule, mondayOf, type PresetKey } from './schedule.js';
import { CONSENT, METHOD, bucket, contractRef, evidence, now, saveSignature, seal, sha256, signaturePng } from './store.js';

export const adminContracts = new Hono<AuthEnv>();
const adminOnly: MiddlewareHandler<AuthEnv> = async (c, next) => {
  if (!(await brandAccess(c.get('user').uid, c.req.param('brandId')!)).admin) return c.json({ error: 'forbidden' }, 403);
  await next();
};
for (const path of ['/brands/:brandId/contracts', '/brands/:brandId/contracts/*', '/brands/:brandId/signed-contracts', '/brands/:brandId/schedule']) adminContracts.use(path, adminOnly);

const contractor = async () => pickRecord(CONTRACTOR_KEYS, (await db.doc('config/contractor').get()).data()) as Contractor;
const brandRef = (id: string) => db.doc(`brands/${id}`);
/** Brands that already started onboarding (e.g. in the brief) keep their step: the contract never moves them back. */
const atContractStep = async (brandId: string) => [undefined, 'contract'].includes((await brandRef(brandId).get()).get('onboarding.step'));

/** Terms from the accepted proposal converted into this brand, when there is one. */
async function fromProposal(brandId: string): Promise<{ proposalId?: string; terms: Partial<Terms> }> {
  const q = await db.collection('proposals').where('convertedBrandId', '==', brandId).limit(5).get();
  const p = q.docs.find((d) => d.get('acceptance'));
  if (!p) return { terms: {} };
  const a = p.get('acceptance') as { option?: string; at?: FirebaseFirestore.Timestamp };
  const opt = (p.get(`options.${a.option}`) ?? {}) as { amount?: number };
  return {
    proposalId: p.id,
    terms: {
      'propuesta.id': String(p.get('title') ?? p.id),
      'propuesta.fecha': a.at ? a.at.toDate().toLocaleDateString('es-CO', { dateStyle: 'long', timeZone: 'America/Bogota' }) : '',
      'valor.monto': opt.amount ? String(opt.amount) : '',
      'valor.moneda': String(p.get('currency') ?? 'COP').toUpperCase(),
    },
  };
}

adminContracts.post('/brands/:brandId/contracts', async (c) => {
  const { brandId } = c.req.param();
  const b = await c.req.json<{ preset?: string }>().catch(() => ({} as { preset?: string }));
  const preset = (b.preset && b.preset in PRESETS ? b.preset : 'brand3m') as PresetKey;
  const { proposalId, terms } = await fromProposal(brandId);
  const ref = db.collection(`brands/${brandId}/contracts`).doc();
  await ref.set({
    status: 'draft', templateVersion: TEMPLATE_VERSION, terms: pickTerms({}, terms), scope: '', proposalId: proposalId ?? null,
    schedule: PRESETS[preset](mondayOf()), checklist: DEFAULT_CHECKLIST, signer: { email: '', name: '' },
    createdBy: c.get('user').uid, createdAt: now(), updatedAt: now(),
  });
  const fresh = await atContractStep(brandId);
  await brandRef(brandId).set({ onboarding: fresh ? { step: 'contract', contractId: ref.id, startedAt: now() } : { contractId: ref.id } }, { merge: true });
  return c.json({ id: ref.id });
});

adminContracts.post('/brands/:brandId/contracts/:id', async (c) => {
  const { brandId, id } = c.req.param();
  const ref = contractRef(brandId, id);
  const snap = await ref.get();
  if (!snap.exists) return c.json({ error: 'not_found' }, 404);
  if (snap.get('status') !== 'draft') return c.json({ error: 'not_draft' }, 409);
  const b = await c.req.json<DocumentData>();
  const patch: DocumentData = { updatedAt: now() };
  if (b.terms) patch.terms = pickTerms(b.terms, snap.get('terms'));
  if (typeof b.scope === 'string') patch.scope = b.scope.slice(0, 8000);
  if (b.schedule) patch.schedule = cleanSchedule(b.schedule);
  if (b.checklist) patch.checklist = cleanChecklist(b.checklist, (patch.schedule ?? snap.get('schedule')).weeks);
  if (b.preset && b.preset in PRESETS) patch.schedule = PRESETS[b.preset as PresetKey](snap.get('schedule.start') ?? mondayOf());
  if (b.signer) patch.signer = { email: String(b.signer.email ?? '').trim().toLowerCase().slice(0, 200), name: String(b.signer.name ?? '').trim().slice(0, 120) };
  await ref.update(patch);
  return c.json({ ok: true });
});

/** The text as the client will see it (contractor and terms filled, client data blank). */
adminContracts.get('/brands/:brandId/contracts/:id/preview', async (c) => {
  const snap = await contractRef(c.req.param('brandId'), c.req.param('id')).get();
  if (!snap.exists) return c.json({ error: 'not_found' }, 404);
  return c.json({ text: snap.get('sentText') ?? fill(pickTerms(snap.get('terms')), await contractor()) });
});

adminContracts.post('/brands/:brandId/contracts/:id/send', async (c) => {
  const { brandId, id } = c.req.param();
  const ref = contractRef(brandId, id);
  const snap = await ref.get();
  if (!snap.exists || snap.get('status') !== 'draft') return c.json({ error: 'not_draft' }, 409);
  const terms = pickTerms(snap.get('terms'));
  const who = await contractor();
  const missing = [...missingTerms(terms), ...CONTRACTOR_KEYS.filter((k) => !who[k]).map((k) => `contratista.${k}`)];
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(snap.get('signer.email')))) missing.push('signer.email');
  if (!(snap.get('schedule.groups') ?? []).length) missing.push('schedule');
  if (missing.length) return c.json({ error: 'missing', fields: missing }, 400);
  await ref.update({ status: 'sent', sentText: fill(terms, who), sentAt: now(), sentBy: c.get('user').uid });
  await brandRef(brandId).set({ onboarding: (await atContractStep(brandId)) ? { step: 'contract', contractId: id } : { contractId: id } }, { merge: true });
  await notify(brandId, 'contract_ready');
  return c.json({ ok: true });
});

/** Back to draft to fix something, only while the client has not signed. */
adminContracts.post('/brands/:brandId/contracts/:id/reopen', async (c) => {
  const ref = contractRef(c.req.param('brandId'), c.req.param('id'));
  const ok = await db.runTransaction(async (tx) => {
    const s = await tx.get(ref);
    if (s.get('status') !== 'sent') return false;
    tx.update(ref, { status: 'draft', sentText: null, updatedAt: now() });
    return true;
  });
  return ok ? c.json({ ok: true }) : c.json({ error: 'not_sent' }, 409);
});

adminContracts.post('/brands/:brandId/contracts/:id/countersign', async (c) => {
  const { brandId, id } = c.req.param();
  const user = c.get('user');
  const ref = contractRef(brandId, id);
  const snap = await ref.get();
  if (!snap.exists || snap.get('status') !== 'clientSigned') return c.json({ error: 'not_ready' }, 409);
  const png = signaturePng((await c.req.json<{ signature?: string }>()).signature);
  if (!png) return c.json({ error: 'signature' }, 400);
  const who = await contractor();
  const signature = {
    name: who.nombre, tipoDoc: who.tipoDoc, doc: who.doc, cargo: 'Contratista, persona natural', email: String(user.email ?? who.correo),
    uid: user.uid, signedAt: new Date().toISOString(), verifiedAt: new Date(user.auth_time * 1000).toISOString(),
    method: METHOD, consent: CONSENT.contractor, imagePath: await saveSignature(brandId, id, 'contratista', png), ...evidence(c),
  };
  const contract = { ...snap.data(), signatures: { ...snap.get('signatures'), contractor: signature } };
  const pdf = await seal(brandId, id, contract);
  const start = String(snap.get('schedule.start'));
  const toKickoff = await atContractStep(brandId);
  const ok = await db.runTransaction(async (tx) => {
    if ((await tx.get(ref)).get('status') !== 'clientSigned') return false;
    tx.update(ref, { status: 'signed', 'signatures.contractor': signature, pdf, signedAt: now() });
    tx.set(db.doc(`brands/${brandId}/context/schedule`), { ...snap.get('schedule'), contractId: id, updatedAt: now() });
    tx.set(db.doc(`brands/${brandId}/context/kickoff`), { start, items: snap.get('checklist'), contractId: id, updatedAt: now() });
    tx.set(brandRef(brandId), { onboarding: { ...(toKickoff ? { step: 'kickoff' } : {}), contractId: id, contractSignedAt: now() } }, { merge: true });
    tx.set(db.collection('audit').doc(), { type: 'contract_signed', brandId, contractId: id, by: user.uid, textHash: snap.get('textHash'), pdfSha256: pdf.sha256, at: now() });
    return true;
  });
  if (!ok) return c.json({ error: 'not_ready' }, 409);
  await notify(brandId, 'contract_signed');
  return c.json({ ok: true, pdf });
});

/** The live schedule after signing (statuses and dates move; the signed Anexo 2 does not). */
adminContracts.post('/brands/:brandId/schedule', async (c) => {
  const { brandId } = c.req.param();
  const schedule = cleanSchedule((await c.req.json<{ schedule?: unknown }>()).schedule);
  await db.doc(`brands/${brandId}/context/schedule`).set({ ...schedule, updatedAt: now() }, { merge: true });
  return c.json({ ok: true });
});

/** A contract already signed outside Braindy (e.g. on paper or another platform): the PDF as signed, stored
 *  privately and shown as signed. Existing clients without onboarding stay out of it (step live). */
adminContracts.post('/brands/:brandId/signed-contracts', async (c) => {
  const { brandId } = c.req.param();
  const b = await c.req.json<{ pdf?: string; fileName?: string; title?: string; signedOn?: string; clientName?: string; clientRole?: string }>().catch(() => ({} as Record<string, string>));
  const bytes = Buffer.from(String(b.pdf ?? ''), 'base64');
  if (bytes.length < 300 || bytes.length > 15_000_000 || bytes.subarray(0, 5).toString() !== '%PDF-') return c.json({ error: 'pdf' }, 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(b.signedOn ?? ''))) return c.json({ error: 'missing', fields: ['signedOn'] }, 400);
  const clean = (v: unknown, max = 160) => String(v ?? '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, max);
  const ref = db.collection(`brands/${brandId}/contracts`).doc();
  const fileName = (clean(b.fileName, 120).replace(/[\/]/g, '-') || 'Contrato firmado').replace(/(\.pdf)?$/i, '.pdf');
  const storagePath = `brands/${brandId}/contracts/${ref.id}/${fileName}`;
  await bucket().file(storagePath).save(bytes, { contentType: 'application/pdf', resumable: false });
  const pdf = { storagePath, sha256: sha256(bytes), size: bytes.length, fileName };
  const signedAt = new Date(`${b.signedOn}T12:00:00-05:00`).toISOString();
  const who = await contractor();
  await ref.set({
    status: 'signed', source: 'external', title: clean(b.title, 200), templateVersion: 'external', terms: {}, scope: '', schedule: null, checklist: [],
    signer: { email: '', name: clean(b.clientName) }, pdf, signedAt: now(), createdBy: c.get('user').uid, createdAt: now(), updatedAt: now(),
    signatures: { client: { name: clean(b.clientName), cargo: clean(b.clientRole), signedAt }, contractor: { name: who.nombre, cargo: 'Contratista, persona natural', signedAt } },
  });
  const step = (await brandRef(brandId).get()).get('onboarding.step');
  await brandRef(brandId).set({ onboarding: { ...(step ? {} : { step: 'live' }), contractId: ref.id, contractSignedAt: now() } }, { merge: true });
  await db.collection('audit').add({ type: 'contract_uploaded', brandId, contractId: ref.id, by: c.get('user').uid, pdfSha256: pdf.sha256, at: now() });
  return c.json({ id: ref.id, pdf });
});
