import type { Timestamp } from 'firebase/firestore';
import type { BrainId } from './taxonomy';

export type RequestStatus = 'in_production' | 'to_approve' | 'approved' | 'published';
export type Stage = 'plan' | 'work' | 'clientApproval' | 'approved' | 'published';

export interface Card { text?: string; links?: string[] }

export interface BrandRequest {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  formatType: string;
  cards: { product?: Card; application?: Card; scene?: Card };
  dueDate?: string | null;
  format?: string;
  language?: string;
  status: RequestStatus;
  stage: Stage;
  leadBrain: BrainId;
  helperBrains: BrainId[];
  approvalLevel: 'self' | 'nicolas';
  plan?: { scope: string[]; firstDelivery?: string | null; note?: string; approved: boolean; proposedBy?: string; proposedWithAi?: boolean } | null;
  versionCount?: number;
  latestVersion?: string;
  createdBy: string;
  createdAt?: Timestamp;
  legacy?: { briefRequestId?: string };
}

export interface VersionFile { name: string; contentType: string; size: number; storagePath?: string; url?: string }

export interface Version {
  id: string;
  n: number;
  files: VersionFile[];
  notes?: string;
  reason?: string;
  brain?: BrainId | null;
  published: boolean;
  approval?: { state: 'pending' | 'approved' | 'changes_requested'; by?: string; at?: Timestamp; note?: string | null };
  createdAt?: Timestamp;
  publishedAt?: Timestamp;
}

export interface Annotation { x: number; y: number; w: number; h: number; versionId: string }

export interface RequestComment {
  id: string;
  author: string;
  text: string;
  annotation?: Annotation;
  versionId?: string;
  kind?: string;
  resolved?: boolean;
  createdAt?: Timestamp;
}

export const STATUS_CHIP: Record<RequestStatus, string> = {
  in_production: 'c-prod', to_approve: 'c-approve', approved: 'c-approved', published: 'c-published',
};
export const STAGES: Stage[] = ['plan', 'work', 'clientApproval', 'approved', 'published'];
