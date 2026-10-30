import { api } from '../lib/api';
export const createRequest = (brandId, body) => api(`/v1/brands/${brandId}/requests`, { method: 'POST', body: JSON.stringify(body) });
export const decide = (brandId, requestId, versionId, state, note = '') => api(`/v1/brands/${brandId}/requests/${requestId}/versions/${versionId}/decision`, { method: 'POST', body: JSON.stringify({ state, note }) });
export const approveBatch = (brandId, items) => api(`/v1/brands/${brandId}/approvals/batch`, { method: 'POST', body: JSON.stringify({ items }) });
export const versionFileUrl = (brandId, requestId, versionId, index, download = false) => api(`/v1/brands/${brandId}/requests/${requestId}/versions/${versionId}/files/${index}${download ? '?download=1' : ''}`).then((r) => r.url);
// ---------- admin ----------
export const savePlan = (brandId, requestId, plan) => api(`/v1/admin/brands/${brandId}/requests/${requestId}/plan`, { method: 'POST', body: JSON.stringify(plan) });
export async function uploadVersion(brandId, requestId, files, meta, onProgress) {
    const start = await api(`/v1/admin/brands/${brandId}/requests/${requestId}/versions`, { method: 'POST', body: JSON.stringify({ ...meta, files: files.map((f) => ({ name: f.name, contentType: f.type || 'application/octet-stream', size: f.size })) }) });
    for (const [i, f] of files.entries()) {
        await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', start.uploads[i].url);
            xhr.setRequestHeader('Content-Type', start.uploads[i].contentType);
            xhr.upload.onprogress = (e) => e.lengthComputable && onProgress((i + e.loaded / e.total) / files.length);
            xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload ${xhr.status}`)));
            xhr.onerror = () => reject(new Error('Upload failed'));
            xhr.send(f);
        });
    }
    const r = await api(`/v1/admin/brands/${brandId}/requests/${requestId}/versions/${start.versionId}/publish`, { method: 'POST', body: '{}' });
    return r.notice ?? null;
}
export const markPublished = (brandId, requestId) => api(`/v1/admin/brands/${brandId}/requests/${requestId}/published`, { method: 'POST', body: '{}' });
