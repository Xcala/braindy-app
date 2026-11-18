import { useLocation } from 'react-router';
import type { NavPage } from './navGroups';

/**
 * The Account row (2026-11-17): five tabs, no second row anywhere. Mi plan (with its schedule folded inside), Payments,
 * Team and notices (/settings), Third-party apps (own tab since 2026-11-18), Hosting and On-Brand AI Studio.
 * Inside each tab what the person comes to do stays open and the rest folds (components/Fold). Language lives in Account.
 */
const PLAN = ['payments', 'apps', 'site', 'brand'];
export function usePlanTabs(_on: boolean) {
  const { search } = useLocation();
  const asked = new URLSearchParams(search).get('tab') ?? '';
  const open = PLAN.includes(asked) ? asked : '';
  const pages: NavPage[] = [{ to: '/plan', label: 'nav.plan' }, ...PLAN.map((k) => ({ to: `/plan?tab=${k}`, label: `plan.tab.${k}` } as NavPage))];
  const isOn = (to: string) => to === (open ? `/plan?tab=${open}` : '/plan');
  return { pages, isOn };
}

export const settingsPages: NavPage[] = [{ to: '/settings', label: 'set.tab.people' } as NavPage];
export const settingsOn = (to: string, _search: string) => to === '/settings';

/** In order of what matters to a client: the plan, what they pay, who signs in and how they hear from us, hosting, the studio. */
const ACCOUNT_ORDER = ['/plan', '/plan?tab=payments', '/settings', '/plan?tab=apps', '/plan?tab=site', '/plan?tab=brand'];
export const byAccountOrder = (a: NavPage, b: NavPage) => {
  const i = (p: NavPage) => { const k = ACCOUNT_ORDER.indexOf(p.to); return k < 0 ? ACCOUNT_ORDER.length : k; };
  return i(a) - i(b);
};
