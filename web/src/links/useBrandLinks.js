import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';
/** Links of one section of a brand (My apps or My research), newest first. */
export function useBrandLinks(brandId, section) {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!brandId) {
            setLinks([]);
            return;
        }
        setLoading(true);
        return onSnapshot(query(collection(db, 'brands', brandId, 'links'), where('section', '==', section)), (s) => {
            setLinks(s.docs.map((d) => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.createdAt?.toMillis() ?? Date.now()) - (a.createdAt?.toMillis() ?? Date.now())));
            setLoading(false);
        }, () => { setLinks([]); setLoading(false); });
    }, [brandId, section]);
    return { links, loading };
}
const clean = (l) => ({
    kind: l.kind, title: l.title.trim().slice(0, 120), url: l.url.trim().slice(0, 1000),
    description: (l.description ?? '').trim().slice(0, 300), status: l.status ?? 'live',
});
export const isHttps = (url) => /^https:\/\/[^\s]+\.[^\s]+/.test(url.trim());
// Admin only (rules enforce it).
// After each save the backend reads the page's Open Graph image for the card (best effort, in the background).
const refreshPreview = (brandId, id) => { api(`/v1/admin/brands/${brandId}/links/${id}/preview`, { method: 'POST', body: '{}' }).catch(() => { }); };
export async function addLink(brandId, section, l) {
    const ref = await addDoc(collection(db, 'brands', brandId, 'links'), { section, ...clean(l), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    refreshPreview(brandId, ref.id);
}
export async function saveLink(brandId, id, section, l) {
    await updateDoc(doc(db, 'brands', brandId, 'links', id), { section, ...clean(l), updatedAt: serverTimestamp() });
    refreshPreview(brandId, id);
}
export const removeLink = (brandId, id) => deleteDoc(doc(db, 'brands', brandId, 'links', id));
