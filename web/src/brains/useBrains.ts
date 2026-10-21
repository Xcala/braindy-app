import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, where, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';

export type Insight = {
  id: string; brain: string; kind: 'competitor_change' | 'group_analysis'; title: string; body?: string; url?: string; ai?: boolean; at?: Timestamp;
  insights?: string[]; opportunities?: string[];
  stats?: Array<{ brandId: string; name: string; open: number; toApprove: number; approved90: number; firstTryPct: number | null; avgDays: number | null }>;
};
export type BrainTask = { id: string; brain: string; brandId: string; kind: string; title: string; status: 'running' | 'done'; ai?: boolean; createdAt?: Timestamp };

/** Brain insights of a brand (competitor changes, group analyses), newest first. */
export function useInsights(brandId: string | undefined, kind?: Insight['kind'], max = 5) {
  const [list, setList] = useState<Insight[]>([]);
  useEffect(() => {
    if (!brandId) return;
    const base = collection(db, 'brands', brandId, 'insights');
    const q = kind ? query(base, where('kind', '==', kind), orderBy('at', 'desc'), limit(max)) : query(base, orderBy('at', 'desc'), limit(max));
    return onSnapshot(q, (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Insight)), () => setList([]));
  }, [brandId, kind, max]);
  return list;
}

/** Admin: the latest Brain tasks (what each Brain is doing, for which brand). */
export function useBrainTasks(enabled: boolean, max = 30) {
  const [list, setList] = useState<BrainTask[]>([]);
  useEffect(() => {
    if (!enabled) return;
    return onSnapshot(query(collection(db, 'brainTasks'), orderBy('createdAt', 'desc'), limit(max)),
      (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }) as BrainTask)), () => setList([]));
  }, [enabled, max]);
  return list;
}

const post = (path: string) => api<Record<string, unknown>>(path, { method: 'POST', body: '{}' });
export const brainsApi = {
  draftReport: (brandId: string, month: string) => post(`/v1/admin/brands/${brandId}/brains/report/${month}`),
  watch: (brandId: string) => post(`/v1/admin/brands/${brandId}/brains/watch`) as Promise<{ results: Array<{ name: string; status: string }> }>,
  analyzeGroup: (brandId: string) => post(`/v1/brands/${brandId}/analysis`),
};
