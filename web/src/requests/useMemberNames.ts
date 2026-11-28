import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

/** Names of the brand's people (name, else email or phone), to say who asked for each request. */
export function useMemberNames(brandId: string | undefined) {
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!brandId) return;
    return onSnapshot(collection(db, 'brands', brandId, 'members'),
      (s) => setNames(Object.fromEntries(s.docs.map((d) => [d.id, String(d.data().name || d.data().email || d.data().phone || '')]))), () => setNames({}));
  }, [brandId]);
  return names;
}
