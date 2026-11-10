import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { BottomNav } from './BottomNav';
import { Toaster } from '../components/Toaster';
import { useAuth } from '../auth/AuthProvider';
import { ApiStatus } from '../components/ApiStatus';
import { BrandProvider } from '../brands/BrandProvider';
import { BrandMenu } from '../brands/BrandMenu';
import { CommandK } from '../components/CommandK';
import { Notifications } from '../components/Notifications';
import { AccountMenu } from './AccountSheet';
import { useI18n } from '../i18n/I18nProvider';
import { sectionOfPath, useMySections } from '../team/sections';
import { SubNav } from './SubNav';
import { HowItWorks } from '../learn/tutorials';
import { Sidebar } from './Sidebar';
import { useEffect, useRef } from 'react';
const ADMIN_TABS = [
    { to: '/admin/today', label: 'today.title' },
    { to: '/admin/studio', label: 'st.nav' },
    { to: '/admin/brands', label: 'nav.brands' },
    { to: '/admin/proposals', label: 'nav.proposals' },
    { to: '/admin/onboarding', label: 'nav.onboarding' },
    { to: '/admin/billing', label: 'nav.billing' },
    { to: '/admin/costs', label: 'cost.nav' },
    { to: '/admin/ai', label: 'aih.nav' },
    { to: '/team', label: 'nav.team' },
    { to: '/admin/whatsapp', label: 'waa.nav' },
    { to: '/admin/criterio', label: 'cra.nav' },
];
export function AppShell() {
    const { profile } = useAuth();
    const { t } = useI18n();
    const isAdmin = profile?.role === 'admin';
    const { pathname } = useLocation();
    const navigate = useNavigate();
    // The top bar stays fixed while scrolling; its height goes to --top-h so the page's own sticky bars sit just under it.
    const head = useRef(null);
    useEffect(() => {
        const el = head.current;
        if (!el)
            return;
        const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--top-h', `${el.offsetHeight}px`));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    // Admin is its own space (design 24): never mixed with the client tabs.
    const adminSpace = isAdmin && (pathname.startsWith('/admin') || pathname === '/team');
    return (_jsx(BrandProvider, { children: _jsx(Toaster, { children: _jsxs("div", { className: "flex min-h-full", children: [_jsx(Sidebar, { admin: adminSpace, items: ADMIN_TABS }), _jsxs("div", { className: "flex min-h-full min-w-0 flex-1 flex-col", children: [_jsxs("header", { ref: head, className: "topbar", style: { height: 'auto', minHeight: 56, flexWrap: 'nowrap', padding: '8px 12px', paddingTop: 'max(8px, env(safe-area-inset-top))', gap: 8, position: 'sticky', top: 0 }, children: [_jsx("span", { className: "hidden sm:inline-flex md:hidden", children: _jsx("img", { className: "logo", src: "/brand/braindy-logo.svg", alt: "Braindy" }) }), _jsx("div", { className: "vsep hidden sm:block md:hidden", style: { height: 32, margin: 0 } }), adminSpace ? (_jsxs(_Fragment, { children: [_jsxs(Link, { to: "/admin/today", className: "ws", "aria-label": "Braindy admin", style: { textDecoration: 'none' }, children: [_jsx("span", { className: "wsm", children: _jsx("img", { src: "/brand/braindy-mark.svg", alt: "" }) }), _jsx("span", { className: "hidden sm:inline", children: "Braindy admin" })] }), _jsx("span", { className: "hidden sm:inline-flex", children: _jsx(BrandMenu, { isAdmin: true, onPicked: () => navigate('/home') }) })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "min-w-0 shrink", children: _jsx(BrandMenu, { isAdmin: isAdmin }) }), isAdmin && _jsx("span", { className: "hidden sm:inline-flex", children: _jsx(Link, { to: "/admin/today", className: "btn btn-secondary btn-sm", children: t('nav.backToAdmin') }) })] })), _jsx("div", { className: "grow" }), isAdmin && import.meta.env.DEV && _jsx("span", { className: "hidden md:inline-flex", children: _jsx(ApiStatus, {}) }), _jsx(CommandK, {}), _jsx(Notifications, {}), _jsx(AccountMenu, {})] }), adminSpace && (_jsx("div", { className: "md:hidden", children: _jsx("nav", { className: "tabs overflow-x-auto", "aria-label": t('nav.sections'), style: { paddingLeft: 16, paddingRight: 16 }, children: ADMIN_TABS.map((tab) => _jsx(Tab, { to: tab.to, label: t(tab.label), admin: true }, tab.to)) }) })), _jsx("main", { className: `mx-auto w-full max-w-[1280px] flex-1 px-4 pt-8 sm:px-8 lg:px-10 ${adminSpace ? 'pb-16' : 'pb-28 md:pb-16'}`, children: _jsxs(SectionGate, { children: [!adminSpace && _jsxs(_Fragment, { children: [_jsx(SubNav, {}), _jsx(HowItWorks, {})] }), _jsx(Outlet, {})] }) }), !adminSpace && _jsx(BottomNav, {})] })] }) }) }));
}
/** A closed section sends the person back home (the rules and the API block its data anyway). */
function SectionGate({ children }) {
    const { pathname } = useLocation();
    const { ready, can } = useMySections();
    if (ready && !can(sectionOfPath(pathname)))
        return _jsx(Navigate, { to: "/home", replace: true });
    return _jsx(_Fragment, { children: children });
}
function Tab({ to, label, admin, on }) {
    return (_jsx(NavLink, { to: to, "data-tour": to === '/requests' ? 'ask-nav' : undefined, className: ({ isActive }) => `tab ${admin ? 'tab-admin' : ''} ${on ?? isActive ? 'is-active' : ''}`, children: label }));
}
