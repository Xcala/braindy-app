import { api } from '../lib/api';
const API_URL = import.meta.env.VITE_API_URL ?? '';
/** Links without login of a brand (upload, showcase): NickMark and the brand's owners. A 403 means «not for you». */
export const shareApi = {
    list: (brandId) => api(`/v1/brands/${brandId}/share-links`),
    create: (brandId, kind, label = '') => api(`/v1/brands/${brandId}/share-links`, { method: 'POST', body: JSON.stringify({ kind, label }) }),
    off: (brandId, kind, token) => api(`/v1/brands/${brandId}/share-links/${kind}/${token}`, { method: 'DELETE' }),
};
export const shareUrl = (kind, token) => `${location.origin}/${kind === 'upload' ? 'u' : 's'}/${token}`;
async function call(path, init) {
    const r = await fetch(`${API_URL}/public${path}`, { ...init, headers: { 'Content-Type': 'application/json' } });
    if (!r.ok)
        throw Object.assign(new Error(String(r.status)), { status: r.status });
    return r.json();
}
export const publicShareApi = {
    upload: (token) => call(`/u/${encodeURIComponent(token)}`),
    showcase: (token) => call(`/s/${encodeURIComponent(token)}`),
    /** Sends one file: asks for a signed URL, PUTs the bytes (with progress), then confirms. */
    async send(token, f, meta, onProgress) {
        const t = encodeURIComponent(token);
        const start = await call(`/u/${t}/files`, {
            method: 'POST', body: JSON.stringify({ fileName: f.name, contentType: f.type || 'application/octet-stream', size: f.size, ...meta }),
        });
        await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', start.url);
            xhr.setRequestHeader('Content-Type', start.contentType);
            xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
            xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload ${xhr.status}`)));
            xhr.onerror = () => reject(new Error('Upload failed'));
            xhr.send(f);
        });
        await call(`/u/${t}/files/${start.assetId}/complete`, { method: 'POST', body: '{}' });
    },
};
