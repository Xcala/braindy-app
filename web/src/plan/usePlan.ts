import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';
import type { BrandPlan, PackStatus } from './types';

/** What the brand contracted (billing people and admin; others get null from the rules). undefined = loading. */
export function usePlan(brandId?: string) {
  const [plan, setPlan] = useState<BrandPlan | null | undefined>(undefined);
  useEffect(() => {
    if (!brandId) return;
    setPlan(undefined);
    return onSnapshot(doc(db, 'brands', brandId, 'billing', 'contracted'), (s) => setPlan(s.exists() ? (s.data() as BrandPlan) : null), () => setPlan(null));
  }, [brandId]);
  return plan;
}

const a = (id: string) => `/v1/admin/brands/${encodeURIComponent(id)}/plan`;

export const planApi = {
  set: (brandId: string, p: unknown) => api<{ ok: true; summary: string }>(a(brandId), { method: 'PUT', body: JSON.stringify(p) }),
  remove: (brandId: string) => api(a(brandId), { method: 'DELETE' }),
  packStatus: (brandId: string, pack: number, status: PackStatus) => api(`${a(brandId)}/packs/${pack}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};
