import { arrayRemove, arrayUnion, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { RequestStatus } from './types';

const STAGE: Record<RequestStatus, string> = { in_production: 'work', to_approve: 'clientApproval', approved: 'approved', published: 'published' };

export type BulkChange =
  | { kind: 'status'; status: RequestStatus }
  | { kind: 'due'; dueDate: string | null }
  | { kind: 'tag'; tag: string; add: boolean }
  | { kind: 'archive'; archived: boolean };

/** Admin only (rules): one change to many requests in one write, so it lands all at once or not at all. */
export function bulkUpdate(brandId: string, ids: string[], change: BulkChange) {
  const data: Record<string, unknown> =
    change.kind === 'status' ? { status: change.status, stage: STAGE[change.status], ...(change.status === 'approved' ? { approvedAt: serverTimestamp() } : change.status === 'published' ? { publishedAt: serverTimestamp() } : {}) }
    : change.kind === 'due' ? { dueDate: change.dueDate }
    : change.kind === 'tag' ? { tags: change.add ? arrayUnion(change.tag) : arrayRemove(change.tag) }
    : { archived: change.archived };
  const b = writeBatch(db);
  for (const id of ids) b.update(doc(db, 'brands', brandId, 'requests', id), { ...data, updatedAt: serverTimestamp() });
  return b.commit();
}
