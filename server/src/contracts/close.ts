// Closing a contract in one go: NickMark signed when sending, so the client's signature seals the PDF,
// publishes the schedule and kickoff checklist, and moves the brand on.
import type { DocumentData } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { contractRef, now, seal } from './store.js';

export const brandRef = (id: string) => db.doc(`brands/${id}`);
/** Brands that already started onboarding (e.g. in the brief) keep their step: the contract never moves them back. */
export const atContractStep = async (brandId: string) => [undefined, 'contract'].includes((await brandRef(brandId).get()).get('onboarding.step'));

/** Seals the contract with both signatures. Returns the PDF, or null if it was no longer waiting for the client. */
export async function close(brandId: string, id: string, contract: DocumentData, patch: DocumentData, by: string) {
  const ref = contractRef(brandId, id);
  const pdf = await seal(brandId, id, contract);
  const toKickoff = await atContractStep(brandId);
  const ok = await db.runTransaction(async (tx) => {
    if ((await tx.get(ref)).get('status') !== 'sent') return false;
    tx.update(ref, { ...patch, status: 'signed', pdf, signedAt: now() });
    if (contract.schedule) tx.set(db.doc(`brands/${brandId}/context/schedule`), { ...contract.schedule, contractId: id, updatedAt: now() });
    tx.set(db.doc(`brands/${brandId}/context/kickoff`), { start: String(contract.schedule?.start ?? ''), items: contract.checklist ?? [], contractId: id, updatedAt: now() });
    tx.set(brandRef(brandId), { onboarding: { ...(toKickoff ? { step: 'kickoff' } : {}), contractId: id, contractSignedAt: now() } }, { merge: true });
    tx.set(db.collection('audit').doc(), { type: 'contract_signed', brandId, contractId: id, by, textHash: contract.textHash, pdfSha256: pdf.sha256, at: now() });
    return true;
  });
  return ok ? pdf : null;
}
