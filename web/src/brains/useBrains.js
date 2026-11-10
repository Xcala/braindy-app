import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';
/** Brain insights of a brand (competitor changes, group analyses), newest first. */
export function useInsights(brandId, kind, max = 5) {
    const [list, setList] = useState([]);
    useEffect(() => {
        if (!brandId)
            return;
        const base = collection(db, 'brands', brandId, 'insights');
        const q = kind ? query(base, where('kind', '==', kind), orderBy('at', 'desc'), limit(max)) : query(base, orderBy('at', 'desc'), limit(max));
        return onSnapshot(q, (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setList([]));
    }, [brandId, kind, max]);
    return list;
}
/** Admin: the latest Brain tasks (what each Brain is doing, for which brand). */
export function useBrainTasks(enabled, max = 30) {
    const [list, setList] = useState([]);
    useEffect(() => {
        if (!enabled)
            return;
        return onSnapshot(query(collection(db, 'brainTasks'), orderBy('createdAt', 'desc'), limit(max)), (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setList([]));
    }, [enabled, max]);
    return list;
}
const post = (path) => api(path, { method: 'POST', body: '{}' });
export const brainsApi = {
    draftReport: (brandId, month) => post(`/v1/admin/brands/${brandId}/brains/report/${month}`),
    watch: (brandId) => post(`/v1/admin/brands/${brandId}/brains/watch`),
    analyzeGroup: (brandId) => post(`/v1/brands/${brandId}/analysis`),
};
