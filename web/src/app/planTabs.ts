import { useLocation } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import type { NavPage } from './navGroups';

/**
 * Mi plan's own tabs (summary, schedule, brand, site, payments) sit in the section's top row with Third-party apps and
 * Settings (2026-11-17; before, a second switch under the title). Each is /plan?tab=…; the schedule only when there is one.
 */
export function usePlanTabs(on: boolean) {
  const { search } = useLocation();
  const brand = useBrands().current;
  const id = on ? brand?.id : undefined;
  const live = useBrandDoc(id, 'context/schedule').data;
  const kickoff = useBrandDoc(id, 'context/kickoff').data as { items?: unknown[] } | null;
  const contractId = brand?.onboarding?.contractId;
  const contract = useBrandDoc(id && contractId ? id : undefined, `contracts/${contractId ?? '-'}`).data as { schedule?: unknown } | null;
  const schedule = !!(live || contract?.schedule || kickoff?.items?.length);
  const keys = ['schedule', 'brand', 'site', 'payments'].filter((k) => k !== 'schedule' || schedule);
  const asked = new URLSearchParams(search).get('tab') ?? '';
  const open = keys.includes(asked) ? asked : '';
  /** The plan's pages, to put where /plan is in the row. */
  const pages: NavPage[] = [{ to: '/plan', label: 'nav.plan' }, ...keys.map((k) => ({ to: `/plan?tab=${k}`, label: `plan.tab.${k}` } as NavPage))];
  const isOn = (to: string) => to === (open ? `/plan?tab=${open}` : '/plan');
  return { pages, isOn };
}

/** Settings' tabs (WhatsApp and notices, team and approvers, language) take its place in the same row (2026-11-17). */
const SETTINGS = ['notices', 'team', 'language'];
export const settingsPages: NavPage[] = SETTINGS.map((k) => ({ to: k === 'notices' ? '/settings' : `/settings?tab=${k}`, label: `set.tab.${k}` } as NavPage));
export const settingsOn = (to: string, search: string) => {
  const asked = new URLSearchParams(search).get('tab') ?? '';
  return to === (SETTINGS.includes(asked) && asked !== 'notices' ? `/settings?tab=${asked}` : '/settings');
};

/** The Account row in order of what matters to a client (2026-11-17): the plan and its schedule, what they pay, who can sign in
 *  and how they hear from us, then hosting, the AI studio, third-party apps and language. Pages not listed keep their place at the end. */
const ACCOUNT_ORDER = ['/plan', '/plan?tab=schedule', '/plan?tab=payments', '/settings?tab=team', '/settings', '/plan?tab=site', '/plan?tab=brand', '/accesses', '/settings?tab=language'];
export const byAccountOrder = (a: NavPage, b: NavPage) => {
  const i = (p: NavPage) => { const k = ACCOUNT_ORDER.indexOf(p.to); return k < 0 ? ACCOUNT_ORDER.length : k; };
  return i(a) - i(b);
};
