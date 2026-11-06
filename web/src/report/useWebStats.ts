import { useEffect, useState } from 'react';
import { doc, onSnapshot, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type WebKey = 'users' | 'newUsers' | 'sessions' | 'engaged' | 'views' | 'engTime' | 'keyEvents';
export type WebDay = { d: string } & Partial<Record<WebKey, number | null>>;
export type WebTotals = Partial<Record<WebKey, number | null>>;
export type WebPeriod = '30' | '90' | '365';
export type WebRow = { name: string; n: number; u?: number };
export type WebLists = Partial<Record<'pages' | 'channels' | 'sources' | 'countries' | 'cities' | 'devices', WebRow[]>>;
export type WebStats = {
  daily: WebDay[];
  totals: Partial<Record<WebPeriod, { cur: WebTotals | null; prev: WebTotals | null }>>;
  lists: Partial<Record<WebPeriod, WebLists>>;
  updatedAt: Date | null;
};

/** The brand's website numbers (read from Google Analytics by the server). Rules only let them through where Results is on. */
export function useWebStats(brandId: string | undefined, enabled: boolean) {
  const [stats, setStats] = useState<WebStats | null>(null);
  useEffect(() => {
    if (!brandId || !enabled) { setStats(null); return; }
    return onSnapshot(doc(db, 'brands', brandId, 'webStats', 'ga4'), (s) => {
      const x = s.data();
      setStats(x && (x.daily ?? []).length ? { daily: x.daily, totals: x.totals ?? {}, lists: x.lists ?? {}, updatedAt: (x.updatedAt as Timestamp | undefined)?.toDate() ?? null } : null);
    }, () => setStats(null));
  }, [brandId, enabled]);
  return stats;
}
