import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';
import { savePlan } from '../requests/api';
import { useOpenWork, type WorkItem } from '../team/useWork';
import { useBrainTasks, type BrainTask } from '../brains/useBrains';
import type { BrainId } from '../requests/taxonomy';
import type { SeatId } from './geometry';

/** An instruction from NickMark to one Brain (admin-only, never shown to clients). */
export type InboxNote = { id: string; brain: BrainId; brandId: string; requestId?: string | null; text: string; status: 'open' | 'done'; createdAt?: Timestamp };
export type SeatState = 'working' | 'withClient' | 'toSign' | 'free';
export interface SeatView { state: SeatState; now?: { title: string; brandId: string }; queue: WorkItem[]; notes: InboxNote[] }

const BRAINS: BrainId[] = ['researcher', 'marketer', 'creator', 'builder'];
const byDue = (a: WorkItem, b: WorkItem) => String(a.dueDate ?? '9999').localeCompare(String(b.dueDate ?? '9999'));

/** What NickMark has to sign: plans to approve and versions he reviews before the client sees them. */
export const needsSignature = (i: WorkItem) =>
  i.stage === 'plan' || (i.approvalLevel === 'nicolas' && i.stage === 'work' && (i.versionCount ?? 0) > 0);

function useInbox() {
  const [notes, setNotes] = useState<InboxNote[]>([]);
  useEffect(() => onSnapshot(
    query(collection(db, 'brainInbox'), where('status', '==', 'open'), orderBy('createdAt', 'desc'), limit(50)),
    (s) => setNotes(s.docs.map((d) => ({ id: d.id, ...d.data() }) as InboxNote)),
    () => setNotes([]),
  ), []);
  return notes;
}

/** Each seat's state, current work, queue and open instructions. */
export function buildSeats(items: WorkItem[], tasks: BrainTask[], notes: InboxNote[]) {
  const out = {} as Record<SeatId, SeatView>;
  for (const b of BRAINS) {
    const queue = items.filter((i) => i.status === 'in_production' && i.leadBrain === b).sort(byDue);
    const running = tasks.find((t) => t.brain === b && t.status === 'running');
    const withClient = items.some((i) => i.status === 'to_approve' && i.leadBrain === b);
    const now = running ? { title: running.title, brandId: running.brandId } : queue[0] && { title: queue[0].title, brandId: queue[0].brandId };
    out[b] = { state: running || queue.length ? 'working' : withClient ? 'withClient' : 'free', now, queue, notes: notes.filter((n) => n.brain === b) };
  }
  const toSign = items.filter(needsSignature).sort(byDue);
  out.nico = { state: toSign.length ? 'toSign' : 'free', now: toSign[0] && { title: toSign[0].title, brandId: toSign[0].brandId }, queue: toSign, notes: [] };
  return out;
}

/** Live data of the studio: each seat's state, current work, queue and open instructions, plus the activity feed. */
export function useStudio() {
  const { items, loading } = useOpenWork();
  const tasks = useBrainTasks(true, 30);
  const notes = useInbox();

  const seats = useMemo(() => buildSeats(items, tasks, notes), [items, tasks, notes]);

  const feed = useMemo(() => [
    ...tasks.slice(0, 12).map((t: BrainTask) => ({ id: 't' + t.id, brain: t.brain as BrainId, brandId: t.brandId, text: t.title, at: t.createdAt?.toMillis() ?? 0, kind: 'task' as const })),
    ...notes.slice(0, 12).map((n) => ({ id: 'n' + n.id, brain: n.brain, brandId: n.brandId, text: n.text, at: n.createdAt?.toMillis() ?? Date.now(), kind: 'note' as const })),
  ].sort((a, b) => b.at - a.at).slice(0, 8), [tasks, notes]);

  return { seats, feed, items, loading, toSignCount: seats.nico.queue.length };
}

/** Sign: approves the plan, or publishes the version NickMark reviewed so the client can approve it. */
export async function sign(i: WorkItem) {
  if (i.stage === 'plan') {
    if (!i.plan) throw new Error('no_plan');
    return savePlan(i.brandId, i.id, { scope: i.plan.scope ?? [], firstDelivery: i.plan.firstDelivery ?? '', note: i.plan.note ?? '', approve: true });
  }
  return api(`/v1/admin/brands/${i.brandId}/requests/${i.id}/versions/v${i.versionCount}/publish`, { method: 'POST', body: '{}' });
}

/** Write: leaves an instruction for a Brain, optionally tied to one request. */
export const writeTo = (brain: BrainId, brandId: string, text: string, uid: string, requestId?: string) =>
  addDoc(collection(db, 'brainInbox'), { brain, brandId, requestId: requestId ?? null, text: text.trim().slice(0, 2000), status: 'open', by: uid, createdAt: serverTimestamp() });

export const closeNote = (id: string) => updateDoc(doc(db, 'brainInbox', id), { status: 'done', doneAt: serverTimestamp() });
