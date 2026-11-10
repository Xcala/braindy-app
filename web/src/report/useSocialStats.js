import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
/** Order networks show in, most used first. */
const ORDER = ['instagram', 'facebook', 'linkedin', 'tiktok', 'youtube'];
/** The brand's social results per network (mirrored from Metricool by the server). Rules only let them through where Results is on. */
export function useSocialStats(brandId, enabled) {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!brandId || !enabled) {
            setList([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        return onSnapshot(collection(db, 'brands', brandId, 'socialStats'), (s) => {
            const rows = s.docs.map((d) => {
                const x = d.data();
                return { network: d.id, handle: x.handle ?? '', daily: x.daily ?? [], posts: x.posts ?? [], audience: x.audience ?? null, updatedAt: x.updatedAt?.toDate() ?? null };
            });
            const rank = (n) => (ORDER.indexOf(n) + 1 || 99);
            setList(rows.filter((r) => r.daily.length || r.posts.length).sort((a, b) => rank(a.network) - rank(b.network)));
            setLoading(false);
        }, () => { setList([]); setLoading(false); });
    }, [brandId, enabled]);
    return { list, loading };
}
