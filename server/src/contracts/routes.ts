// Client side of the contract: the legal representative signs (their verified session, data, drawn signature,
// consent) and that closes it, both parties download the sealed PDF, and the brand ticks its kickoff checklist.
import { Hono } from 'hono';
import { db } from '../firebase.js';
import { notify } from '../notify.js';
import { brandAccess } from '../access.js';
import type { AuthEnv } from '../auth.js';
import { CLIENT_KEYS, pickRecord, withClient } from './terms.js';
import { CONSENT, METHOD, contractRef, evidence, now, pdfUrl, saveSignature, sha256, signaturePng } from './store.js';
import { close } from './close.js';

export const contracts = new Hono<AuthEnv>();

contracts.post('/brands/:brandId/contracts/:id/sign', async (c) => {
  const { brandId, id } = c.req.param();
  const user = c.get('user');
  const email = String(user.email ?? '').toLowerCase();
  const access = await brandAccess(user.uid, brandId);
  if (!access.member || access.admin) return c.json({ error: 'forbidden' }, 403);

  const ref = contractRef(brandId, id);
  const snap = await ref.get();
  if (!snap.exists || snap.get('status') !== 'sent' || !snap.get('signatures.contractor.imagePath')) return c.json({ error: 'not_signable' }, 409);
  if (!email || !user.email_verified || email !== String(snap.get('signer.email') ?? '').toLowerCase()) return c.json({ error: 'not_signer' }, 403);

  const b = await c.req.json<{ client?: unknown; signature?: string; consent?: boolean; textHash?: string }>();
  const client = { ...pickRecord(CLIENT_KEYS, b.client), correo: email };
  const missing = CLIENT_KEYS.filter((k) => !client[k]);
  if (missing.length) return c.json({ error: 'missing', fields: missing }, 400);
  const png = signaturePng(b.signature);
  if (!png) return c.json({ error: 'signature' }, 400);
  if (b.consent !== true) return c.json({ error: 'consent' }, 400);

  const text = withClient(String(snap.get('sentText')), client);
  const textHash = sha256(text);
  // The page computed the hash of what the signer saw; a mismatch means the text changed under them.
  if (b.textHash && b.textHash !== textHash) return c.json({ error: 'text_changed' }, 409);

  const imagePath = await saveSignature(brandId, id, 'cliente', png);
  const at = new Date().toISOString();
  const signature = {
    name: client.representante, tipoDoc: client.tipoDoc, doc: client.doc, cargo: client.cargo, email,
    uid: user.uid, signedAt: at, verifiedAt: new Date(user.auth_time * 1000).toISOString(),
    method: METHOD, consent: CONSENT.client, imagePath, ...evidence(c),
  };
  const patch = { client, text, textHash, 'signatures.client': signature, clientSignedAt: now() };
  const contract = { ...snap.data(), client, text, textHash, signatures: { ...snap.get('signatures'), client: signature } };
  const pdf = await close(brandId, id, contract, patch, user.uid);
  if (!pdf) return c.json({ error: 'not_signable' }, 409);
  await db.collection('audit').add({ type: 'contract_client_signed', brandId, contractId: id, by: user.uid, textHash, at: now() });
  await notify(brandId, 'contract_signed');
  return c.json({ ok: true, textHash, pdf });
});

/** Signed URL of the sealed PDF: admin, the signer, and people who see billing. */
contracts.get('/brands/:brandId/contracts/:id/pdf', async (c) => {
  const { brandId, id } = c.req.param();
  const user = c.get('user');
  const access = await brandAccess(user.uid, brandId);
  const snap = await contractRef(brandId, id).get();
  if (!snap.exists || snap.get('status') !== 'signed') return c.json({ error: 'not_found' }, 404);
  const signer = String(user.email ?? '').toLowerCase() === String(snap.get('signer.email') ?? '').toLowerCase();
  if (!access.admin && !(access.member && (signer || access.sections.includes('billing')))) return c.json({ error: 'forbidden' }, 403);
  await db.collection('audit').add({ type: 'contract_pdf_download', brandId, contractId: id, by: user.uid, at: now() });
  return c.json({ url: await pdfUrl(snap.get('pdf.storagePath'), snap.get('pdf.fileName')) });
});

/** An otrosí's PDF (stored on the contract as amendments[]): same people as the contract itself. */
contracts.get('/brands/:brandId/contracts/:id/amendments/:aid/pdf', async (c) => {
  const { brandId, id, aid } = c.req.param();
  const user = c.get('user');
  const access = await brandAccess(user.uid, brandId);
  const snap = await contractRef(brandId, id).get();
  const a = ((snap.get('amendments') ?? []) as Array<{ id: string; storagePath: string; fileName: string }>).find((x) => x.id === aid);
  if (!snap.exists || !a) return c.json({ error: 'not_found' }, 404);
  const signer = String(user.email ?? '').toLowerCase() === String(snap.get('signer.email') ?? '').toLowerCase();
  if (!access.admin && !(access.member && (signer || access.sections.includes('billing')))) return c.json({ error: 'forbidden' }, 403);
  await db.collection('audit').add({ type: 'contract_amendment_download', brandId, contractId: id, amendmentId: aid, by: user.uid, at: now() });
  return c.json({ url: await pdfUrl(a.storagePath, a.fileName) });
});

/** The brand ticks (or unticks) an item of its kickoff checklist. */
contracts.post('/brands/:brandId/kickoff/:itemId', async (c) => {
  const { brandId, itemId } = c.req.param();
  const uid = c.get('user').uid;
  if (!(await brandAccess(uid, brandId)).member) return c.json({ error: 'forbidden' }, 403);
  const { done } = await c.req.json<{ done?: boolean }>();
  const ref = db.doc(`brands/${brandId}/context/kickoff`);
  const ok = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const items = (snap.get('items') ?? []) as Array<{ id: string; done: boolean; doneAt?: string | null; doneBy?: string | null }>;
    const it = items.find((x) => x.id === itemId);
    if (!it) return false;
    Object.assign(it, { done: done === true, doneAt: done ? new Date().toISOString() : null, doneBy: done ? uid : null });
    tx.update(ref, { items, updatedAt: now() });
    return true;
  });
  return ok ? c.json({ ok: true }) : c.json({ error: 'not_found' }, 404);
});
