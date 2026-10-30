import { api } from '../lib/api';
import type { ChecklistItem, ClientData, Schedule } from './types';

const b = (id: string) => `/v1/brands/${encodeURIComponent(id)}`;
const a = (id: string) => `/v1/admin/brands/${encodeURIComponent(id)}`;
const post = (body: unknown = {}): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

export type PresetKey = 'brand3m' | 'marketing6m' | 'empty';
export interface DraftPatch { terms?: Record<string, string>; scope?: string; schedule?: Schedule; checklist?: ChecklistItem[]; signer?: { email: string; name: string }; preset?: PresetKey }

export const contractsApi = {
  create: (brandId: string, preset: PresetKey) => api<{ id: string }>(`${a(brandId)}/contracts`, post({ preset })),
  save: (brandId: string, id: string, patch: DraftPatch) => api(`${a(brandId)}/contracts/${id}`, post(patch)),
  preview: (brandId: string, id: string) => api<{ text: string }>(`${a(brandId)}/contracts/${id}/preview`),
  send: (brandId: string, id: string) => api(`${a(brandId)}/contracts/${id}/send`, post()),
  reopen: (brandId: string, id: string) => api(`${a(brandId)}/contracts/${id}/reopen`, post()),
  countersign: (brandId: string, id: string, signature: string) => api(`${a(brandId)}/contracts/${id}/countersign`, post({ signature })),
  saveSchedule: (brandId: string, schedule: Schedule) => api(`${a(brandId)}/schedule`, post({ schedule })),
  sign: (brandId: string, id: string, body: { client: Omit<ClientData, 'correo'>; signature: string; consent: boolean; textHash: string }) =>
    api<{ textHash: string }>(`${b(brandId)}/contracts/${id}/sign`, post(body)),
  pdfUrl: (brandId: string, id: string) => api<{ url: string }>(`${b(brandId)}/contracts/${id}/pdf`),
  tick: (brandId: string, itemId: string, done: boolean) => api(`${b(brandId)}/kickoff/${itemId}`, post({ done })),
};

/** Error code and missing fields from a failed call (the backend answers { error, fields }). */
export function apiError(e: unknown): { code: string; fields: string[] } {
  const body = (e as { body?: { error?: string; fields?: string[] } }).body;
  return { code: body?.error ?? 'error', fields: body?.fields ?? [] };
}
