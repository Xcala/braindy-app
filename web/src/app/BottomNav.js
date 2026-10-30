import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
const svg = (d) => _jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: d });
const ITEMS = [
    { to: '/home', label: 'nav.homeShort', icon: svg(_jsxs(_Fragment, { children: [_jsx("path", { d: "M3 11 12 4l9 7" }), _jsx("path", { d: "M5 10v10h14V10" })] })) },
    { to: '/brand', label: 'nav.brandShort', icon: svg(_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("circle", { cx: "8.5", cy: "10", r: "1.3" }), _jsx("circle", { cx: "12", cy: "7.5", r: "1.3" }), _jsx("circle", { cx: "15.5", cy: "10", r: "1.3" }), _jsx("path", { d: "M12 21c-1.5 0-2-1-2-2s1-2 2-2" })] })) },
    { to: '/requests', label: 'nav.askShort', fab: true, icon: _jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", "aria-hidden": "true", children: _jsx("path", { d: "M12 5v14M5 12h14" }) }) },
    { to: '/requests', label: 'nav.requestsShort', icon: svg(_jsx("path", { d: "M5 7h14v12H5zM9 7V5h6v2M5 12h14" })) },
    { to: '/assets', label: 'nav.assetsShort', icon: svg(_jsx("path", { d: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" })) },
];
/** Mobile bottom navigation (design 25): Home · Brand · Ask (central) · Requests · Assets. */
export function BottomNav() {
    const { t } = useI18n();
    return (_jsx("div", { className: "fixed inset-x-0 bottom-0 z-30 md:hidden", children: _jsx("nav", { className: "bnav", "aria-label": t('nav.sections'), children: ITEMS.map((i) => (_jsxs(NavLink, { to: i.to, "data-tour": i.fab ? 'ask-nav-m' : undefined, className: ({ isActive }) => `${i.fab ? 'fab' : ''} ${isActive ? 'is-active' : ''}`, "aria-label": i.fab ? t('nav.ask') : undefined, children: [i.fab ? _jsx("span", { className: "f", children: i.icon }) : i.icon, t(i.label)] }, i.to))) }) }));
}
