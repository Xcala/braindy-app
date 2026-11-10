import { api, apiResponse } from '../lib/api';
import { auth } from '../lib/firebase';
const API_URL = import.meta.env.VITE_API_URL ?? '';
export const signedUrl = (brandId, assetId, inline = false) => api(`/v1/brands/${brandId}/assets/${assetId}/url${inline ? '?inline=1' : ''}`).then((r) => r.url);
export const signedUrls = (brandId, ids) => api(`/v1/brands/${brandId}/assets/urls`, { method: 'POST', body: JSON.stringify({ ids }) })
    .then((r) => r.urls);
const asset = (brandId, id) => `/v1/brands/${brandId}/assets/${id}`;
/** NickMark only: to the trash (30 days to restore it). */
export const removeFile = (brandId, id) => api(asset(brandId, id), { method: 'DELETE' });
export const renameFile = (brandId, id, title) => api(asset(brandId, id), { method: 'PATCH', body: JSON.stringify({ title }) });
export const moveFile = (brandId, id, folder) => api(asset(brandId, id), { method: 'PATCH', body: JSON.stringify({ folder }) });
/** A link anyone can open for 7 days. */
export const shareLink = (brandId, id) => api(`${asset(brandId, id)}/share`, { method: 'POST' });
export const listTrash = (brandId) => api(`/v1/brands/${brandId}/trash`);
export const restoreFile = (brandId, id) => api(`/v1/brands/${brandId}/trash/${id}/restore`, { method: 'POST' });
export const purgeFile = (brandId, id) => api(`/v1/brands/${brandId}/trash/${id}`, { method: 'DELETE' });
/** NickMark only: a folder's new name, or the whole folder to the trash (only Braindy; Drive is never touched). */
export const renameFolder = (brandId, path, name) => api(`/v1/brands/${brandId}/folders/rename`, { method: 'POST', body: JSON.stringify({ path, name }) });
export const trashFolder = (brandId, path) => api(`/v1/brands/${brandId}/folders/trash`, { method: 'POST', body: JSON.stringify({ path }) });
/** Several files in one .zip, built on the server and saved by the browser. */
export async function downloadZip(brandId, ids, name) {
    const res = await apiResponse(`/v1/brands/${brandId}/assets/zip`, { method: 'POST', body: JSON.stringify({ ids }) });
    if (!res.ok)
        throw Object.assign(new Error(`API ${res.status}`), { status: res.status });
    const href = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement('a'), { href, download: `${name}.zip` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 60_000);
}
export async function download(brandId, assetId) {
    window.location.assign(await signedUrl(brandId, assetId));
}
/** Uploads a file to the brand's Uploads folder through a signed URL, reporting progress 0–1. Returns the asset id. */
export async function upload(brandId, file, onProgress, folder) {
    const start = await api(`/v1/brands/${brandId}/uploads`, {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/octet-stream', size: file.size, folder }),
    });
    await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', start.url);
        xhr.setRequestHeader('Content-Type', start.contentType);
        xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload ${xhr.status}`)));
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(file);
    });
    const token = await auth.currentUser?.getIdToken();
    await fetch(`${API_URL}/v1/brands/${brandId}/uploads/${start.assetId}/complete`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
    return start.assetId;
}
export const formatBytes = (n) => n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(0)} KB` : n < 1024 ** 3 ? `${(n / 1024 ** 2).toFixed(1)} MB` : `${(n / 1024 ** 3).toFixed(2)} GB`;
export const previewKind = (contentType) => contentType.startsWith('image/') && !contentType.includes('photoshop') ? 'image'
    : contentType.startsWith('video/') ? 'video'
        : contentType === 'application/pdf' ? 'pdf' : null;
