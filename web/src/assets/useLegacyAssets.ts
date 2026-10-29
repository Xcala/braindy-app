import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { LegacyAsset } from './BrandDocs';

/** Assets carried over from the old apps (LogoDecks, MarketMaps, orbit documents). */
export function useLegacyAssets(brandId: string | undefined) {
  const [docs, setDocs] = useState<LegacyAsset[]>([]);
  useEffect(() => {
    if (!brandId) { setDocs([]); return; }
    const q = query(collection(db, 'brands', brandId, 'assets'), where('source', '==', 'legacy'));
    return onSnapshot(q, (snap) => setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as LegacyAsset)), () => setDocs([]));
  }, [brandId]);
  return docs;
}
