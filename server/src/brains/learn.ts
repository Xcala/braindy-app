// The learning loop: every approval and every change request teaches the Brains about the brand. Kept in
// brands/{id}/context/learnings (last 60), read by every Brain before working (see context.ts).
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';

export async function recordLearning(brandId: string, requestId: string, versionId: string, state: string, note: string) {
  try {
    const [req, ver] = await Promise.all([
      db.doc(`brands/${brandId}/requests/${requestId}`).get(),
      db.doc(`brands/${brandId}/requests/${requestId}/versions/${versionId}`).get(),
    ]);
    const title = String(req.get('title') ?? '');
    const text = state === 'approved'
      ? `${title}: ${String(ver.get('reason') || ver.get('notes') || 'approved as delivered').slice(0, 300)}`
      : `${title}: ${note.slice(0, 300)}`;
    const ref = db.doc(`brands/${brandId}/context/learnings`);
    await db.runTransaction(async (tx) => {
      const items = (((await tx.get(ref)).get('items') as unknown[]) ?? []).slice(-59);
      items.push({ kind: state === 'approved' ? 'liked' : 'changed', text, requestId, brain: ver.get('brain') ?? req.get('leadBrain') ?? null, at: new Date().toISOString() });
      tx.set(ref, { items, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    });
  } catch { /* learning must never block an approval */ }
}
