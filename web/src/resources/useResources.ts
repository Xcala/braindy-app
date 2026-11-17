// Free resources: skills, scripts, prompts, templates, guides and tools NickMark shares with every client.
// Top-level collection: clients read the published ones, the admin reads and edits everything (firestore.rules).
import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../lib/api';

export type L2 = { es: string; en: string };
export const KINDS = ['skill', 'script', 'prompt', 'template', 'guide', 'tool'] as const;
export type Kind = (typeof KINDS)[number];
export const KIND_COLOR: Record<Kind, string> = { skill: '#8B5CF6', script: '#2A7FFF', prompt: '#06B6D4', template: '#F5B301', guide: '#16A34A', tool: '#E0457B' };

export type ResourceFile = { storagePath: string; name: string; size: number; contentType: string };
export type Resource = {
  id: string; status: 'draft' | 'published'; kind: Kind; order: number;
  title: L2; summary: L2; tags: string[];
  /** What the person takes: a file to download, a link to open, and/or a text to copy (a prompt, a script). */
  file?: ResourceFile | null; url?: string; body?: string; howTo?: L2;
  downloads?: number; copies?: number; createdAt?: Timestamp; updatedAt?: Timestamp;
};
export type ResourceDraft = Omit<Resource, 'id' | 'downloads' | 'copies' | 'createdAt' | 'updatedAt'>;

export function useResources() {
  const { profile } = useAuth();
  const admin = profile?.role === 'admin';
  const [list, setList] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!profile) return;
    const base = collection(db, 'resources');
    return onSnapshot(admin ? base : query(base, where('status', '==', 'published')),
      (s) => { setList(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Resource).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))); setLoading(false); },
      () => { setList([]); setLoading(false); });
  }, [admin, profile]);
  return { list, loading, admin };
}

export const saveResource = (id: string | null, d: ResourceDraft) =>
  id ? updateDoc(doc(db, 'resources', id), { ...d, updatedAt: serverTimestamp() })
    : addDoc(collection(db, 'resources'), { ...d, downloads: 0, copies: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
export const deleteResource = (id: string) => deleteDoc(doc(db, 'resources', id));

/** Admin: upload a file straight to the bucket with a signed URL from the API. */
export async function uploadResourceFile(f: File, onProgress: (p: number) => void): Promise<ResourceFile> {
  const r = await api<{ storagePath: string; url: string; contentType: string }>('/v1/admin/resources/uploads', {
    method: 'POST', body: JSON.stringify({ fileName: f.name, contentType: f.type || 'application/octet-stream', size: f.size }),
  });
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', r.url);
    xhr.setRequestHeader('Content-Type', r.contentType);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload ${xhr.status}`)));
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(f);
  });
  return { storagePath: r.storagePath, name: f.name, size: f.size, contentType: r.contentType };
}

/** Everyone: download the file (counted on the server). */
export async function downloadResource(id: string) {
  const { url } = await api<{ url: string }>(`/v1/resources/${id}/file`);
  window.location.href = url;
}
export const countCopy = (id: string) => { api(`/v1/resources/${id}/used`, { method: 'POST', body: '{}' }).catch(() => undefined); };

export const sizeLabel = (n: number) => (n > 1024 ** 2 ? `${(n / 1024 ** 2).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
