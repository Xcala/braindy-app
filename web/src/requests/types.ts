import type { Timestamp } from 'firebase/firestore';
import type { BrainId } from './taxonomy';

export type RequestStatus = 'in_production' | 'to_approve' | 'approved' | 'published';
export type Stage = 'plan' | 'work' | 'clientApproval' | 'approved' | 'published';

export interface AttachedFile { assetId: string; name: string; size: number; contentType: string }
export interface Card { text?: string; links?: string[]; files?: AttachedFile[] }

export interface BrandRequest {
  id: string;
  title: string;
  /** A website adjustment (found by this, not by its title, so it can be renamed). */
  siteAdjust?: boolean;
  category: string;
  subcategory: string;
  formatType: string;
  cards: { product?: Card; application?: Card; scene?: Card };
  dueDate?: string | null;
  format?: string;
  language?: string;
  status: RequestStatus;
  doneOutside?: { by: string; at?: Timestamp; prevStatus?: string | null };
  stage: Stage;
  leadBrain: BrainId;
  helperBrains: BrainId[];
  approvalLevel: 'self' | 'nicolas';
  /** The team at work for real (server/brains/steps.ts): one step per Brain, moved by the session doing the request. */
  work?: { state?: string; current?: BrainId | null; steps?: WorkStep[]; ask?: { brain: BrainId; text: string; at: number } | null } | null;
  /** Brand check the team ran before delivering (admin). */
  quality?: { score: number; passed: boolean; round: number; checks: Array<{ id: string; text: string; critical: boolean; ok: boolean; note?: string }> } | null;
  teamNotes?: { researcher?: string; marketer?: string; creator?: string; builder?: string; ai?: boolean } | null;
  plan?: { scope: string[]; firstDelivery?: string | null; note?: string; approved: boolean; proposedBy?: string; proposedWithAi?: boolean } | null;
  versionCount?: number;
  latestVersion?: string;
  /** A version uploaded by the team that waits for NickMark before the client sees it. */
  held?: { versionId: string; why?: string; note?: string } | null;
  createdBy: string;
  /** Where it came from: app, whatsapp, connector… */
  source?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  legacy?: { briefRequestId?: string };
  /** Campaigns or groups set by NickMark ("Navidad 2026"); clients filter by them. */
  tags?: string[];
  /** Hidden from the board and list unless "Archived" is on (admin sets it). */
  archived?: boolean;
  /** Cancelled by the client or NickMark (sent by mistake): archived, the Brains skip it; can be undone. */
  cancelled?: { by: string; at?: Timestamp } | null;
  approvedAt?: Timestamp;
  /** NickMark asked the client for what the request lacked (date, where, material). */
  askedMissingAt?: Timestamp;
  /** Shown to every client as a launch beside the studio (set by the API when NickMark marks it). */
  launch?: { versionId: string; title: string } | null;
}

export interface WorkStep { brain: BrainId; task: string; state: 'todo' | 'doing' | 'done' | 'skip'; note?: string; at?: number }

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

/** A box or point on a piece. `fileIndex` is the file of the version it was made on (older marks: the first). */
export interface Annotation { x: number; y: number; w: number; h: number; versionId: string; fileIndex?: number; /** Seconds into a video: a comment on a moment, not an area. */ t?: number }

export interface RequestComment {
  id: string;
  author: string;
  text: string;
  annotation?: Annotation;
  versionId?: string;
  kind?: string;
  /** Stars 1–5 on a delivery (kind "rating"). */
  rating?: number;
  resolved?: boolean;
  createdAt?: Timestamp;
  editedAt?: Timestamp;
}

export const STATUS_CHIP: Record<RequestStatus, string> = {
  in_production: 'c-prod', to_approve: 'c-approve', approved: 'c-approved', published: 'c-published',
};
export const STAGES: Stage[] = ['plan', 'work', 'clientApproval', 'approved', 'published'];
