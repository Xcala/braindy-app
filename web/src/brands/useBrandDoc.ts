import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

type Data = Record<string, unknown>;

/** Live document under the current brand, e.g. useBrandDoc(id, 'context/identity'). */
export function useBrandDoc(brandId: string | undefined, path: string) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!brandId) return;
    setLoading(true);
    return onSnapshot(
      doc(db, 'brands', brandId, ...path.split('/')),
      (s) => { setData(s.exists() ? s.data() : null); setLoading(false); },
      () => { setData(null); setLoading(false); },
    );
  }, [brandId, path]);
  return { data, loading };
}

/** Live collection under the current brand, e.g. useBrandCollection(id, 'assets'). */
export function useBrandCollection(brandId: string | undefined, name: string) {
  const [docs, setDocs] = useState<Array<Data & { id: string }>>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!brandId) return;
    setLoading(true);
    return onSnapshot(
      collection(db, 'brands', brandId, name),
      (s) => { setDocs(s.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); },
      () => { setDocs([]); setLoading(false); },
    );
  }, [brandId, name]);
  return { docs, loading };
}
