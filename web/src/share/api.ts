import { api } from '../lib/api';

const API_URL = import.meta.env.VITE_API_URL ?? '';

export type ShareKind = 'upload' | 'showcase';
export type ShareLink = { token: string; label: string; count: number; createdAt: number | null };
export type PublicBrand = { name: string; logoUrl: string | null };
export type ShowcaseItem = { id: string; title: string; approvedAt: string | null; total: number; files: Array<{ name: string; contentType: string; url: string }> };

/** Links without login of a brand (upload, showcase): NickMark and the brand's owners. A 403 means «not for you». */
export const shareApi = {
  list: (brandId: string) => api<Record<ShareKind, ShareLink[]>>(`/v1/brands/${brandId}/share-links`),
  create: (brandId: string, kind: ShareKind, label = '') =>
    api<{ token: string }>(`/v1/brands/${brandId}/share-links`, { method: 'POST', body: JSON.stringify({ kind, label }) }),
  off: (brandId: string, kind: ShareKind, token: string) => api(`/v1/brands/${brandId}/share-links/${kind}/${token}`, { method: 'DELETE' }),
};

export const shareUrl = (kind: ShareKind, token: string) => `${location.origin}/${kind === 'upload' ? 'u' : 's'}/${token}`;

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_URL}/public${path}`, { ...init, headers: { 'Content-Type': 'application/json' } });
  if (!r.ok) throw Object.assign(new Error(String(r.status)), { status: r.status });
  return r.json() as Promise<T>;
}

export const publicShareApi = {
  upload: (token: string) => call<{ brand: PublicBrand; label: string }>(`/u/${encodeURIComponent(token)}`),
  showcase: (token: string) => call<{ brand: PublicBrand; label: string; items: ShowcaseItem[] }>(`/s/${encodeURIComponent(token)}`),
  /** Sends one file: asks for a signed URL, PUTs the bytes (with progress), then confirms. */
  async send(token: string, f: File, meta: { sender: string; note: string }, onProgress: (p: number) => void) {
    const t = encodeURIComponent(token);
    const start = await call<{ assetId: string; url: string; contentType: string }>(`/u/${t}/files`, {
      method: 'POST', body: JSON.stringify({ fileName: f.name, contentType: f.type || 'application/octet-stream', size: f.size, ...meta }),
    });
    await new Promise<void>((resolve, reject) => {
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
