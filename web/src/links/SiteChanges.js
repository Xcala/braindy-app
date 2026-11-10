import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
export const STATUSES = ['delivered', 'in_progress', 'decision', 'client', 'discarded'];
export function useSiteChanges(brandId) {
    const [list, setList] = useState([]);
    useEffect(() => onSnapshot(query(collection(db, 'brands', brandId, 'siteChanges'), orderBy('order')), (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setList([])), [brandId]);
    return list;
}
/** Share delivered, leaving out what was discarded. */
export const pct = (items) => {
    const live = items.filter((x) => x.status !== 'discarded');
    return live.length ? Math.round((live.filter((x) => x.status === 'delivered').length / live.length) * 100) : 100;
};
const hostOf = (url) => { try {
    return url ? new URL(url).host.replace(/^www\./, '') : '';
}
catch {
    return '';
} };
/** The points of one site or app: those synced with its address; points without an address belong to the brand's first website. */
export function pointsFor(list, link, links) {
    const host = hostOf(link.url);
    const firstWeb = links.find((l) => l.section === 'apps' && l.kind === 'web');
    return list.filter((x) => (x.siteUrl ? hostOf(x.siteUrl) === host : firstWeb?.id === link.id));
}
