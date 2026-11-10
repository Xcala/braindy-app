import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { sectionOfPath, useMySections } from '../team/sections';
import { NAV } from './navGroups';
import { NAV_ICON } from './navIcons';
import { FOOT } from './Sidebar';
import { useFilled } from './SubNav';
/** Phones: the «More» tab opens every page this person may use (each tab's pages, then learning, accesses, plan, settings). */
export function MoreButton() {
    const { t } = useI18n();
    const { pathname } = useLocation();
    const [open, setOpen] = useState(false);
    const btn = useRef(null);
    const closeBtn = useRef(null);
    useEffect(() => { setOpen(false); }, [pathname]);
    useEffect(() => {
        if (!open)
            return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeBtn.current?.focus();
        const key = (e) => { if (e.key === 'Escape')
            close(); };
        window.addEventListener('keydown', key);
        return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', key); };
    }, [open]);
    function close() { setOpen(false); btn.current?.focus(); }
    const x = _jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", "aria-hidden": "true", children: _jsx("path", { d: "M6 6l12 12M18 6 6 18" }) });
    return (_jsxs(_Fragment, { children: [_jsxs("button", { ref: btn, type: "button", className: open ? 'is-active' : '', onClick: () => setOpen(true), "aria-expanded": open, "aria-haspopup": "dialog", children: [NAV_ICON.more, t('nav.more')] }), open && createPortal(_jsxs("div", { className: "acct-sheet", role: "dialog", "aria-modal": "true", "aria-label": t('nav.moreTitle'), children: [_jsxs("div", { className: "acct-sheet-bar", children: [_jsx("img", { className: "logo", src: "/brand/braindy-logo.svg", alt: "Braindy" }), _jsx("button", { ref: closeBtn, type: "button", className: "acct-x", onClick: close, "aria-label": t('lb.close'), children: x })] }), _jsxs("div", { className: "acct-sheet-body col g20", children: [_jsx("h2", { className: "h2", style: { margin: 0 }, children: t('nav.moreTitle') }), _jsx(MoreList, {})] })] }), document.body)] }));
}
function MoreList() {
    const { t } = useI18n();
    const { can } = useMySections();
    const filled = useFilled();
    const isAdmin = useAuth().profile?.role === 'admin';
    // Same rule as the sidebar: a page with nothing in it stays out for the client.
    const groups = NAV.map((g) => ({ g, pages: g.pages.filter((p) => can(sectionOfPath(p.to)) && (isAdmin || g.pages.length === 1 || filled(p.to))) }))
        .filter((x) => x.pages.length);
    const foot = FOOT.filter((i) => can(sectionOfPath(i.to)));
    const link = (to, label) => (_jsxs(NavLink, { to: to, end: true, className: ({ isActive }) => `more-link${isActive ? ' is-on' : ''}`, children: [_jsx("span", { className: "more-ico", children: NAV_ICON[to] ?? NAV_ICON['/home'] }), _jsx("span", { className: "grow", children: label })] }, to));
    return (_jsxs(_Fragment, { children: [groups.map(({ g, pages }) => (_jsxs("section", { className: "col g8", children: [pages.length > 1 && _jsx("p", { className: "label", style: { margin: 0 }, children: t(g.label) }), _jsx("div", { className: "more-card", children: pages.map((p) => link(p.to, t(pages.length > 1 ? p.label : g.label))) })] }, g.label))), foot.length > 0 && _jsx("div", { className: "more-card", children: foot.map((i) => link(i.to, t(i.label))) })] }));
}
