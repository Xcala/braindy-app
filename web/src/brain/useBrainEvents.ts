import { useEffect, useRef, useState } from 'react';
import { collection, getCountFromServer, limit, onSnapshot, orderBy, query, where, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Area } from './knowledge';

export type BrainKind = 'request' | 'approved' | 'changed' | 'identity' | 'file' | 'session' | 'meeting' | 'signed';
export type BrainEvent = { id: string; kind: BrainKind; area: Area; text?: string; parts?: string[]; count?: number; requestId?: string; at: Date | null };

/**
 * The Brand Brain feed, live (newest first). `onNew` fires for events that arrive after the page opened,
 * so the page can animate each one into the brain; the ones already there do not animate.
 */
export function useBrainEvents(brandId: string | undefined, onNew?: (e: BrainEvent) => void) {
  const [events, setEvents] = useState<BrainEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [talks, setTalks] = useState(0);
  const cb = useRef(onNew);
  cb.current = onNew;
  useEffect(() => {
    if (!brandId) return;
    setLoading(true);
    let first = true;
    const col = collection(db, 'brands', brandId, 'brainEvents');
    // includeMetadataChanges: the first answer can come from the local cache; only events after the server's first answer animate.
    const off = onSnapshot(query(col, orderBy('at', 'desc'), limit(80)), { includeMetadataChanges: true }, (s) => {
      setEvents(s.docs.map((d) => toEvent(d.id, d.data())));
      if (s.metadata.fromCache) return;
      if (!first) s.docChanges().filter((c) => c.type === 'added').reverse().forEach((c) => cb.current?.(toEvent(c.doc.id, c.doc.data())));
      if (!first && s.docChanges().some((c) => c.type === 'added' && ['meeting', 'session'].includes(String(c.doc.get('kind'))))) setTalks((n) => n + 1);
      first = false;
      setLoading(false);
    }, () => { setEvents([]); setLoading(false); });
    getCountFromServer(query(col, where('kind', 'in', ['meeting', 'session']))).then((r) => setTalks(r.data().count)).catch(() => undefined);
    return off;
  }, [brandId]);
  return { events, loading, talks };
}

function toEvent(id: string, d: Record<string, unknown>): BrainEvent {
  return {
    id, kind: d.kind as BrainKind, area: d.area as Area, text: d.text as string | undefined, parts: d.parts as string[] | undefined,
    count: d.count as number | undefined, requestId: d.requestId as string | undefined, at: (d.at as Timestamp | undefined)?.toDate?.() ?? null,
  };
}

/** The newest thing the brand's Brain learned, live (Home's loop strip). */
export function useLastBrainEvent(brandId: string | undefined) {
  const [last, setLast] = useState<BrainEvent | null>(null);
  useEffect(() => {
    if (!brandId) return;
    return onSnapshot(query(collection(db, 'brands', brandId, 'brainEvents'), orderBy('at', 'desc'), limit(1)),
      (s) => setLast(s.docs[0] ? toEvent(s.docs[0].id, s.docs[0].data()) : null), () => setLast(null));
  }, [brandId]);
  return last;
}

/** True for a few seconds each time the brand's Brain learns something new (for the pulse on My brand in the menu). */
export function useBrainPulse(brandId: string | undefined) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!brandId) return;
    let first = true, timer = 0;
    const off = onSnapshot(query(collection(db, 'brands', brandId, 'brainEvents'), orderBy('at', 'desc'), limit(1)), { includeMetadataChanges: true }, (s) => {
      if (s.metadata.fromCache) return;
      if (!first && s.docChanges().some((c) => c.type === 'added')) { setOn(true); clearTimeout(timer); timer = window.setTimeout(() => setOn(false), 4500); }
      first = false;
    }, () => undefined);
    return () => { off(); clearTimeout(timer); };
  }, [brandId]);
  return on;
}
