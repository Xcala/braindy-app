import { useLocation } from 'react-router';
import type { NavPage } from './navGroups';
import type { StringKey } from '../i18n/strings';

/**
 * The Account row: five tabs, short names on phones so all five fit at 375 px. Mi plan (with its schedule folded inside),
 * Payments, Team and notices (/settings), Third-party apps and «Mejorar mi plan» (2026-11-26: Hosting and the On-Brand AI
 * Studio joined in one tab: what the brand has first, the catalog below). Old ?tab=brand links land on it.
 * Inside each tab what the person comes to do stays open and the rest folds (components/Fold). Language lives in Account.
 */
const PLAN = ['payments', 'apps', 'site'];
const SHORT: Record<string, StringKey> = { payments: 'plan.tab.payments', apps: 'ct.short.apps', site: 'ct.short.up' };
export function usePlanTabs(_on: boolean) {
  const { search } = useLocation();
  const asked = new URLSearchParams(search).get('tab') ?? '';
  const open = asked === 'brand' ? 'site' : PLAN.includes(asked) ? asked : '';
  const pages: NavPage[] = [{ to: '/plan', label: 'nav.plan', short: 'ct.short.plan' }, ...PLAN.map((k) => ({ to: `/plan?tab=${k}`, label: `plan.tab.${k}`, short: SHORT[k] } as NavPage))];
  const isOn = (to: string) => to === (open ? `/plan?tab=${open}` : '/plan');
  return { pages, isOn };
}

export const settingsPages: NavPage[] = [{ to: '/settings', label: 'set.tab.people', short: 'ct.short.team' } as NavPage];
export const settingsOn = (to: string, _search: string) => to === '/settings';

/** In order of what matters to a client: the plan, what they pay, who signs in and how they hear from us, their apps, upgrades. */
const ACCOUNT_ORDER = ['/plan', '/plan?tab=payments', '/settings', '/plan?tab=apps', '/plan?tab=site'];
export const byAccountOrder = (a: NavPage, b: NavPage) => {
  const i = (p: NavPage) => { const k = ACCOUNT_ORDER.indexOf(p.to); return k < 0 ? ACCOUNT_ORDER.length : k; };
  return i(a) - i(b);
};
