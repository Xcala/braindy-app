import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';
/** Credential metadata of a brand. `denied` = the user is not an owner (rules refuse the read). */
export function useAccesses(brandId) {
    const [state, setState] = useState({ list: [], loading: true, denied: false });
    useEffect(() => {
        if (!brandId)
            return;
        setState({ list: [], loading: true, denied: false });
        return onSnapshot(query(collection(db, 'brands', brandId, 'accesses'), orderBy('platform')), (s) => setState({ list: s.docs.map((d) => ({ id: d.id, ...d.data() })), loading: false, denied: false }), () => setState({ list: [], loading: false, denied: true }));
    }, [brandId]);
    return state;
}
export function useAccessLog(brandId, max = 8) {
    const [events, setEvents] = useState([]);
    useEffect(() => {
        if (!brandId)
            return;
        return onSnapshot(query(collection(db, 'brands', brandId, 'accessLog'), orderBy('at', 'desc'), limit(max)), (s) => setEvents(s.docs.map((d) => ({ id: d.id, ...d.data() }))), (e) => { console.warn('accessLog', e.code); setEvents([]); });
    }, [brandId, max]);
    return events;
}
const base = (brandId) => `/v1/brands/${encodeURIComponent(brandId)}/accesses`;
export const accessesApi = {
    add: (brandId, a) => api(base(brandId), { method: 'POST', body: JSON.stringify(a) }),
    update: (brandId, id, a) => api(`${base(brandId)}/${id}`, { method: 'PATCH', body: JSON.stringify(a) }),
    remove: (brandId, id) => api(`${base(brandId)}/${id}`, { method: 'DELETE' }),
    reveal: (brandId, id) => api(`${base(brandId)}/${id}/reveal`, { method: 'POST', body: '{}' }),
    copied: (brandId, id) => api(`${base(brandId)}/${id}/copied`, { method: 'POST', body: '{}' }),
};
