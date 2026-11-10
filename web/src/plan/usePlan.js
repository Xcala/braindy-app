import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';
/** What the brand contracted (billing people and admin; others get null from the rules). undefined = loading. */
export function usePlan(brandId) {
    const [plan, setPlan] = useState(undefined);
    useEffect(() => {
        if (!brandId)
            return;
        setPlan(undefined);
        return onSnapshot(doc(db, 'brands', brandId, 'billing', 'contracted'), (s) => setPlan(s.exists() ? s.data() : null), () => setPlan(null));
    }, [brandId]);
    return plan;
}
const a = (id) => `/v1/admin/brands/${encodeURIComponent(id)}/plan`;
export const planApi = {
    set: (brandId, p) => api(a(brandId), { method: 'PUT', body: JSON.stringify(p) }),
    remove: (brandId) => api(a(brandId), { method: 'DELETE' }),
    setStack: (brandId, items) => api(`${a(brandId)}/stack`, { method: 'PUT', body: JSON.stringify(items) }),
    removeStack: (brandId) => api(`${a(brandId)}/stack`, { method: 'DELETE' }),
    packStatus: (brandId, pack, status) => api(`${a(brandId)}/packs/${pack}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};
