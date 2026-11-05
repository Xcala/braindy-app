import type { StringKey } from '../i18n/strings';

/**
 * The client navigation in five tabs. Two tabs group pages that already exist:
 * My brand = essence, visual, documents + research, Deliveries = files + apps + calendar. Routes and section permissions stay the same.
 */
export type NavGroup = { label: StringKey; short: StringKey; pages: Array<{ to: string; label: StringKey }> };

/** Results is off until there is enough to show (2026-11-02). The /report page still works by its address; set true to bring the tab back. */
export const SHOW_RESULTS = false;

const ALL: NavGroup[] = [
  { label: 'nav.home', short: 'nav.homeShort', pages: [{ to: '/home', label: 'nav.home' }] },
  { label: 'nav.brand', short: 'nav.brandShort', // Visual first (2026-11-02). Brain: what the Brains know about the brand, live (2026-11-04). Brand documents left My brand: the files already live in Deliveries.
    pages: [{ to: '/brand/visual', label: 'sub.visual' }, { to: '/brand', label: 'sub.essence' }, { to: '/brand/brain', label: 'sub.brain' }, { to: '/research', label: 'sub.research' }] },
  { label: 'nav.orders', short: 'nav.askShort', pages: [{ to: '/requests', label: 'nav.orders' }] },
  { label: 'nav.deliveries', short: 'nav.deliveriesShort', pages: [{ to: '/assets', label: 'sub.files' }, { to: '/apps', label: 'sub.apps' }, { to: '/calendar', label: 'sub.calendar' }] },
  { label: 'nav.report', short: 'nav.reportShort', pages: [{ to: '/report', label: 'nav.report' }] },
];
export const NAV = ALL.filter((g) => SHOW_RESULTS || g.label !== 'nav.report');

export const groupOfPath = (path: string) => NAV.find((g) => g.pages.some((p) => path === p.to || path.startsWith(`${p.to}/`)));
