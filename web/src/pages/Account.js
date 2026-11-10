import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { LangToggle } from '../i18n/LangToggle';
import { ThemeToggle } from '../theme/ThemeToggle';
import { useBilling } from '../billing/useBilling';
import { useAccesses } from '../accesses/useAccesses';
import { requestTour } from '../tour/useTour';
import { useEffect, useState } from 'react';
import { noticesApi } from '../review/api';
import { sectionOfPath, useMySections } from '../team/sections';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { promptInstall, usePwa } from '../pwa/pwa';
import { IosSteps } from '../pwa/PwaBar';
const svg = (d) => _jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: d });
const I = {
    plan: svg(_jsx(_Fragment, { children: _jsx("path", { d: "M12 3l2.4 5.6L20 9.5l-4.3 3.9L17 19l-5-3-5 3 1.3-5.6L4 9.5l5.6-.9z" }) })),
    billing: svg(_jsxs(_Fragment, { children: [_jsx("path", { d: "M12 3v18" }), _jsx("path", { d: "M16.5 7.5c0-1.7-2-3-4.5-3s-4.5 1.3-4.5 3S9.5 10.5 12 11s4.5 1.3 4.5 3.5-2 3-4.5 3-4.5-1.3-4.5-3" })] })),
    connectors: svg(_jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "12", width: "9", height: "9", rx: "2" }), _jsx("rect", { x: "12", y: "12", width: "9", height: "9", rx: "2" }), _jsx("rect", { x: "12", y: "3", width: "9", height: "9", rx: "2" })] })),
    team: svg(_jsxs(_Fragment, { children: [_jsx("circle", { cx: "9", cy: "8", r: "3.5" }), _jsx("path", { d: "M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" }), _jsx("path", { d: "M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .6 3.2 2.5 3.5 5.5" })] })),
    group: svg(_jsxs(_Fragment, { children: [_jsx("path", { d: "M4 20l1.3-3.9A8 8 0 1 1 8 19z" }), _jsx("path", { d: "M9 10.5c.5 2 2 3.5 4.5 4.5l1.3-1.2 2 1-.6 1.6c-3.5.3-7.8-3.5-8.1-7l1.6-.6 1 2z" })] })),
    notices: svg(_jsxs(_Fragment, { children: [_jsx("path", { d: "M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9" }), _jsx("path", { d: "M10 20a2 2 0 0 0 4 0" })] })),
    research: svg(_jsxs(_Fragment, { children: [_jsx("circle", { cx: "11", cy: "11", r: "6.5" }), _jsx("path", { d: "m16 16 4.5 4.5" })] })),
    report: svg(_jsx(_Fragment, { children: _jsx("path", { d: "M4 20V10M10 20V4M16 20v-7M20 20H3" }) })),
    learn: svg(_jsxs(_Fragment, { children: [_jsx("path", { d: "M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" }), _jsx("path", { d: "M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z" })] })),
    language: svg(_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "M3 12h18M12 3c2.5 2.7 3.5 5.7 3.5 9s-1 6.3-3.5 9c-2.5-2.7-3.5-5.7-3.5-9s1-6.3 3.5-9" })] })),
    theme: svg(_jsx(_Fragment, { children: _jsx("path", { d: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" }) })),
    install: svg(_jsxs(_Fragment, { children: [_jsx("rect", { x: "6", y: "2", width: "12", height: "20", rx: "3" }), _jsx("path", { d: "M12 7v7M9 11l3 3 3-3" })] })),
    tour: svg(_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "m15.5 8.5-2 5-5 2 2-5z" })] })),
    admin: svg(_jsx(_Fragment, { children: _jsx("path", { d: "M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z" }) })),
    out: svg(_jsx(_Fragment, { children: _jsx("path", { d: "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10" }) })),
};
/** Account page (search and deep links); the photo opens the same list as a menu over everything. */
export function Account() {
    return _jsx("div", { className: "mx-auto w-full max-w-[560px]", children: _jsx(AccountBody, {}) });
}
/** ChatGPT-style grouped list; each row opens its own content. onPick closes the menu when a row navigates. */
export function AccountBody({ onPick }) {
    const { profile, user, logout } = useAuth();
    const { current } = useBrands();
    const { t } = useI18n();
    const navigate = useNavigate();
    const { can } = useMySections();
    const { plan } = useBilling(can('billing') ? current?.id : undefined);
    const acc = useAccesses(can('accesses') ? current?.id : undefined);
    const isAdmin = profile?.role === 'admin';
    const pwa = usePwa();
    const [iosHelp, setIosHelp] = useState(false);
    const [groups, setGroups] = useState([]);
    useEffect(() => { setGroups([]); if (current)
        noticesApi.get(current.id).then((s) => setGroups((s.groups ?? []).filter((g) => g.url))).catch(() => setGroups([])); }, [current?.id]);
    const name = profile?.name ?? user?.email ?? '';
    const initials = name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
    const ok = (r) => !r.to || can(sectionOfPath(r.to.split('?')[0]));
    const brand = [
        { to: '/plan', icon: I.plan, label: 'nav.plan', value: plan?.path ? t(`bill.path.${plan.path}`) : undefined },
        { to: '/settings?tab=billing', icon: I.billing, label: 'set.tab.billing' },
        { to: '/accesses', icon: I.connectors, label: 'nav.accesses', value: acc.loading || acc.denied ? undefined : t('acct.connected', { n: String(acc.list.length) }) },
        { to: '/settings?tab=team', icon: I.team, label: 'set.tab.team' },
        { to: '/settings?tab=notices', icon: I.notices, label: 'set.tab.notices' },
        ...groups.map((g) => ({ onClick: () => window.open(g.url, '_blank', 'noopener'), icon: I.group, label: 'set.group', text: g.name || undefined, value: t('set.groupOpen') })),
    ].filter((r) => ok(r) && (!r.to?.includes('billing') || can('billing')));
    const more = [
        { to: '/learn', icon: I.learn, label: 'cr.nav' },
    ].filter(ok);
    const account = [
        { icon: I.language, label: 'set.tab.language', value: _jsx(LangToggle, {}) },
        { icon: I.theme, label: 'theme.title', value: _jsx(ThemeToggle, {}) },
        ...(pwa.canInstall || pwa.ios ? [{ onClick: () => { if (pwa.canInstall)
                    void promptInstall();
                else
                    setIosHelp(true); }, icon: I.install, label: 'pwa.install' }] : []),
        { onClick: () => { if (!requestTour())
                navigate('/home?tour=1'); }, icon: I.tour, label: 'tour.see' },
        ...(isAdmin ? [{ to: '/admin/today', icon: I.admin, label: 'nav.backToAdmin' }] : []),
        { onClick: logout, icon: I.out, label: 'common.signOut', danger: true },
    ];
    return (_jsxs("div", { className: "acct col w-full", children: [_jsxs("div", { className: "col items-center g8", style: { textAlign: 'center' }, children: [user?.photoURL ? _jsx("img", { className: "acct-photo", src: user.photoURL, alt: "" }) : _jsx("span", { className: "acct-photo acct-initials", children: initials }), _jsx("h1", { className: "h2", children: profile?.name ?? name }), _jsxs("span", { className: "t-sm t-mute", children: [user?.email, " \u00B7 ", isAdmin ? t('role.admin') : t('role.client')] })] }), current && brand.length > 0 && _jsx(Group, { title: current.name, rows: brand, onPick: onPick }), more.length > 0 && _jsx(Group, { title: t('acct.more'), rows: more, onPick: onPick }), _jsx(Group, { title: t('acct.account'), rows: account, onPick: onPick }), iosHelp && _jsx(ConfirmDialog, { title: t('pwa.iosTitle'), confirmLabel: t('pwa.gotIt'), onConfirm: () => setIosHelp(false), onCancel: () => setIosHelp(false), children: _jsx(IosSteps, {}) })] }));
}
function Group({ title, rows, onPick }) {
    const { t } = useI18n();
    return (_jsxs("section", { className: "col g8", children: [_jsx("h2", { className: "acct-label", children: title }), _jsx("div", { className: "acct-list", children: rows.map((r, n) => {
                    const inner = (_jsxs(_Fragment, { children: [_jsx("span", { className: "acct-ico", children: r.icon }), _jsx("span", { className: "grow", children: r.text ? `WhatsApp · ${r.text}` : t(r.label) }), r.value && _jsx("span", { className: "acct-val", children: r.value }), (r.to || r.onClick) && !r.danger && _jsx("svg", { className: "acct-chev", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", "aria-hidden": "true", children: _jsx("path", { d: "m9 6 6 6-6 6" }) })] }));
                    const cls = `acct-row ${r.danger ? 'is-danger' : ''}`;
                    return r.to ? _jsx(Link, { to: r.to, onClick: onPick, className: cls, children: inner }, `${r.label}-${n}`)
                        : r.onClick ? _jsx("button", { type: "button", onClick: () => { r.onClick(); onPick?.(); }, className: cls, children: inner }, `${r.label}-${n}`)
                            : _jsx("div", { className: cls, children: inner }, `${r.label}-${n}`);
                }) })] }));
}
/** Mobile only: back to the account menu from a page opened there. */
export function BackToAccount() {
    const { t } = useI18n();
    return _jsx("button", { type: "button", onClick: openAccountMenu, className: "acct-back md:hidden", "aria-label": t('acct.back'), children: _jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M19 12H5M11 6l-6 6 6 6" }) }) });
}
/** Opens the account menu from anywhere (the photo in the top bar listens). */
export const openAccountMenu = () => window.dispatchEvent(new Event('bd:account'));
