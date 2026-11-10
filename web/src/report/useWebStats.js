import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
/** The brand's website numbers (read from Google Analytics by the server). Rules only let them through where Results is on. */
export function useWebStats(brandId, enabled) {
    const [stats, setStats] = useState(null);
    useEffect(() => {
        if (!brandId || !enabled) {
            setStats(null);
            return;
        }
        return onSnapshot(doc(db, 'brands', brandId, 'webStats', 'ga4'), (s) => {
            const x = s.data();
            setStats(x && (x.daily ?? []).length ? { daily: x.daily, totals: x.totals ?? {}, lists: x.lists ?? {}, updatedAt: x.updatedAt?.toDate() ?? null } : null);
        }, () => setStats(null));
    }, [brandId, enabled]);
    return stats;
}
