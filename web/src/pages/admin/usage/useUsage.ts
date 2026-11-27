import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, documentId, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

/** pageViews/{day}: views keyed "role|device|section|path", brands keyed "brandId|role" (written by the API). */
type Day = { id: string; views?: Record<string, number>; brands?: Record<string, number> };
export type View = 'client' | 'admin' | 'all';
export type Row = { key: string; total: number; phone: number; desk: number; c: number; a: number; cp: number; cd: number; ap: number; ad: number };

/** The most we read; the 7-day view is cut from it. */
export const MAX_DAYS = 30;
/** Below this many days with data the page warns not to decide yet (decided 2026-11-27). */
export const MIN_DAYS = 14;
/** Sections a client can open (Home + the switchable ones + the free extras): the ones that can show «nobody opened it». */
export const CLIENT_SECTIONS = ['home', 'brand', 'requests', 'files', 'apps', 'research', 'results', 'learn', 'accesses', 'billing', 'resources', 'wishlist'];
/** What sits in the client's bottom bar on a phone (BottomNav: Home · Brand · Ask/Requests · Results); the rest is under «More». */
export const IN_BAR = new Set(['home', 'brand', 'requests', 'results']);

const empty = (key: string): Row => ({ key, total: 0, phone: 0, desk: 0, c: 0, a: 0, cp: 0, cd: 0, ap: 0, ad: 0 });
const localDay = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const fromDay = (days: number) => localDay(Date.now() - (days - 1) * 864e5);

function add(map: Map<string, Row>, key: string, role: string, device: string, n: number) {
  const r = map.get(key) ?? empty(key);
  const admin = role === 'admin'; const phone = device === 'phone';
  r.total += n; r[phone ? 'phone' : 'desk'] += n; r[admin ? 'a' : 'c'] += n;
  r[`${admin ? 'a' : 'c'}${phone ? 'p' : 'd'}` as 'cp' | 'cd' | 'ap' | 'ad'] += n;
  map.set(key, r);
}
const sorted = (m: Map<string, Row>) => [...m.values()].sort((a, b) => b.total - a.total);

/** Reads the last 30 days once; the view (clients · me · everyone) and the period (7 · 30) are cut in the browser. */
export function useUsage(view: View, period: number) {
  const [days, setDays] = useState<Day[] | null>(null);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);
  const retry = useCallback(() => { setError(false); setDays(null); setTick((n) => n + 1); }, []);
  useEffect(() => {
    let live = true;
    getDocs(query(collection(db, 'pageViews'), where(documentId(), '>=', fromDay(MAX_DAYS))))
      .then((s) => live && setDays(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Day, 'id'>) }))))
      .catch(() => live && setError(true));
    return () => { live = false; };
  }, [tick]);

  const data = useMemo(() => {
    if (!days) return null;
    const from = fromDay(period);
    const keep = (role: string) => view === 'all' || (view === 'admin') === (role === 'admin');
    const sections = new Map<string, Row>(); const pages = new Map<string, Row>(); const clientSections = new Map<string, Row>();
    const brands = new Map<string, Row>();
    for (const d of days.filter((x) => x.id >= from)) {
      for (const [k, n] of Object.entries(d.views ?? {})) {
        const [role, device, section, ...rest] = k.split('|');
        if (role !== 'admin') add(clientSections, section, role, device, n);
        if (!keep(role)) continue;
        add(sections, section, role, device, n);
        add(pages, rest.join('|'), role, device, n);
      }
      for (const [k, n] of Object.entries(d.brands ?? {})) {
        const [brandId, role] = k.split('|');
        if (keep(role)) add(brands, brandId, role, 'desktop', n);
      }
    }
    const bySection = sorted(sections);
    const total = bySection.reduce((a, r) => ({ ...a, total: a.total + r.total, phone: a.phone + r.phone }), empty('total'));
    const clientRows = sorted(clientSections);
    return {
      days: days.length, total, bySection,
      byPage: sorted(pages).slice(0, 40),
      byBrand: sorted(brands),
      topPhone: clientRows.filter((r) => r.cp > 0).sort((a, b) => b.cp - a.cp).slice(0, 5),
      nobody: CLIENT_SECTIONS.filter((s) => !clientSections.get(s)?.total),
    };
  }, [days, view, period]);
  return { data, error, retry };
}
