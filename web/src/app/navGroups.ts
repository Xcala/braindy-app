import type { StringKey } from '../i18n/strings';

/**
 * The client navigation: four sections, each one row in the menu; their pages show as tabs at the top of the page
 * (2026-11-12, after research on brand portals: «Kit de marca», «Entregas», «Biblioteca» read better than «Visual» or «Archivos»).
 * My brand also holds what used to be Deliveries. Essence, Brain and Research sit in the same row (2026-11-16; before, under a «Strategy» tab).
 * Routes and section permissions stay the same, so old links keep working.
 */
/** `short`: a shorter tab label for phones (audit #38), so the row fits instead of cutting the last tab. */
export type NavPage = { to: string; label: StringKey; tab?: StringKey; short?: StringKey };
export type NavGroup = { label: StringKey; short: StringKey; pages: NavPage[] };

export const NAV: NavGroup[] = [
  { label: 'nav.home', short: 'nav.homeShort', pages: [{ to: '/home', label: 'nav.home' }] },
  { label: 'nav.orders', short: 'nav.askShort', pages: [{ to: '/requests', label: 'nav.orders' }] },
  { label: 'nav.brand', short: 'nav.brandShort', pages: [
    { to: '/brand/visual', label: 'sub.kit' },
    { to: '/deliveries', label: 'sub.deliveries' },
    { to: '/calendar', label: 'sub.socialCal' },
    { to: '/pauta', label: 'sub.pauta' },
    { to: '/assets', label: 'sub.library' },
    { to: '/apps', label: 'sub.sites' },
    { to: '/brand', label: 'sub.essence' },
    { to: '/brand/brain', label: 'sub.brain' },
    { to: '/research', label: 'sub.research', short: 'sub.researchShort' },
  ] },
  // Results shows only on brands with resultsOn. The social calendar moved to My brand, third tab (2026-11-17).
  { label: 'nav.report', short: 'nav.reportShort', pages: [{ to: '/report', label: 'sub.stats' }] },
];

/** Below them (2026-11-12): three rows instead of five. Learn · Wishlist · Account, each one's pages as tabs too. */
export const FOOT_NAV: NavGroup[] = [
  { label: 'nav.learnGroup', short: 'nav.learnGroup', pages: [{ to: '/learn', label: 'sub.lessons' }, { to: '/resources', label: 'res.nav' }] },
  { label: 'nav.wishlist', short: 'nav.wishlist', pages: [{ to: '/wishlist', label: 'nav.wishlist' }] },
  { label: 'nav.account', short: 'nav.account', pages: [{ to: '/plan', label: 'nav.plan' }, { to: '/settings', label: 'nav.settings' }] },
];

export const pageMatch = (path: string, to: string) => path === to || (to !== '/brand' && path.startsWith(`${to}/`)) || (to === '/brand' && /^\/brand\/(?!visual|brain|docs)[^/]+$/.test(path));
export const groupOfPath = (path: string) => [...NAV, ...FOOT_NAV].find((g) => g.pages.some((p) => pageMatch(path, p.to) || path.startsWith(`${p.to}/`)));
