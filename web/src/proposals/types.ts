import type { Timestamp } from 'firebase/firestore';

export type ProposalStatus = 'draft' | 'sent' | 'won' | 'lost';
export type OptionKey = 'launch' | 'transform' | 'continuity';

export interface Proposal {
  id: string;
  title: string;
  status: ProposalStatus;
  lang: 'en' | 'es';
  prospect: { name?: string; company?: string; email?: string; phone?: string };
  validUntil?: string;
  preparedOn?: string;
  fromA?: { today?: string; insights?: string };
  toB?: { target?: string; changes?: string };
  options?: Partial<Record<OptionKey | 'aiAgents', { price?: string; amount?: number | null; monthly?: number | null }>>;
  currency?: string;
  recommended?: OptionKey;
  lostReason?: string;
  notes?: string;
  convertedBrandId?: string;
  acceptance?: { name: string; role?: string; email?: string; option?: string; at?: Timestamp };
  lastActivity?: { type: string; at?: Timestamp; channel?: string; to?: string; name?: string };
  createdAt?: Timestamp;
}

export interface Send {
  id: string;
  channel: 'link' | 'whatsapp' | 'email';
  to?: string;
  token: string;
  opens: number;
  seconds: number;
  maxSection: number;
  createdAt?: Timestamp;
  firstOpenAt?: Timestamp | null;
  lastOpenAt?: Timestamp | null;
}

export interface SendEvent {
  id: string;
  type: 'open' | 'accepted';
  at?: Timestamp;
  seconds?: number;
  maxSection?: number;
  device?: string;
  name?: string;
}

export const STATUS_CHIP: Record<ProposalStatus, string> = { draft: 'c-draft', sent: 'c-sent', won: 'c-won', lost: 'c-lost' };

/** Public page sections, in order, for "read up to …" in tracking. */
export const SECTION_KEYS = ['cover', 'proof', 'fromAtoB', 'braintrust', 'days', 'options', 'talk'] as const;
