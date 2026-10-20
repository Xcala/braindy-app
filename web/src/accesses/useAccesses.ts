import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';

export type Access = {
  id: string; platform: string; username?: string; link?: string; notes?: string; hasSecret?: boolean;
  sharedWithBraindy?: boolean; updatedByName?: string; updatedAt?: Timestamp; lastRevealedAt?: Timestamp;
};
export type AccessEvent = { id: string; platform: string; action: 'added' | 'updated' | 'deleted' | 'revealed' | 'copied'; byName: string; at?: Timestamp };

/** Credential metadata of a brand. `denied` = the user is not an owner (rules refuse the read). */
export function useAccesses(brandId?: string) {
  const [state, setState] = useState<{ list: Access[]; loading: boolean; denied: boolean }>({ list: [], loading: true, denied: false });
  useEffect(() => {
    if (!brandId) return;
    setState({ list: [], loading: true, denied: false });
    return onSnapshot(query(collection(db, 'brands', brandId, 'accesses'), orderBy('platform')),
      (s) => setState({ list: s.docs.map((d) => ({ id: d.id, ...d.data() }) as Access), loading: false, denied: false }),
      () => setState({ list: [], loading: false, denied: true }));
  }, [brandId]);
  return state;
}

export function useAccessLog(brandId?: string, max = 8) {
  const [events, setEvents] = useState<AccessEvent[]>([]);
  useEffect(() => {
    if (!brandId) return;
    return onSnapshot(query(collection(db, 'brands', brandId, 'accessLog'), orderBy('at', 'desc'), limit(max)),
      (s) => setEvents(s.docs.map((d) => ({ id: d.id, ...d.data() }) as AccessEvent)), (e) => { console.warn('accessLog', e.code); setEvents([]); });
  }, [brandId, max]);
  return events;
}

const base = (brandId: string) => `/v1/brands/${encodeURIComponent(brandId)}/accesses`;
export type AccessInput = { platform: string; username: string; password?: string; link?: string; notes?: string; sharedWithBraindy?: boolean };

export const accessesApi = {
  add: (brandId: string, a: AccessInput) => api<{ id: string }>(base(brandId), { method: 'POST', body: JSON.stringify(a) }),
  update: (brandId: string, id: string, a: Partial<AccessInput>) => api(`${base(brandId)}/${id}`, { method: 'PATCH', body: JSON.stringify(a) }),
  remove: (brandId: string, id: string) => api(`${base(brandId)}/${id}`, { method: 'DELETE' }),
  reveal: (brandId: string, id: string) => api<{ value: string; seconds: number }>(`${base(brandId)}/${id}/reveal`, { method: 'POST', body: '{}' }),
  copied: (brandId: string, id: string) => api(`${base(brandId)}/${id}/copied`, { method: 'POST', body: '{}' }),
};
