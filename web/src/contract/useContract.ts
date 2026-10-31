import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';
import type { Contract, PackStatus } from './types';

/** The brand's contracted plan (owners and admin; others get null from the rules). undefined = loading. */
export function useContract(brandId?: string) {
  const [contract, setContract] = useState<Contract | null | undefined>(undefined);
  useEffect(() => {
    if (!brandId) return;
    setContract(undefined);
    return onSnapshot(doc(db, 'brands', brandId, 'billing', 'contract'), (s) => setContract(s.exists() ? (s.data() as Contract) : null), () => setContract(null));
  }, [brandId]);
  return contract;
}

const a = (id: string) => `/v1/admin/brands/${encodeURIComponent(id)}/contract`;
const patch = (body: unknown): RequestInit => ({ method: 'PATCH', body: JSON.stringify(body) });

export const contractApi = {
  set: (brandId: string, c: unknown) => api<{ ok: true; summary: string }>(a(brandId), { method: 'PUT', body: JSON.stringify(c) }),
  remove: (brandId: string) => api(a(brandId), { method: 'DELETE' }),
  rowDone: (brandId: string, section: number, row: number, done: boolean) => api(`${a(brandId)}/progress`, patch({ row: [section, row], done })),
  packStatus: (brandId: string, pack: number, status: PackStatus) => api(`${a(brandId)}/progress`, patch({ pack, status })),
};
