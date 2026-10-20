import { api } from '../lib/api';

export const createRequest = (brandId: string, body: Record<string, unknown>) =>
  api<{ requestId: string }>(`/v1/brands/${brandId}/requests`, { method: 'POST', body: JSON.stringify(body) });

export const decide = (brandId: string, requestId: string, versionId: string, state: 'approved' | 'changes_requested', note = '') =>
  api(`/v1/brands/${brandId}/requests/${requestId}/versions/${versionId}/decision`, { method: 'POST', body: JSON.stringify({ state, note }) });

export const approveBatch = (brandId: string, items: Array<{ requestId: string; versionId: string }>) =>
  api<{ approved: number; total: number }>(`/v1/brands/${brandId}/approvals/batch`, { method: 'POST', body: JSON.stringify({ items }) });

export const versionFileUrl = (brandId: string, requestId: string, versionId: string, index: number, download = false) =>
  api<{ url: string }>(`/v1/brands/${brandId}/requests/${requestId}/versions/${versionId}/files/${index}${download ? '?download=1' : ''}`).then((r) => r.url);

// ---------- admin ----------
export const savePlan = (brandId: string, requestId: string, plan: { scope: string[]; firstDelivery: string; note: string; approve: boolean }) =>
  api(`/v1/admin/brands/${brandId}/requests/${requestId}/plan`, { method: 'POST', body: JSON.stringify(plan) });

export async function uploadVersion(brandId: string, requestId: string, files: File[], meta: { notes: string; reason: string; brain: string }, onProgress: (p: number) => void) {
  const start = await api<{ versionId: string; uploads: Array<{ url: string; contentType: string }> }>(
    `/v1/admin/brands/${brandId}/requests/${requestId}/versions`,
    { method: 'POST', body: JSON.stringify({ ...meta, files: files.map((f) => ({ name: f.name, contentType: f.type || 'application/octet-stream', size: f.size })) }) },
  );
  for (const [i, f] of files.entries()) {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', start.uploads[i].url);
      xhr.setRequestHeader('Content-Type', start.uploads[i].contentType);
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress((i + e.loaded / e.total) / files.length);
      xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload ${xhr.status}`)));
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.send(f);
    });
  }
  await api(`/v1/admin/brands/${brandId}/requests/${requestId}/versions/${start.versionId}/publish`, { method: 'POST', body: '{}' });
}

export const markPublished = (brandId: string, requestId: string) =>
  api(`/v1/admin/brands/${brandId}/requests/${requestId}/published`, { method: 'POST', body: '{}' });
