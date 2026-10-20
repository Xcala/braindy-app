import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';

export type Report = {
  id: string; month: string; salesAttributed: number | null; salesPrev: number | null; leads: number | null; costPerLead: number | null;
  currency: string; leadsByMonth: Array<{ month: string; n: number }>; whatMoved: string; nextMonth: string;
  pieces: number; firstTryPct: number | null; published: boolean;
};

/** Reports of a brand. Clients only receive published ones (rules); admin gets drafts too. */
export function useReports(brandId: string | undefined, admin: boolean) {
  const [list, setList] = useState<Report[]>([]);
  useEffect(() => {
    if (!brandId) return;
    const base = collection(db, 'brands', brandId, 'reports');
    const q = admin ? query(base, orderBy('month', 'desc')) : query(base, where('published', '==', true), orderBy('month', 'desc'));
    return onSnapshot(q, (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Report)), () => setList([]));
  }, [brandId, admin]);
  return list;
}

export const saveReport = (brandId: string, month: string, r: Partial<Report>) =>
  api<{ pieces: number; firstTryPct: number | null }>(`/v1/admin/brands/${encodeURIComponent(brandId)}/reports/${month}`, { method: 'PUT', body: JSON.stringify(r) });
