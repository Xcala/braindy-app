import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';

export type LinkSection = 'apps' | 'research';
export type LinkKind = 'web' | 'app' | 'dashboard' | 'research' | 'marketmap';
export interface BrandLink {
  id: string; section: LinkSection; kind: LinkKind; title: string; url: string;
  description?: string; status?: 'live' | 'building'; ogImage?: string | null; createdAt?: Timestamp; updatedAt?: Timestamp;
}
export type LinkInput = Pick<BrandLink, 'kind' | 'title' | 'url' | 'description' | 'status'>;

/** Links of one section of a brand (My apps or My research), newest first. */
export function useBrandLinks(brandId: string | undefined, section: LinkSection) {
  const [links, setLinks] = useState<BrandLink[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!brandId) { setLinks([]); return; }
    setLoading(true);
    return onSnapshot(query(collection(db, 'brands', brandId, 'links'), where('section', '==', section)), (s) => {
      setLinks(s.docs.map((d) => ({ id: d.id, ...d.data() }) as BrandLink)
        .sort((a, b) => (b.createdAt?.toMillis() ?? Date.now()) - (a.createdAt?.toMillis() ?? Date.now())));
      setLoading(false);
    }, () => { setLinks([]); setLoading(false); });
  }, [brandId, section]);
  return { links, loading };
}

const clean = (l: LinkInput) => ({
  kind: l.kind, title: l.title.trim().slice(0, 120), url: l.url.trim().slice(0, 1000),
  description: (l.description ?? '').trim().slice(0, 300), status: l.status ?? 'live',
});
export const isHttps = (url: string) => /^https:\/\/[^\s]+\.[^\s]+/.test(url.trim());

// Admin only (rules enforce it).
// After each save the backend reads the page's Open Graph image for the card (best effort, in the background).
const refreshPreview = (brandId: string, id: string) => { api(`/v1/admin/brands/${brandId}/links/${id}/preview`, { method: 'POST', body: '{}' }).catch(() => {}); };
export async function addLink(brandId: string, section: LinkSection, l: LinkInput) {
  const ref = await addDoc(collection(db, 'brands', brandId, 'links'), { section, ...clean(l), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  refreshPreview(brandId, ref.id);
}
export async function saveLink(brandId: string, id: string, section: LinkSection, l: LinkInput) {
  await updateDoc(doc(db, 'brands', brandId, 'links', id), { section, ...clean(l), updatedAt: serverTimestamp() });
  refreshPreview(brandId, id);
}
export const removeLink = (brandId: string, id: string) => deleteDoc(doc(db, 'brands', brandId, 'links', id));
