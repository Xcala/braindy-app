import { api } from '../lib/api';

const b = (id: string) => `/v1/brands/${encodeURIComponent(id)}`;
const a = (id: string) => `/v1/admin/brands/${encodeURIComponent(id)}/onboarding`;
const post = (body: unknown = {}): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

export type BrainDraft = {
  voice?: string; audiences?: string; competitors?: Array<{ name: string; promise: string; price: string }>;
  lookAndFeel?: string; goals?: string; avoid?: string; position?: string; criterio?: string;
  status?: 'draft' | 'signed'; draftedWithAi?: boolean; version?: number;
};

export const onboardingApi = {
  answer: (brandId: string, key: string, text: string) => api(`${b(brandId)}/brief/answer`, post({ key, text })),
  complete: (brandId: string) => api<{ ok: true; ai: boolean }>(`${b(brandId)}/brief/complete`, post()),
  slots: (brandId: string) => api<{ slots: string[] }>(`${b(brandId)}/session/slots`),
  book: (brandId: string, at: string) => api(`${b(brandId)}/session`, post({ at })),
  start: (brandId: string) => api(`${a(brandId)}/start`, post()),
  saveBrain: (brandId: string, d: BrainDraft) => api(`${a(brandId)}/brain`, post(d)),
  sign: (brandId: string) => api<{ version: number }>(`${a(brandId)}/sign`, post()),
  live: (brandId: string) => api(`${a(brandId)}/live`, post()),
};
