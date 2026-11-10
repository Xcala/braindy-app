import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
/** Live document under the current brand, e.g. useBrandDoc(id, 'context/identity'). */
export function useBrandDoc(brandId, path) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!brandId)
            return;
        setLoading(true);
        return onSnapshot(doc(db, 'brands', brandId, ...path.split('/')), (s) => { setData(s.exists() ? s.data() : null); setLoading(false); }, () => { setData(null); setLoading(false); });
    }, [brandId, path]);
    return { data, loading };
}
/** Live collection under the current brand, e.g. useBrandCollection(id, 'assets'). */
export function useBrandCollection(brandId, name) {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!brandId)
            return;
        setLoading(true);
        return onSnapshot(collection(db, 'brands', brandId, name), (s) => { setDocs(s.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); }, () => { setDocs([]); setLoading(false); });
    }, [brandId, name]);
    return { docs, loading };
}
