import { api, apiResponse } from '../lib/api';
export const createRequest = (brandId, body) => api(`/v1/brands/${brandId}/requests`, { method: 'POST', body: JSON.stringify(body) });
export const decide = (brandId, requestId, versionId, state, note = '') => api(`/v1/brands/${brandId}/requests/${requestId}/versions/${versionId}/decision`, { method: 'POST', body: JSON.stringify({ state, note }) });
export const approveBatch = (brandId, items) => api(`/v1/brands/${brandId}/approvals/batch`, { method: 'POST', body: JSON.stringify({ items }) });
export const versionFileUrl = (brandId, requestId, versionId, index, download = false) => api(`/v1/brands/${brandId}/requests/${requestId}/versions/${versionId}/files/${index}${download ? '?download=1' : ''}`).then((r) => r.url);
/** The text of a short text file of a version (post copy, hashtags), read by the server. */
export const versionFileText = (brandId, requestId, versionId, index) => api(`/v1/brands/${brandId}/requests/${requestId}/versions/${versionId}/files/${index}?text=1`).then((r) => r.text);
/** Every file of a version in one .zip, built on the server and saved by the browser. */
export async function downloadVersionZip(brandId, requestId, versionId, name) {
    const res = await apiResponse(`/v1/brands/${brandId}/requests/${requestId}/versions/${versionId}/zip`);
    if (!res.ok)
        throw Object.assign(new Error(`API ${res.status}`), { status: res.status });
    const href = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement('a'), { href, download: `${name}.zip` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 60_000);
}
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
