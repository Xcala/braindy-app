import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { NavLink, useLocation } from 'react-router';
import { groupOfPath, NAV } from './navGroups';
import { useI18n } from '../i18n/I18nProvider';
import { sectionOfPath, useMySections } from '../team/sections';
import { NAV_ICON } from './navIcons';
import { MoreButton } from './MoreSheet';
const ITEMS = [
    { to: '/home', label: 'nav.homeShort', icon: NAV_ICON['/home'] },
    { to: '/brand/visual', label: 'nav.brandShort', icon: NAV_ICON['/brand'] },
    { to: '/requests', label: 'nav.askShort', fab: true, icon: NAV_ICON['/requests'] },
    { to: '/assets', label: 'nav.deliveriesShort', icon: NAV_ICON['/assets'] },
    { to: '/report', label: 'nav.reportShort', icon: NAV_ICON['/report'] },
];
/** Mobile bottom navigation: the same five tabs as on desktop (Home · Brand · Ask, also the requests list · Deliveries · Results) and More, which lists every page. */
export function BottomNav() {
    const { t } = useI18n();
    const { can } = useMySections();
    const { pathname } = useLocation();
    // A tab stays lit on every page of its group (Research under Brand, Apps under Deliveries) and opens its first allowed page.
    const here = groupOfPath(pathname);
    const target = (to) => NAV.find((g) => g.pages[0].to === to).pages.find((p) => can(sectionOfPath(p.to)))?.to;
    return (_jsx("div", { className: "fixed inset-x-0 bottom-0 z-30 md:hidden", children: _jsxs("nav", { className: "bnav", "aria-label": t('nav.sections'), children: [ITEMS.filter((i) => target(i.to)).map((i) => (_jsxs(NavLink, { to: target(i.to), "data-tour": i.fab ? 'ask-nav-m' : undefined, className: `${i.fab ? 'fab' : ''} ${here?.pages[0].to === i.to ? 'is-active' : ''}`, "aria-label": i.fab ? t('nav.ask') : undefined, children: [i.icon, t(i.label)] }, i.to))), _jsx(MoreButton, {})] }) }));
}
