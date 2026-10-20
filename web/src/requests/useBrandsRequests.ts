import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BrandRequest } from './types';

export type ScopedRequest = BrandRequest & { brandId: string };

/** Requests of several brands at once (a brand, or a group plus every brand below it). */
export function useBrandsRequests(brandIds: string[]) {
  const [byBrand, setByBrand] = useState<Record<string, ScopedRequest[]>>({});
  const key = brandIds.join(',');
  useEffect(() => {
    setByBrand({});
    if (!key) return;
    const unsubs = key.split(',').map((id) => onSnapshot(
      query(collection(db, 'brands', id, 'requests'), orderBy('createdAt', 'desc')),
      (s) => setByBrand((m) => ({ ...m, [id]: s.docs.map((d) => ({ id: d.id, brandId: id, ...d.data() }) as ScopedRequest) })),
      () => setByBrand((m) => ({ ...m, [id]: [] })),
    ));
    return () => unsubs.forEach((u) => u());
  }, [key]);
  return Object.values(byBrand).flat().sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
}
