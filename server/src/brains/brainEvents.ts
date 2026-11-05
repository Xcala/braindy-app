// The Brand Brain feed: one small event each time something teaches the Brains about the brand (a request, an approval,
// a change asked, Mi marca updated, a file, a work session, a meeting). brands/{id}/brainEvents, read live by the
// "Cerebro" page, which animates each new one. Text here is client-safe: never internal notes, meeting notes or credentials.
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';

export type BrainKind = 'request' | 'approved' | 'changed' | 'identity' | 'file' | 'session' | 'meeting' | 'signed';
export type BrainArea = 'identity' | 'voice' | 'strategy' | 'rules' | 'work' | 'talks';

export type BrainEventInput = {
  kind: BrainKind;
  area: BrainArea;
  /** Short, client-safe text (a request title, what was liked or asked to change, file names). */
  text?: string;
  /** Parts of Mi marca that changed (logos, colors, typography, concept, mockups, voice, strategy, primal). */
  parts?: string[];
  count?: number;
  requestId?: string;
  /** Deterministic id for events that may be recorded twice (re-filed meetings, backfill). */
  id?: string;
  at?: Date;
};

/** Records one event. Never throws: teaching the Brain must never block the action that taught it. */
export async function recordBrainEvent(brandId: string, e: BrainEventInput) {
  try {
    const col = db.collection(`brands/${brandId}/brainEvents`);
    const ref = e.id ? col.doc(e.id) : col.doc();
    await ref.set({
      kind: e.kind, area: e.area,
      ...(e.text ? { text: e.text.replace(/\s+/g, ' ').trim().slice(0, 300) } : {}),
      ...(e.parts?.length ? { parts: e.parts.slice(0, 10) } : {}),
      ...(e.count ? { count: e.count } : {}),
      ...(e.requestId ? { requestId: e.requestId } : {}),
      at: e.at ?? FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch { /* best effort */ }
}

/** Which area of the brand a Mi marca update teaches, from the parts that changed. */
export function identityEvents(parts: string[]): Array<{ area: BrainArea; parts: string[] }> {
  const groups: Record<BrainArea, string[]> = { identity: [], voice: [], strategy: [], rules: [], work: [], talks: [] };
  for (const p of parts) {
    if (p === 'voice') groups.voice.push(p);
    else if (p === 'strategy' || p === 'primal') groups.strategy.push(p);
    else if (p === 'avoid') groups.rules.push(p);
    else if (p === 'mockups') groups.work.push(p);
    else groups.identity.push(p);
  }
  return (Object.entries(groups) as Array<[BrainArea, string[]]>).filter(([, ps]) => ps.length).map(([area, ps]) => ({ area, parts: ps }));
}
