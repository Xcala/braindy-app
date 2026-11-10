import { arrayRemove, arrayUnion, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
const STAGE = { in_production: 'work', to_approve: 'clientApproval', approved: 'approved', published: 'published' };
/** Admin only (rules): one change to many requests in one write, so it lands all at once or not at all. */
export function bulkUpdate(brandId, ids, change) {
    const data = change.kind === 'status' ? { status: change.status, stage: STAGE[change.status], ...(change.status === 'approved' ? { approvedAt: serverTimestamp() } : change.status === 'published' ? { publishedAt: serverTimestamp() } : {}) }
        : change.kind === 'due' ? { dueDate: change.dueDate }
            : change.kind === 'tag' ? { tags: change.add ? arrayUnion(change.tag) : arrayRemove(change.tag) }
                : { archived: change.archived };
    const b = writeBatch(db);
    for (const id of ids)
        b.update(doc(db, 'brands', brandId, 'requests', id), { ...data, updatedAt: serverTimestamp() });
    return b.commit();
}
