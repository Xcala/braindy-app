import { api } from '../lib/api';
import { auth } from '../lib/firebase';
const API_URL = import.meta.env.VITE_API_URL ?? '';
export const createSend = (id, channel, to, message) => api(`/v1/admin/proposals/${id}/sends`, {
    method: 'POST', body: JSON.stringify({ channel, to, message }),
});
export const convertToBrand = (id) => api(`/v1/admin/proposals/${id}/convert`, { method: 'POST', body: '{}' });
export const proposalFileUrl = (id, fileId) => api(`/v1/admin/proposals/${id}/files/${fileId}/url`).then((r) => r.url);
export async function uploadProposalFile(id, file, onProgress) {
    const start = await api(`/v1/admin/proposals/${id}/uploads`, {
        method: 'POST', body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/octet-stream', size: file.size }),
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
    await fetch(`${API_URL}/v1/admin/proposals/${id}/uploads/${start.fileId}/complete`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
}
// ---------- public (no login) ----------
export const publicApi = {
    load: (t) => fetch(`${API_URL}/public/p/${t}`).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
    ping: (t, sessionId, seconds, section) => fetch(`${API_URL}/public/p/${t}/ping`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
        body: JSON.stringify({ sessionId, seconds, section }),
    }).catch(() => undefined),
    accept: (t, body) => fetch(`${API_URL}/public/p/${t}/accept`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
    pay: (t) => fetch(`${API_URL}/public/p/${t}/pay`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
    fileUrl: (t, fileId) => fetch(`${API_URL}/public/p/${t}/files/${fileId}`).then((r) => r.json()).then((r) => r.url),
};
