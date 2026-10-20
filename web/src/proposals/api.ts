import { api } from '../lib/api';
import { auth } from '../lib/firebase';

const API_URL = import.meta.env.VITE_API_URL ?? '';

export const createSend = (id: string, channel: 'link' | 'whatsapp', to: string, message: string) =>
  api<{ sendId: string; url: string; whatsapp: string | null }>(`/v1/admin/proposals/${id}/sends`, {
    method: 'POST', body: JSON.stringify({ channel, to, message }),
  });

export const convertToBrand = (id: string) =>
  api<{ brandId: string }>(`/v1/admin/proposals/${id}/convert`, { method: 'POST', body: '{}' });

export const proposalFileUrl = (id: string, fileId: string) =>
  api<{ url: string }>(`/v1/admin/proposals/${id}/files/${fileId}/url`).then((r) => r.url);

export async function uploadProposalFile(id: string, file: File, onProgress: (p: number) => void) {
  const start = await api<{ fileId: string; url: string; contentType: string }>(`/v1/admin/proposals/${id}/uploads`, {
    method: 'POST', body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/octet-stream', size: file.size }),
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
  await fetch(`${API_URL}/v1/admin/proposals/${id}/uploads/${start.fileId}/complete`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
}

// ---------- public (no login) ----------
export const publicApi = {
  load: (t: string) => fetch(`${API_URL}/public/p/${t}`).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
  ping: (t: string, sessionId: string, seconds: number, section: number) =>
    fetch(`${API_URL}/public/p/${t}/ping`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ sessionId, seconds, section }),
    }).catch(() => undefined),
  accept: (t: string, body: { name: string; role: string; accepted: boolean; option?: string }) =>
    fetch(`${API_URL}/public/p/${t}/accept`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
  fileUrl: (t: string, fileId: string) =>
    fetch(`${API_URL}/public/p/${t}/files/${fileId}`).then((r) => r.json()).then((r: { url: string }) => r.url),
};
