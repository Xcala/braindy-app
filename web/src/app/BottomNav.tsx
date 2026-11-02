import { NavLink, useLocation } from 'react-router';
import { groupOfPath, NAV, SHOW_RESULTS } from './navGroups';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { sectionOfPath, useMySections } from '../team/sections';

const svg = (d: React.ReactNode) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
const ALL_ITEMS: Array<{ to: string; label: StringKey; icon: React.ReactNode; fab?: boolean }> = [
  { to: '/home', label: 'nav.homeShort', icon: svg(<><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /></>) },
  { to: '/brand', label: 'nav.brandShort', icon: svg(<><circle cx="12" cy="12" r="9" /><circle cx="8.5" cy="10" r="1.3" /><circle cx="12" cy="7.5" r="1.3" /><circle cx="15.5" cy="10" r="1.3" /><path d="M12 21c-1.5 0-2-1-2-2s1-2 2-2" /></>) },
  { to: '/requests', label: 'nav.askShort', fab: true, icon: svg(<><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>) },
  { to: '/assets', label: 'nav.deliveriesShort', icon: svg(<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />) },
  { to: '/report', label: 'nav.reportShort', icon: svg(<path d="M4 20V10M10 20V4M16 20v-7M20 20H3" />) },
];
const ITEMS = ALL_ITEMS.filter((i) => SHOW_RESULTS || i.to !== '/report');

/** Mobile bottom navigation: the same five tabs as on desktop (Home · Brand · Ask, also the requests list · Deliveries · Results). */
export function BottomNav() {
  const { t } = useI18n();
  const { can } = useMySections();
  const { pathname } = useLocation();
  // A tab stays lit on every page of its group (Research under Brand, Apps under Deliveries) and opens its first allowed page.
  const here = groupOfPath(pathname);
  const target = (to: string) => NAV.find((g) => g.pages[0]!.to === to)!.pages.find((p) => can(sectionOfPath(p.to)))?.to;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 md:hidden"><nav className="bnav" aria-label={t('nav.sections')}>
      {ITEMS.filter((i) => target(i.to)).map((i) => (
        <NavLink key={i.to} to={target(i.to)!} data-tour={i.fab ? 'ask-nav-m' : undefined} className={`${i.fab ? 'fab' : ''} ${here?.pages[0]!.to === i.to ? 'is-active' : ''}`} aria-label={i.fab ? t('nav.ask') : undefined}>
          {i.icon}
          {t(i.label)}
        </NavLink>
      ))}
    </nav></div>
  );
}
