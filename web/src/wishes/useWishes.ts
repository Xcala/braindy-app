// Wishlist: what clients ask Braindy (the app itself) to improve or fix.
// A client's wish lives under its brand (brands/{id}/wishes): only that brand's people and the admin see it.
// The history every client sees is top-level (wishes/{id}, public: true), written by the admin with no client names.
// The admin reads both at once through a collection-group query. Rules: firestore.rules › Wishlist.
import { useEffect, useState } from 'react';
import {
  addDoc, arrayRemove, arrayUnion, collection, collectionGroup, deleteDoc, onSnapshot, query, serverTimestamp,
  updateDoc, where, type DocumentReference, type Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';

export const WISH_STATUSES = ['new', 'planned', 'doing', 'done', 'declined'] as const;
export type WishStatus = (typeof WISH_STATUSES)[number];
export type WishKind = 'improve' | 'fix';
export const STATUS_COLOR: Record<WishStatus, string> = { new: '#2A7FFF', planned: '#8B5CF6', doing: '#F5B301', done: '#16A34A', declined: '#8A94A6' };

export type Wish = {
  id: string; ref: DocumentReference; brandId: string | null; public: boolean;
  text: string; kind: WishKind; status: WishStatus; votes: string[];
  author?: string; authorName?: string; reply?: string;
  /** A voice note instead of (or with) the text: a file in the brand's Uploads. Not transcribed; NickMark can type it in later. */
  audio?: { assetId: string; name: string; size: number; contentType: string };
  createdAt?: Timestamp; doneAt?: Timestamp;
  /** Admin only: who asked for a history entry. */
  credit?: { brandId: string; name: string };
};

const toWish = (d: { id: string; ref: DocumentReference; data: () => Record<string, unknown> }): Wish => {
  const x = d.data();
  const brandId = d.ref.parent.parent?.id ?? null;
  return { votes: [], kind: 'improve', status: 'new', text: '', ...x, public: x.public === true, id: d.id, ref: d.ref, brandId } as unknown as Wish;
};

/** Open first (most «me too» first), then done and declined, newest first. */
const order: Record<WishStatus, number> = { doing: 0, planned: 1, new: 2, done: 3, declined: 4 };
const sortWishes = (l: Wish[]) => l.sort((a, b) => order[a.status] - order[b.status]
  || (a.status === 'done' || a.status === 'declined' ? 0 : b.votes.length - a.votes.length)
  || ((b.doneAt ?? b.createdAt)?.toMillis() ?? 0) - ((a.doneAt ?? a.createdAt)?.toMillis() ?? 0));

export function useWishes(brandId: string | undefined) {
  const { profile } = useAuth();
  const admin = profile?.role === 'admin';
  const [mine, setMine] = useState<Wish[]>([]);
  const [shared, setShared] = useState<Wish[]>([]);
  const [all, setAll] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<Record<string, { brandId: string; name: string }>>({});

  useEffect(() => {
    if (!profile) return;
    if (admin) {
      const offs = [onSnapshot(collectionGroup(db, 'wishes'), (s) => { setAll(s.docs.map(toWish)); setLoading(false); }, () => setLoading(false)),
        onSnapshot(collection(db, 'wishCredits'), (s) => setCredits(Object.fromEntries(s.docs.map((d) => [d.id, d.data() as { brandId: string; name: string }]))), () => undefined)];
      return () => offs.forEach((off) => off());
    }
    const offs = [onSnapshot(query(collection(db, 'wishes'), where('public', '==', true)),
      (s) => { setShared(s.docs.map(toWish)); setLoading(false); }, () => setLoading(false))];
    if (brandId) offs.push(onSnapshot(collection(db, 'brands', brandId, 'wishes'), (s) => setMine(s.docs.map(toWish)), () => setMine([])));
    else setMine([]);
    return () => offs.forEach((off) => off());
  }, [admin, profile, brandId]);

  // The admin sees who asked for each history entry (wishCredits); clients never get it.
  const withCredit = all.map((w) => (w.public && credits[w.id] ? { ...w, brandId: null, credit: credits[w.id] } : w));
  return { list: sortWishes(admin ? withCredit : [...mine, ...shared]), loading, admin };
}

export const addWish = (brandId: string, text: string, kind: WishKind, author: string, authorName: string, audio?: Wish['audio']) =>
  addDoc(collection(db, 'brands', brandId, 'wishes'), { text, kind, status: 'new', author, authorName: authorName.slice(0, 120), votes: [], createdAt: serverTimestamp(), ...(audio ? { audio } : {}) });

/** Admin: a history entry every client sees, with no client or brand names. */
export const addPublicWish = (text: string, kind: WishKind, status: WishStatus) =>
  addDoc(collection(db, 'wishes'), { text, kind, status, public: true, votes: [], createdAt: serverTimestamp(), ...(status === 'done' ? { doneAt: serverTimestamp() } : {}) });

export const toggleVote = (w: Wish, uid: string) => updateDoc(w.ref, { votes: w.votes.includes(uid) ? arrayRemove(uid) : arrayUnion(uid) });

export const editWishText = (w: Wish, text: string) => updateDoc(w.ref, { text, editedAt: serverTimestamp() });

/** Admin: status and answer. Done stamps the day it was done. */
export const setWishAdmin = (w: Wish, status: WishStatus, reply: string) =>
  updateDoc(w.ref, { status, reply, ...(status === 'done' && w.status !== 'done' ? { doneAt: serverTimestamp() } : {}) });

export const deleteWish = (w: Wish) => deleteDoc(w.ref);
