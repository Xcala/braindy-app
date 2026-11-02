import type { StringKey } from '../i18n/strings';

/**
 * The client navigation in five tabs. Two tabs group pages that already exist:
 * My brand = identity + research, Deliveries = files + apps. Routes and section permissions stay the same.
 */
export type NavGroup = { label: StringKey; short: StringKey; pages: Array<{ to: string; label: StringKey }> };

export const NAV: NavGroup[] = [
  { label: 'nav.home', short: 'nav.homeShort', pages: [{ to: '/home', label: 'nav.home' }] },
  { label: 'nav.brand', short: 'nav.brandShort', pages: [{ to: '/brand', label: 'sub.identity' }, { to: '/research', label: 'sub.research' }] },
  { label: 'nav.orders', short: 'nav.askShort', pages: [{ to: '/requests', label: 'nav.orders' }] },
  { label: 'nav.deliveries', short: 'nav.deliveriesShort', pages: [{ to: '/assets', label: 'sub.files' }, { to: '/apps', label: 'sub.apps' }] },
  { label: 'nav.report', short: 'nav.reportShort', pages: [{ to: '/report', label: 'nav.report' }] },
];

export const groupOfPath = (path: string) => NAV.find((g) => g.pages.some((p) => path === p.to || path.startsWith(`${p.to}/`)));
