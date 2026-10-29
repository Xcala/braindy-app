import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { RequestStatus } from './types';

const STAGE: Record<RequestStatus, string> = { in_production: 'work', to_approve: 'clientApproval', approved: 'approved', published: 'published' };

/** Admin only (rules): moves a request to another board column, keeping stage and the dated milestone in step. */
export function moveRequest(brandId: string, requestId: string, status: RequestStatus) {
  const extra = status === 'approved' ? { approvedAt: serverTimestamp() } : status === 'published' ? { publishedAt: serverTimestamp() } : {};
  return updateDoc(doc(db, 'brands', brandId, 'requests', requestId), { status, stage: STAGE[status], ...extra, updatedAt: serverTimestamp() });
}
