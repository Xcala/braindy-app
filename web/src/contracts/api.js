import { api } from '../lib/api';
const b = (id) => `/v1/brands/${encodeURIComponent(id)}`;
const a = (id) => `/v1/admin/brands/${encodeURIComponent(id)}`;
const post = (body = {}) => ({ method: 'POST', body: JSON.stringify(body) });
export const contractsApi = {
    create: (brandId, preset) => api(`${a(brandId)}/contracts`, post({ preset })),
    save: (brandId, id, patch) => api(`${a(brandId)}/contracts/${id}`, post(patch)),
    preview: (brandId, id) => api(`${a(brandId)}/contracts/${id}/preview`),
    send: (brandId, id, signature) => api(`${a(brandId)}/contracts/${id}/send`, post({ signature })),
    reopen: (brandId, id) => api(`${a(brandId)}/contracts/${id}/reopen`, post()),
    saveSchedule: (brandId, schedule) => api(`${a(brandId)}/schedule`, post({ schedule })),
    sign: (brandId, id, body) => api(`${b(brandId)}/contracts/${id}/sign`, post(body)),
    pdfUrl: (brandId, id) => api(`${b(brandId)}/contracts/${id}/pdf`),
    tick: (brandId, itemId, done) => api(`${b(brandId)}/kickoff/${itemId}`, post({ done })),
    uploadSigned: (brandId, body) => api(`${a(brandId)}/signed-contracts`, post(body)),
};
/** Error code and missing fields from a failed call (the backend answers { error, fields }). */
export function apiError(e) {
    const body = e.body;
    return { code: body?.error ?? 'error', fields: body?.fields ?? [] };
}
