import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
/** The brand's social posts between two dates (mirrored from Metricool by the server), oldest first. */
export function useSocialPosts(brandId, from, to) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const key = `${brandId}|${+from}|${+to}`;
    useEffect(() => {
        if (!brandId)
            return;
        setLoading(true);
        const q = query(collection(db, 'brands', brandId, 'socialPosts'), where('date', '>=', Timestamp.fromDate(from)), where('date', '<', Timestamp.fromDate(to)), orderBy('date'));
        return onSnapshot(q, (s) => {
            setPosts(s.docs.map((d) => { const x = d.data(); return { id: d.id, ...x, date: x.date.toDate() }; }));
            setLoading(false);
        }, () => { setPosts([]); setLoading(false); });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
    return { posts, loading };
}
/** Whether the brand has any post at all (the menu shows Calendar only then, except to the admin). */
export function useHasSocial(brandId) {
    const [has, setHas] = useState(false);
    useEffect(() => {
        if (!brandId)
            return;
        return onSnapshot(query(collection(db, 'brands', brandId, 'socialPosts'), limit(1)), (s) => setHas(!s.empty), () => setHas(false));
    }, [brandId]);
    return has;
}
