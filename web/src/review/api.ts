import { api } from '../lib/api';

const API_URL = import.meta.env.VITE_API_URL ?? '';

/** Result of creating a review link: sent by the WhatsApp API, or a wa.me link to send by hand. */
export type Notice = { status: 'sent' | 'manual' | 'no_number' | 'off' | 'error'; url?: string; waUrl?: string | null };
export type NoticeSettings = {
  whatsapp?: string; approverUid?: string; lang?: 'es' | 'en'; whatsappApi?: boolean;
  notices?: { delivery?: boolean; approved?: boolean; brandBrain?: boolean; report?: boolean };
};

export const noticesApi = {
  get: (brandId: string) => api<NoticeSettings>(`/v1/brands/${brandId}/settings/notices`),
  save: (brandId: string, s: NoticeSettings) => api(`/v1/brands/${brandId}/settings/notices`, { method: 'PUT', body: JSON.stringify(s) }),
  sendLink: (brandId: string, requestId: string, versionId: string) =>
    api<Notice>(`/v1/admin/brands/${brandId}/requests/${requestId}/versions/${versionId}/review-link`, { method: 'POST', body: '{}' }),
};

export type PublicReview = {
  brand: { name: string; logoUrl: string | null };
  request: { title: string; leadBrain: string; approvalLevel?: string };
  version: { n: number; notes: string; reason: string; brain: string | null; files: Array<{ name: string; contentType: string; url: string | null }>; approval: { state: string } | null };
  used: boolean; expiresAt: string;
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_URL}/public${path}`, { ...init, headers: { 'Content-Type': 'application/json' } });
  if (!r.ok) throw Object.assign(new Error(String(r.status)), { status: r.status });
  return r.json() as Promise<T>;
}

export const publicReviewApi = {
  load: (token: string) => call<PublicReview>(`/r/${encodeURIComponent(token)}`),
  decide: (token: string, state: 'approved' | 'changes_requested', note = '') =>
    call<{ ok: true }>(`/r/${encodeURIComponent(token)}/decision`, { method: 'POST', body: JSON.stringify({ state, note }) }),
};
