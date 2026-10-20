import { useEffect, useState } from 'react';
import { collectionGroup, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BrandRequest } from '../requests/types';

export type WorkItem = BrandRequest & { brandId: string };

/** Admin: every open request across all brands (in production or waiting for approval). */
export function useOpenWork() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => onSnapshot(
    query(collectionGroup(db, 'requests'), where('status', 'in', ['in_production', 'to_approve'])),
    (s) => {
      setItems(s.docs.map((d) => ({ id: d.id, brandId: d.ref.parent.parent!.id, ...d.data() }) as WorkItem));
      setLoading(false);
    },
    () => setLoading(false),
  ), []);
  return { items, loading };
}
