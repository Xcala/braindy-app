import { api } from '../lib/api';
const b = (id) => `/v1/brands/${encodeURIComponent(id)}`;
const a = (id) => `/v1/admin/brands/${encodeURIComponent(id)}/onboarding`;
const post = (body = {}) => ({ method: 'POST', body: JSON.stringify(body) });
export const onboardingApi = {
    answer: (brandId, key, text) => api(`${b(brandId)}/brief/answer`, post({ key, text })),
    complete: (brandId) => api(`${b(brandId)}/brief/complete`, post()),
    slots: (brandId) => api(`${b(brandId)}/session/slots`),
    book: (brandId, at, kind = 'strategy') => api(`${b(brandId)}/session`, post({ at, kind })),
    start: (brandId) => api(`${a(brandId)}/start`, post()),
    saveBrain: (brandId, d) => api(`${a(brandId)}/brain`, post(d)),
    sign: (brandId) => api(`${a(brandId)}/sign`, post()),
    live: (brandId) => api(`${a(brandId)}/live`, post()),
};
