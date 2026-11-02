import { NavLink, useLocation } from 'react-router';
import { groupOfPath, NAV, SHOW_RESULTS } from './navGroups';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { sectionOfPath, useMySections } from '../team/sections';
import { NAV_ICON } from './navIcons';

const ALL_ITEMS: Array<{ to: string; label: StringKey; icon: React.ReactNode; fab?: boolean }> = [
  { to: '/home', label: 'nav.homeShort', icon: NAV_ICON['/home'] },
  { to: '/brand', label: 'nav.brandShort', icon: NAV_ICON['/brand'] },
  { to: '/requests', label: 'nav.askShort', fab: true, icon: NAV_ICON['/requests'] },
  { to: '/assets', label: 'nav.deliveriesShort', icon: NAV_ICON['/assets'] },
  { to: '/report', label: 'nav.reportShort', icon: NAV_ICON['/report'] },
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
