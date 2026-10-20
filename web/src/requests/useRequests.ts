import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BrandRequest, RequestComment, Version } from './types';

export function useRequests(brandId?: string) {
  const [list, setList] = useState<BrandRequest[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!brandId) return;
    setLoading(true);
    return onSnapshot(query(collection(db, 'brands', brandId, 'requests'), orderBy('createdAt', 'desc')), (s) => {
      setList(s.docs.map((d) => ({ id: d.id, ...d.data() }) as BrandRequest));
      setLoading(false);
    }, () => { setList([]); setLoading(false); });
  }, [brandId]);
  return { list, loading };
}

export function useRequest(brandId: string | undefined, requestId: string) {
  const [r, setR] = useState<BrandRequest | null | undefined>(undefined);
  useEffect(() => {
    if (!brandId) return;
    return onSnapshot(doc(db, 'brands', brandId, 'requests', requestId),
      (s) => setR(s.exists() ? ({ id: s.id, ...s.data() } as BrandRequest) : null), () => setR(null));
  }, [brandId, requestId]);
  return r;
}

export function useVersions(brandId: string | undefined, requestId: string) {
  const [list, setList] = useState<Version[]>([]);
  useEffect(() => {
    if (!brandId) return;
    return onSnapshot(query(collection(db, 'brands', brandId, 'requests', requestId, 'versions'), orderBy('n', 'asc')),
      (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Version)), () => setList([]));
  }, [brandId, requestId]);
  return list;
}

export function useComments(brandId: string | undefined, requestId: string) {
  const [list, setList] = useState<RequestComment[]>([]);
  useEffect(() => {
    if (!brandId) return;
    return onSnapshot(query(collection(db, 'brands', brandId, 'requests', requestId, 'comments'), orderBy('createdAt', 'asc')),
      (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }) as RequestComment)), () => setList([]));
  }, [brandId, requestId]);
  return list;
}
