import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Proposal, Send, SendEvent } from './types';

export function useProposals() {
  const [list, setList] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => onSnapshot(query(collection(db, 'proposals'), orderBy('createdAt', 'desc')), (s) => {
    setList(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Proposal));
    setLoading(false);
  }, () => setLoading(false)), []);
  return { list, loading };
}

export function useProposal(id: string) {
  const [p, setP] = useState<Proposal | null | undefined>(undefined);
  useEffect(() => onSnapshot(doc(db, 'proposals', id), (s) => setP(s.exists() ? ({ id: s.id, ...s.data() } as Proposal) : null)), [id]);
  return p;
}

export function useSends(id: string) {
  const [sends, setSends] = useState<Send[]>([]);
  useEffect(() => onSnapshot(query(collection(db, 'proposals', id, 'sends'), orderBy('createdAt', 'desc')),
    (s) => setSends(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Send))), [id]);
  return sends;
}

export function useEvents(id: string, sendId: string) {
  const [events, setEvents] = useState<SendEvent[]>([]);
  useEffect(() => onSnapshot(query(collection(db, 'proposals', id, 'sends', sendId, 'events'), orderBy('at', 'asc')),
    (s) => setEvents(s.docs.map((d) => ({ id: d.id, ...d.data() }) as SendEvent))), [id, sendId]);
  return events;
}

export function useProposalFiles(id: string) {
  const [files, setFiles] = useState<Array<{ id: string; title: string; contentType: string; size: number; status: string }>>([]);
  useEffect(() => onSnapshot(collection(db, 'proposals', id, 'files'),
    (s) => setFiles(s.docs.map((d) => ({ id: d.id, ...d.data() }) as never))), [id]);
  return files;
}
