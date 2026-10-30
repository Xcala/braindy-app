import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { BottomNav } from './BottomNav';
import { Toaster } from '../components/Toaster';
import { requestTour } from '../tour/useTour';
import { useAuth } from '../auth/AuthProvider';
import { ApiStatus } from '../components/ApiStatus';
import { BrandProvider } from '../brands/BrandProvider';
import { BrandMenu } from '../brands/BrandMenu';
import { LangToggle } from '../i18n/LangToggle';
import { CommandK } from '../components/CommandK';
import { useI18n } from '../i18n/I18nProvider';
const TABS = [
    { to: '/home', label: 'nav.home' },
    { to: '/brand', label: 'nav.brand' },
    { to: '/requests', label: 'nav.requests' },
    { to: '/assets', label: 'nav.assets' },
    { to: '/apps', label: 'nav.apps' },
    { to: '/research', label: 'nav.research' },
    { to: '/report', label: 'nav.report' },
    { to: '/learn', label: 'cr.nav' },
    { to: '/accesses', label: 'nav.accesses' },
];
const ADMIN_TABS = [
    { to: '/admin/today', label: 'today.title' },
    { to: '/admin/studio', label: 'st.nav' },
    { to: '/admin/brands', label: 'nav.brands' },
    { to: '/admin/proposals', label: 'nav.proposals' },
    { to: '/admin/onboarding', label: 'nav.onboarding' },
    { to: '/admin/billing', label: 'nav.billing' },
    { to: '/team', label: 'nav.team' },
    { to: '/admin/criterio', label: 'cra.nav' },
];
export function AppShell() {
    const { profile } = useAuth();
    const { t } = useI18n();
    const isAdmin = profile?.role === 'admin';
    const { pathname } = useLocation();
    const navigate = useNavigate();
    // Admin is its own space (design 24): never mixed with the client tabs.
    const adminSpace = isAdmin && (pathname.startsWith('/admin') || pathname === '/team');
    return (_jsx(BrandProvider, { children: _jsx(Toaster, { children: _jsxs("div", { className: "flex min-h-full flex-col", children: [_jsxs("header", { className: "topbar", style: { height: 'auto', minHeight: 56, flexWrap: 'nowrap', padding: '8px 12px', gap: 8 }, children: [_jsx("span", { className: "hidden sm:inline-flex", children: _jsx("img", { className: "logo", src: "/brand/braindy-logo.svg", alt: "Braindy" }) }), _jsx("div", { className: "vsep hidden sm:block", style: { height: 32, margin: 0 } }), adminSpace ? (_jsxs(_Fragment, { children: [_jsxs(Link, { to: "/admin/today", className: "ws", style: { textDecoration: 'none' }, children: [_jsx("span", { className: "wsm", children: _jsx("img", { src: "/brand/braindy-mark.svg", alt: "" }) }), "Braindy admin"] }), _jsx("span", { className: "hidden sm:inline-flex", children: _jsx(BrandMenu, { isAdmin: true, onPicked: () => navigate('/home') }) })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "min-w-0 shrink", children: _jsx(BrandMenu, { isAdmin: isAdmin }) }), isAdmin && _jsx("span", { className: "hidden sm:inline-flex", children: _jsx(Link, { to: "/admin/today", className: "btn btn-secondary btn-sm", children: t('nav.backToAdmin') }) })] })), _jsx("div", { className: "grow" }), isAdmin && import.meta.env.DEV && _jsx("span", { className: "hidden md:inline-flex", children: _jsx(ApiStatus, {}) }), _jsx(CommandK, {}), _jsx(LangToggle, {}), _jsx(AccountMenu, {})] }), _jsx("div", { className: adminSpace ? '' : 'hidden md:block', children: _jsx("nav", { className: "tabs overflow-x-auto", "aria-label": t('nav.sections'), style: { paddingLeft: 16, paddingRight: 16 }, children: (adminSpace ? ADMIN_TABS : TABS).map((tab) => _jsx(Tab, { to: tab.to, label: t(tab.label), admin: adminSpace }, tab.to)) }) }), _jsx("main", { className: `mx-auto w-full max-w-[1280px] flex-1 px-4 pt-8 sm:px-8 lg:px-10 ${adminSpace ? 'pb-16' : 'pb-28 md:pb-16'}`, children: _jsx(Outlet, {}) }), !adminSpace && _jsx(BottomNav, {})] }) }) }));
}
function Tab({ to, label, admin }) {
    return (_jsx(NavLink, { to: to, "data-tour": to === '/requests' ? 'ask-nav' : undefined, className: ({ isActive }) => `tab ${admin ? 'tab-admin' : ''} ${isActive ? 'is-active' : ''}`, children: label }));
}
function AccountMenu() {
    const { profile, user, logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useI18n();
    const [open, setOpen] = useState(false);
    const box = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        const onDown = (e) => { if (!box.current?.contains(e.target))
            setOpen(false); };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [open]);
    const name = profile?.name ?? user?.email ?? '';
    const initials = name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
    return (_jsxs("div", { ref: box, className: "relative", children: [_jsxs("button", { type: "button", onClick: () => setOpen((o) => !o), "aria-haspopup": "menu", "aria-expanded": open, "aria-label": t('nav.account'), className: "row g12", style: { appearance: 'none', border: 0, background: 'none', cursor: 'pointer', padding: 2, borderRadius: 999 }, children: [user?.photoURL ? _jsx("img", { className: "avatar", src: user.photoURL, alt: "" }) : _jsx("span", { className: "avatar-txt", children: initials }), _jsxs("span", { className: "hidden flex-col items-start md:flex", style: { lineHeight: '16px' }, children: [_jsx("span", { className: "w7", style: { fontSize: 14, color: 'var(--ink)' }, children: profile?.name?.split(' ')[0] ?? name }), _jsx("span", { className: "t-xs t-mute", children: profile?.role === 'admin' ? t('role.admin') : t('role.client') })] })] }), open && (_jsxs("div", { className: "menu absolute right-0 top-[52px] z-40 w-60", role: "menu", children: [_jsx("p", { className: "t-sm t-mute truncate", style: { padding: '8px 12px' }, children: user?.email }), _jsx("div", { className: "md:hidden", children: [['/apps', 'nav.apps'], ['/research', 'nav.research'], ['/report', 'nav.report'], ['/learn', 'cr.nav'], ['/accesses', 'nav.accesses']].map(([to, k]) => (_jsx(NavLink, { role: "menuitem", to: to, onClick: () => setOpen(false), className: "menu-item", style: { textDecoration: 'none', color: 'var(--ink)' }, children: t(k) }, to))) }), profile?.role === 'admin' && _jsx("div", { className: "sm:hidden", children: _jsx(NavLink, { role: "menuitem", to: "/admin/today", onClick: () => setOpen(false), className: "menu-item", style: { textDecoration: "none", color: "var(--ink)" }, children: t("nav.backToAdmin") }) }), _jsx("button", { role: "menuitem", className: "menu-item w-full text-left", style: { border: 0, background: 'none', cursor: 'pointer' }, onClick: () => { setOpen(false); if (!requestTour())
                            navigate('/home?tour=1'); }, children: t('tour.see') }), _jsx(NavLink, { role: "menuitem", to: "/settings", onClick: () => setOpen(false), className: "menu-item", style: { textDecoration: "none", color: "var(--ink)" }, children: t("nav.settings") }), _jsx("button", { role: "menuitem", onClick: logout, className: "menu-item w-full text-left", style: { border: 0, background: 'none', cursor: 'pointer' }, children: t('common.signOut') })] }))] }));
}
