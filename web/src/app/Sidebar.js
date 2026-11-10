import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { useRequests } from '../requests/useRequests';
import { useBrainPulse } from '../brain/useBrainEvents';
import { sectionOfPath, useMySections } from '../team/sections';
import { NAV } from './navGroups';
import { NAV_ICON } from './navIcons';
import { useFilled } from './SubNav';
import './sidebar.css';
const KEY = 'braindy.sidebar';
const savedSlim = () => { try {
    return localStorage.getItem(KEY) === 'slim';
}
catch {
    return false;
} };
/** Below the main sections: learning, accesses, plan and settings, each only when this person may use it. */
export const FOOT = [
    { to: '/learn', label: 'cr.nav' }, { to: '/accesses', label: 'nav.accesses' },
    { to: '/plan', label: 'nav.plan' }, { to: '/settings', label: 'nav.settings' },
];
/**
 * Desktop navigation as a left sidebar (dashboard style). Client: the sections in NAV with their pages under the open one,
 * the count waiting for approval on Requests, and learning, accesses, plan and settings below. Admin: its own pages.
 * It folds to icons only, remembered per browser. Phones keep the bottom bar.
 */
export function Sidebar({ admin, items }) {
    const { t } = useI18n();
    const [slim, setSlimState] = useState(savedSlim);
    const setSlim = (v) => { setSlimState(v); try {
        localStorage.setItem(KEY, v ? 'slim' : 'wide');
    }
    catch { /* private mode */ } };
    return (_jsxs("aside", { className: `sbar${slim ? ' is-slim' : ''}`, "aria-label": t('nav.sections'), children: [_jsxs("div", { className: "sbar-logo", children: [_jsx("img", { src: slim ? '/brand/braindy-mark.svg' : '/brand/braindy-logo.svg', alt: "Braindy" }), admin && !slim && _jsx("span", { className: "sbar-tag", children: "admin" })] }), _jsx("nav", { className: "sbar-main", children: admin ? items.map((i) => _jsx(Link, { item: i, slim: slim }, i.to)) : _jsx(ClientSections, { slim: slim }) }), _jsxs("div", { className: "sbar-foot", children: [!admin && _jsx(ClientFoot, { slim: slim }), _jsxs("button", { type: "button", className: "sbar-link", onClick: () => setSlim(!slim), title: slim ? t('nav.expand') : undefined, "aria-label": t(slim ? 'nav.expand' : 'nav.collapse'), children: [_jsx("span", { className: "sbar-ico", children: NAV_ICON[slim ? 'expand' : 'collapse'] }), !slim && _jsx("span", { children: t('nav.collapse') })] })] })] }));
}
function Link({ item, slim, on, badge, sub, pulse }) {
    const { t } = useI18n();
    const label = t(item.label);
    return (_jsxs(NavLink, { to: item.to, end: sub, "data-tour": item.to === '/requests' ? 'ask-nav' : undefined, title: slim ? label : undefined, "aria-label": slim ? label : undefined, className: ({ isActive }) => `${sub ? 'sbar-sub' : 'sbar-link'}${on ?? isActive ? ' is-on' : ''}`, children: [!sub && _jsxs("span", { className: "sbar-ico", children: [NAV_ICON[item.to] ?? NAV_ICON['/home'], slim && badge ? _jsx("i", { className: "sbar-dot" }) : null, pulse ? _jsx("i", { className: "sbar-pulse", "aria-hidden": "true" }) : null] }), !slim && _jsx("span", { className: "grow truncate", children: label }), !slim && badge ? _jsx("span", { className: "sbar-badge", children: badge }) : null] }));
}
function ClientSections({ slim }) {
    const { can } = useMySections();
    const { pathname } = useLocation();
    const isAdmin = useAuth().profile?.role === 'admin';
    const filled = useFilled();
    const { current } = useBrands();
    const { list } = useRequests(can('requests') ? current?.id : undefined);
    const waiting = list.filter((r) => r.status === 'to_approve').length;
    // When the Brain learns something new (an approval, a file, Mi marca…), My brand pulses for a moment.
    const learned = useBrainPulse(can('brand') && current?.kind === 'brand' ? current.id : undefined);
    return _jsx(_Fragment, { children: NAV.map((g) => {
            const pages = g.pages.filter((p) => can(sectionOfPath(p.to)));
            if (!pages.length)
                return null;
            const on = g.pages.some((p) => pathname === p.to || pathname.startsWith(`${p.to}/`));
            // Every group shows its pages open, so the client sees them all at a glance (Nicolas, 2026-11-10); a page with nothing in it stays out for the client.
            const subs = !slim ? pages.filter((p) => isAdmin || pathname === p.to || filled(p.to)) : [];
            return (_jsxs("div", { className: "col", children: [_jsx(Link, { item: { to: pages[0].to, label: g.label }, slim: slim, on: on, badge: pages[0].to === '/requests' ? waiting : undefined, pulse: g.label === 'nav.brand' && learned }), subs.length > 1 && _jsx("div", { className: "sbar-subs", children: subs.map((p) => _jsx(Link, { item: p, slim: slim, sub: true }, p.to)) })] }, g.label));
        }) });
}
function ClientFoot({ slim }) {
    const { can } = useMySections();
    return _jsx(_Fragment, { children: FOOT.filter((i) => can(sectionOfPath(i.to))).map((i) => _jsx(Link, { item: i, slim: slim }, i.to)) });
}
