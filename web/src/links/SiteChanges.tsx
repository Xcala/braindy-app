import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BrandLink } from './useBrandLinks';

/** Site adjustments: the triage of each site or app, synced from its working session (asked, delivered, state). */
export type Status = 'delivered' | 'in_progress' | 'decision' | 'client' | 'discarded';
export interface SiteChange { id: string; key: string; group?: string; title: string; request?: string; source?: string; delivered?: string; status: Status; link?: string; spot?: string; round?: string; siteUrl?: string; updatedAt?: Timestamp; order?: number }

export const STATUSES: Status[] = ['delivered', 'in_progress', 'decision', 'client', 'discarded'];

export function useSiteChanges(brandId: string) {
  const [list, setList] = useState<SiteChange[]>([]);
  useEffect(() => onSnapshot(query(collection(db, 'brands', brandId, 'siteChanges'), orderBy('order')),
    (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }) as SiteChange)), () => setList([])), [brandId]);
  return list;
}

/** Share delivered, leaving out what was discarded. */
export const pct = (items: SiteChange[]) => {
  const live = items.filter((x) => x.status !== 'discarded');
  return live.length ? Math.round((live.filter((x) => x.status === 'delivered').length / live.length) * 100) : 100;
};

const hostOf = (url?: string) => { try { return url ? new URL(url).host.replace(/^www\./, '') : ''; } catch { return ''; } };

/** The points of one site or app: those synced with its address; points without an address belong to the brand's first website. */
export function pointsFor(list: SiteChange[], link: BrandLink, links: BrandLink[]) {
  const host = hostOf(link.url);
  const firstWeb = links.find((l) => l.section === 'apps' && l.kind === 'web');
  return list.filter((x) => (x.siteUrl ? hostOf(x.siteUrl) === host : firstWeb?.id === link.id));
}
