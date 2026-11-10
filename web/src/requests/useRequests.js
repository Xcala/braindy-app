import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
export function useRequests(brandId) {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!brandId)
            return;
        setLoading(true);
        return onSnapshot(query(collection(db, 'brands', brandId, 'requests'), orderBy('createdAt', 'desc')), (s) => {
            setList(s.docs.map((d) => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }, () => { setList([]); setLoading(false); });
    }, [brandId]);
    return { list, loading };
}
export function useRequest(brandId, requestId) {
    const [r, setR] = useState(undefined);
    useEffect(() => {
        if (!brandId)
            return;
        return onSnapshot(doc(db, 'brands', brandId, 'requests', requestId), (s) => setR(s.exists() ? { id: s.id, ...s.data() } : null), () => setR(null));
    }, [brandId, requestId]);
    return r;
}
export function useVersions(brandId, requestId) {
    const [list, setList] = useState([]);
    useEffect(() => {
        if (!brandId)
            return;
        return onSnapshot(query(collection(db, 'brands', brandId, 'requests', requestId, 'versions'), orderBy('n', 'asc')), (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setList([]));
    }, [brandId, requestId]);
    return list;
}
export function useComments(brandId, requestId) {
    const [list, setList] = useState([]);
    useEffect(() => {
        if (!brandId)
            return;
        return onSnapshot(query(collection(db, 'brands', brandId, 'requests', requestId, 'comments'), orderBy('createdAt', 'asc')), (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setList([]));
    }, [brandId, requestId]);
    return list;
}
