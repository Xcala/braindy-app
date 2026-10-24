// "El Criterio de NicoMarca" / "NickMark Taste": lessons (how and why a piece is done well) and answers to the
// typical objections. Top-level collections; clients read published items, the admin reads and edits everything.
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../lib/api';

export type L2 = { es: string; en: string };
export type Area = 'process' | 'logos' | 'strategy' | 'web' | 'webtech' | 'dashboards' | 'apps' | 'brandkit' | 'print' | 'social';
export const AREAS: Area[] = ['process', 'logos', 'strategy', 'web', 'webtech', 'dashboards', 'apps', 'brandkit', 'print', 'social'];
export type Stage = 'onboarding' | 'ask' | 'review' | 'report';

export type Lesson = {
  id: string; area: Area; order: number; status: 'draft' | 'published'; minutes: number;
  title: L2; summary: L2; body: L2; script?: L2; videoUrl?: string; deckUrl?: string;
  categories: string[]; stages: Stage[]; updatedAt?: Timestamp;
};
export type Objection = {
  id: string; area: Area; order: number; status: 'draft' | 'published';
  phrase: L2; answer: L2; triggers: string[]; lessonId?: string;
};

function useTop<T extends { order: number }>(name: string) {
  const { profile } = useAuth();
  const admin = profile?.role === 'admin';
  const [list, setList] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!profile) return;
    const base = collection(db, name);
    return onSnapshot(admin ? base : query(base, where('status', '==', 'published')),
      (s) => { setList(s.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as T).sort((a, b) => a.order - b.order)); setLoading(false); },
      () => { setList([]); setLoading(false); });
  }, [name, admin, profile]);
  return { list, loading, admin };
}

export const useLessons = () => useTop<Lesson>('lessons');
export const useObjections = () => useTop<Objection>('objections');

/** Lessons that fit a request type (taxonomy category) and/or a moment. Published only, unless asked otherwise. */
export function pick(lessons: Lesson[], o: { category?: string; stage?: Stage; includeDrafts?: boolean }) {
  return lessons.filter((l) => (o.includeDrafts || l.status === 'published')
    && (!o.category || l.categories.includes(o.category))
    && (!o.stage || l.stages.includes(o.stage)));
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/** The objection a comment sounds like, if any (published only). */
export function matchObjection(text: string, objections: Objection[]) {
  const t = norm(text);
  if (t.trim().length < 6) return null;
  return objections.find((o) => o.status === 'published' && o.triggers.some((k) => t.includes(norm(k)))) ?? null;
}

/** One lesson per ISO week, rotating through the published ones. */
export function lessonOfWeek(lessons: Lesson[]) {
  const pub = lessons.filter((l) => l.status === 'published');
  if (!pub.length) return null;
  const week = Math.floor(Date.now() / (7 * 864e5));
  return pub[week % pub.length];
}

/** Video links → embeddable URL (YouTube, Loom, Vimeo, Google Drive). Anything else opens as a link. */
export function embedUrl(url?: string) {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{6,})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const loom = url.match(/loom\.com\/(?:share|embed)\/([\w]+)/);
  if (loom) return `https://www.loom.com/embed/${loom[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;
  return null;
}

/** Tells NickMark which objections show up (shown / opened the lesson / sent anyway). Never sends the comment text. */
export const logObjection = (brandId: string, objectionId: string, outcome: 'shown' | 'opened' | 'sent') =>
  api('/v1/criterio/hits', { method: 'POST', body: JSON.stringify({ brandId, objectionId, outcome }) }).catch(() => undefined);
