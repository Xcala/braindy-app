import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';
/** Reports of a brand. Clients only receive published ones (rules); admin gets drafts too. */
export function useReports(brandId, admin) {
    const [list, setList] = useState([]);
    useEffect(() => {
        if (!brandId)
            return;
        const base = collection(db, 'brands', brandId, 'reports');
        const q = admin ? query(base, orderBy('month', 'desc')) : query(base, where('published', '==', true), orderBy('month', 'desc'));
        return onSnapshot(q, (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setList([]));
    }, [brandId, admin]);
    return list;
}
export const saveReport = (brandId, month, r) => api(`/v1/admin/brands/${encodeURIComponent(brandId)}/reports/${month}`, { method: 'PUT', body: JSON.stringify(r) });
