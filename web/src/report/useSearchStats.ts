import { useEffect, useState } from 'react';
import { doc, onSnapshot, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { WebPeriod } from './useWebStats';

export type SearchDay = { d: string; clicks?: number | null; impr?: number | null; pos?: number | null };
export type SearchRow = { name: string; n: number; i: number; pos: number };
export type SearchStats = {
  daily: SearchDay[];
  lists: Partial<Record<WebPeriod, Partial<Record<'queries' | 'pages' | 'devices', SearchRow[]>>>>;
  updatedAt: Date | null;
};

/** The brand's Google search numbers (read from Search Console by the server). Rules only let them through where Results is on. */
export function useSearchStats(brandId: string | undefined, enabled: boolean) {
  const [stats, setStats] = useState<SearchStats | null>(null);
  useEffect(() => {
    if (!brandId || !enabled) { setStats(null); return; }
    return onSnapshot(doc(db, 'brands', brandId, 'webStats', 'gsc'), (s) => {
      const x = s.data();
      setStats(x && (x.daily ?? []).length ? { daily: x.daily, lists: x.lists ?? {}, updatedAt: (x.updatedAt as Timestamp | undefined)?.toDate() ?? null } : null);
    }, () => setStats(null));
  }, [brandId, enabled]);
  return stats;
}
