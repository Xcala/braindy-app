// The WhatsApp messages waiting for NickMark (waInbox, status 'new'), grouped by number.
// One live query; the bottom bar badge and the inbox use the same one (Firestore shares the listener).
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type WaItem = {
  id: string; phone: string; name?: string; text?: string; media?: unknown[];
  at?: { toDate: () => Date }; kind?: 'chat'; uid?: string; brandId?: string;
};
export type WaGroup = { phone: string; name: string; items: WaItem[]; last: WaItem; brandId?: string; uid?: string; chat: boolean };

const time = (i: WaItem) => i.at?.toDate().getTime() ?? 0;

/** Live waiting messages. `error` is true when they could not be read (never shown as «nothing waiting»). */
export function useWaInbox(on = true) {
  const [items, setItems] = useState<WaItem[] | null>(null);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!on) return;
    setError(false);
    return onSnapshot(query(collection(db, 'waInbox'), where('status', '==', 'new')),
      (s) => { setItems(s.docs.map((d) => ({ id: d.id, ...d.data() }) as WaItem).sort((a, b) => time(b) - time(a))); setError(false); },
      () => setError(true));
  }, [on, tick]);
  return { items, error, retry: () => setTick((n) => n + 1) };
}

/** One group per number, newest first; a client's chat keeps the brand and person it already knows. */
export function groupByPhone(items: WaItem[]): WaGroup[] {
  const map = new Map<string, WaItem[]>();
  for (const i of items) map.set(i.phone, [...(map.get(i.phone) ?? []), i]);
  return [...map.entries()].map(([phone, list]) => {
    const known = list.find((i) => i.brandId);
    return {
      phone, items: list, last: list[0]!, name: list.find((i) => i.name)?.name ?? '',
      brandId: known?.brandId, uid: known?.uid, chat: list.some((i) => i.kind === 'chat'),
    };
  }).sort((a, b) => time(b.last) - time(a.last));
}

/** How many numbers are waiting: the WhatsApp badge in the admin's bottom bar. */
export function useWaWaitingCount(on = true): number {
  const { items } = useWaInbox(on);
  return items ? new Set(items.map((i) => i.phone)).size : 0;
}
