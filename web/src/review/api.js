import { api } from '../lib/api';
const API_URL = import.meta.env.VITE_API_URL ?? '';
export const noticesApi = {
    get: (brandId) => api(`/v1/brands/${brandId}/settings/notices`),
    save: (brandId, s) => api(`/v1/brands/${brandId}/settings/notices`, { method: 'PUT', body: JSON.stringify(s) }),
    sendLink: (brandId, requestId, versionId) => api(`/v1/admin/brands/${brandId}/requests/${requestId}/versions/${versionId}/review-link`, { method: 'POST', body: '{}' }),
};
async function call(path, init) {
    const r = await fetch(`${API_URL}/public${path}`, { ...init, headers: { 'Content-Type': 'application/json' } });
    if (!r.ok)
        throw Object.assign(new Error(String(r.status)), { status: r.status });
    return r.json();
}
export const publicReviewApi = {
    load: (token) => call(`/r/${encodeURIComponent(token)}`),
    decide: (token, state, note = '') => call(`/r/${encodeURIComponent(token)}/decision`, { method: 'POST', body: JSON.stringify({ state, note }) }),
};
