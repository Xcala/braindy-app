import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
/** The brand's Google search numbers (read from Search Console by the server). Rules only let them through where Results is on. */
export function useSearchStats(brandId, enabled) {
    const [stats, setStats] = useState(null);
    useEffect(() => {
        if (!brandId || !enabled) {
            setStats(null);
            return;
        }
        return onSnapshot(doc(db, 'brands', brandId, 'webStats', 'gsc'), (s) => {
            const x = s.data();
            setStats(x && (x.daily ?? []).length ? { daily: x.daily, lists: x.lists ?? {}, updatedAt: x.updatedAt?.toDate() ?? null } : null);
        }, () => setStats(null));
    }, [brandId, enabled]);
    return stats;
}
