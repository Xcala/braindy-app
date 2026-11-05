import { api, apiResponse } from '../lib/api';
import { auth } from '../lib/firebase';

const API_URL = import.meta.env.VITE_API_URL ?? '';

export const signedUrl = (brandId: string, assetId: string, inline = false) =>
  api<{ url: string }>(`/v1/brands/${brandId}/assets/${assetId}/url${inline ? '?inline=1' : ''}`).then((r) => r.url);

export const signedUrls = (brandId: string, ids: string[]) =>
  api<{ urls: Record<string, string> }>(`/v1/brands/${brandId}/assets/urls`, { method: 'POST', body: JSON.stringify({ ids }) })
    .then((r) => r.urls);

const asset = (brandId: string, id: string) => `/v1/brands/${brandId}/assets/${id}`;
/** NickMark only: to the trash (30 days to restore it). */
export const removeFile = (brandId: string, id: string) => api(asset(brandId, id), { method: 'DELETE' });
export const renameFile = (brandId: string, id: string, title: string) => api(asset(brandId, id), { method: 'PATCH', body: JSON.stringify({ title }) });
export const moveFile = (brandId: string, id: string, folder: string) => api(asset(brandId, id), { method: 'PATCH', body: JSON.stringify({ folder }) });
/** A link anyone can open for 7 days. */
export const shareLink = (brandId: string, id: string) => api<{ url: string; expires: number }>(`${asset(brandId, id)}/share`, { method: 'POST' });

export type TrashItem = { id: string; title: string; folder: string; size: number; contentType: string; trashedAt: number | null };
export const listTrash = (brandId: string) => api<{ days: number; files: TrashItem[] }>(`/v1/brands/${brandId}/trash`);
export const restoreFile = (brandId: string, id: string) => api(`/v1/brands/${brandId}/trash/${id}/restore`, { method: 'POST' });
export const purgeFile = (brandId: string, id: string) => api(`/v1/brands/${brandId}/trash/${id}`, { method: 'DELETE' });
/** NickMark only: a folder's new name, or the whole folder to the trash (only Braindy; Drive is never touched). */
export const renameFolder = (brandId: string, path: string, name: string) => api<{ path: string }>(`/v1/brands/${brandId}/folders/rename`, { method: 'POST', body: JSON.stringify({ path, name }) });
export const trashFolder = (brandId: string, path: string) => api<{ ids: string[] }>(`/v1/brands/${brandId}/folders/trash`, { method: 'POST', body: JSON.stringify({ path }) });

/** Several files in one .zip, built on the server and saved by the browser. */
export async function downloadZip(brandId: string, ids: string[], name: string) {
  const res = await apiResponse(`/v1/brands/${brandId}/assets/zip`, { method: 'POST', body: JSON.stringify({ ids }) });
  if (!res.ok) throw Object.assign(new Error(`API ${res.status}`), { status: res.status });
  const href = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement('a'), { href, download: `${name}.zip` });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 60_000);
}

export async function download(brandId: string, assetId: string) {
  window.location.assign(await signedUrl(brandId, assetId));
}

/** Uploads a file to the brand's Uploads folder through a signed URL, reporting progress 0–1. Returns the asset id. */
export async function upload(brandId: string, file: File, onProgress: (p: number) => void, folder?: string): Promise<string> {
  const start = await api<{ assetId: string; url: string; contentType: string }>(`/v1/brands/${brandId}/uploads`, {
    method: 'POST',
    body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/octet-stream', size: file.size, folder }),
  });
  await new Promise<void>((resolve, reject) => {
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

export const formatBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(0)} KB` : n < 1024 ** 3 ? `${(n / 1024 ** 2).toFixed(1)} MB` : `${(n / 1024 ** 3).toFixed(2)} GB`;

export const previewKind = (contentType: string) =>
  contentType.startsWith('image/') && !contentType.includes('photoshop') ? 'image'
    : contentType.startsWith('video/') ? 'video'
    : contentType === 'application/pdf' ? 'pdf' : null;
