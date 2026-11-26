import { useEffect, useState } from 'react';
import { collection, onSnapshot, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type AdKey = 'spend' | 'impressions' | 'reach' | 'clicks' | 'results' | 'convValue';
export type AdDay = { d: string } & Partial<Record<AdKey, number | null>>;
export type Campaign = { id: string; name: string; objective: string; status: string; resultLabel: string } & Partial<Record<AdKey, number | null>>;
export type AdStats = { platform: string; currency: string; daily: AdDay[]; campaigns: Partial<Record<string, Campaign[]>>; updatedAt: Date | null };
/** cost = net (after the portal credit); grossCost and credit when the portal shows them. */
export type Promo = { name: string; kind?: string; dates?: string; orders?: number | null; sales?: number | null; cost?: number | null; grossCost?: number | null; credit?: number | null };
export type SalesMonth = { month: string; period?: string; note?: string; readAt?: string; insights?: string[]; costNotes?: string[]; promos?: Promo[] }
  & Partial<Record<'sales' | 'orders' | 'customers' | 'newCustomers' | 'adSales' | 'adOrders' | 'adSpend' | 'credits', number | null>>;
export type SalesStats = { source: string; currency: string; note: string; months: SalesMonth[]; updatedAt: Date | null };

const at = (x: { updatedAt?: Timestamp }) => x.updatedAt?.toDate() ?? null;
const ran = (d: AdDay) => (d.spend ?? 0) > 0 || (d.impressions ?? 0) > 0;

/** The brand's ad platforms (Metricool) and sales portals (DoorDash…), mirrored by the server. Rules only let them through where Results is on. */
export function useAdStats(brandId: string | undefined, enabled: boolean) {
  const [ads, setAds] = useState<AdStats[]>([]);
  const [sales, setSales] = useState<SalesStats[]>([]);
  useEffect(() => {
    if (!brandId || !enabled) { setAds([]); setSales([]); return; }
    const a = onSnapshot(collection(db, 'brands', brandId, 'adStats'), (s) => setAds(s.docs.map((d) => {
      const x = d.data();
      return { platform: d.id, currency: x.currency || 'USD', daily: (x.daily ?? []) as AdDay[], campaigns: x.campaigns ?? {}, updatedAt: at(x) };
    }).filter((x) => x.daily.some(ran))), () => setAds([]));
    const b = onSnapshot(collection(db, 'brands', brandId, 'salesStats'), (s) => setSales(s.docs.map((d) => {
      const x = d.data();
      return { source: d.id, currency: x.currency || 'USD', note: x.note ?? '', months: (x.months ?? []) as SalesMonth[], updatedAt: at(x) };
    }).filter((x) => x.months.length)), () => setSales([]));
    return () => { a(); b(); };
  }, [brandId, enabled]);
  return { ads, sales };
}

/** How a sales portal is written (doordash → DoorDash). */
export const sourceName = (s: string) => ({ doordash: 'DoorDash', ubereats: 'Uber Eats', rappi: 'Rappi' } as Record<string, string>)[s] ?? s.charAt(0).toUpperCase() + s.slice(1);
