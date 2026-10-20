import { api } from '../lib/api';
import { auth } from '../lib/firebase';

const API_URL = import.meta.env.VITE_API_URL ?? '';

export const signedUrl = (brandId: string, assetId: string, inline = false) =>
  api<{ url: string }>(`/v1/brands/${brandId}/assets/${assetId}/url${inline ? '?inline=1' : ''}`).then((r) => r.url);

export async function download(brandId: string, assetId: string) {
  window.location.assign(await signedUrl(brandId, assetId));
}

/** Uploads a file to the brand's Uploads folder through a signed URL, reporting progress 0–1. */
export async function upload(brandId: string, file: File, onProgress: (p: number) => void) {
  const start = await api<{ assetId: string; url: string; contentType: string }>(`/v1/brands/${brandId}/uploads`, {
    method: 'POST',
    body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/octet-stream', size: file.size }),
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
}

export const formatBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(0)} KB` : n < 1024 ** 3 ? `${(n / 1024 ** 2).toFixed(1)} MB` : `${(n / 1024 ** 3).toFixed(2)} GB`;

export const previewKind = (contentType: string) =>
  contentType.startsWith('image/') && !contentType.includes('photoshop') ? 'image'
    : contentType.startsWith('video/') ? 'video'
    : contentType === 'application/pdf' ? 'pdf' : null;
