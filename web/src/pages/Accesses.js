import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { ALL_COLS, priceLabel } from '../accesses/AccessRow';
import { AppsList } from '../accesses/AppsList';
import { AppsToolbar } from '../accesses/AppsToolbar';
import { loadView, monthlyTotals, passes, saveView } from '../accesses/appsView';
import { AccessForm } from '../accesses/AccessForm';
import { useAccessLog, useAccesses } from '../accesses/useAccesses';
import { BackToAccount } from './Account';
import { Scan } from '../components/Scan';
/** Third party apps (design 07): encrypted credentials, reveal on demand, search, groups, grid, read-only log. */
export function Accesses() {
    const { current } = useBrands();
    const { t, lang } = useI18n();
    const { list, loading, denied } = useAccesses(current?.id);
    const log = useAccessLog(denied ? undefined : current?.id);
    const [editing, setEditing] = useState(null);
    const [cols, setCols] = useState(loadCols);
    const toggle = (c) => setCols((now) => { const next = now.includes(c) ? now.filter((x) => x !== c) : ALL_COLS.filter((x) => x === c || now.includes(x)); saveCols(next); return next; });
    const [view, setView] = useState(loadView);
    const set = (p) => setView((v) => { const next = { ...v, ...p }; saveView(next); return next; });
    const [q, setQ] = useState('');
    const FILTERS = ['all', 'subs', 'google', 'microsoft', 'missing'];
    const counts = Object.fromEntries(FILTERS.map((f) => [f, list.filter((a) => passes(a, f)).length]));
    const groupNames = [...new Set(list.map((a) => a.group).filter((g) => !!g))].sort();
    const label = { user: t('acc.user'), password: t('acc.password'), link: t('acc.link'), plan: t('acc.subscription'), notes: t('acc.notes') };
    const monthly = monthlyTotals(list);
    const subs = list.filter((a) => a.subscription).length;
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    const when = (d) => {
        if (!d)
            return '';
        const today = new Date().toDateString() === d.toDateString();
        return today ? d.toLocaleTimeString(lang === 'es' ? 'es-CO' : 'en-US', { hour: '2-digit', minute: '2-digit' })
            : d.toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' });
    };
    return (_jsxs("div", { className: "col g32", children: [_jsx(BackToAccount, {}), _jsxs("div", { className: "row between g16 wrap", children: [_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", children: current.name }), _jsx("h1", { className: "h1", children: t('nav.accesses') }), _jsx("p", { className: "t-mute", children: t('acc.tagline') })] }), !denied && _jsx("button", { className: "btn btn-primary", onClick: () => setEditing('new'), children: t('acc.addAccess') })] }), denied ? _jsx("div", { className: "card t-mute", children: t('acc.ownersOnly') }) : (_jsxs("div", { className: "col g24", children: [_jsxs("div", { className: "col g12 min-w-0", children: [_jsx(AppsToolbar, { view: view, set: set, q: q, setQ: setQ, counts: counts }), view.layout === 'list' && _jsxs("div", { className: "row g8 wrap", role: "group", "aria-label": t('acc.columns'), children: [_jsx("span", { className: "label", children: t('acc.columns') }), ALL_COLS.map((c) => (_jsxs("button", { type: "button", "aria-pressed": cols.includes(c), onClick: () => toggle(c), className: `btn btn-sm ${cols.includes(c) ? 'btn-primary' : 'btn-secondary'}`, children: [cols.includes(c) ? '✓ ' : '', label[c]] }, c)))] }), loading ? _jsxs("p", { className: "t-sm t-mute", children: [t('common.loading'), "\u2026"] }) : list.length === 0 ? _jsx("div", { className: "card t-mute", children: t('acc.empty') })
                                : _jsx(AppsList, { brandId: current.id, list: list, view: view, q: q, cols: cols, onEdit: setEditing, onClear: () => { setQ(''); set({ filter: 'all' }); } }), subs > 0 && (_jsxs("p", { className: "t-sm", style: { margin: 0 }, children: [_jsx("span", { className: "w7", children: t('acc.subsTotal', { n: String(subs) }) }), monthly.size > 0 && _jsxs("span", { className: "t-mute", children: [" \u00B7 ", [...monthly].map(([cur, v]) => priceLabel(Math.round(v * 100) / 100, cur, 'month', t, lang)).join(' + ')] })] })), _jsx("p", { className: "t-xs t-mute", children: t('acc.revealNote') })] }), _jsxs("aside", { className: "grid grid-cols-1 items-start gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "card col g12", children: [_jsx("h2", { className: "h3", children: t('acc.log') }), log.length === 0 && _jsx("p", { className: "t-sm t-mute", children: t('acc.logEmpty') }), log.map((e) => (_jsxs("div", { className: "row between g8 t-sm", children: [_jsxs("span", { className: "truncate", children: [_jsx("span", { className: "w7", children: e.byName }), " ", t(`acc.action.${e.action}`), " ", e.platform] }), _jsx("span", { className: "t-xs t-mute whitespace-nowrap", children: when(e.at?.toDate()) })] }, e.id))), _jsx("p", { className: "t-xs t-mute", children: t('acc.logNote') })] }), _jsxs("div", { className: "card col g8", children: [_jsx("h2", { className: "h3", children: t('acc.howTitle') }), _jsx(Scan, { text: t('acc.howBody') })] })] })] })), editing && _jsx(AccessForm, { brandId: current.id, editing: editing === 'new' ? null : editing, groups: groupNames, onClose: () => setEditing(null) })] }));
}
// v2: the subscription column joined the defaults (2026-11-02).
const COLS_KEY = 'acc-cols-2';
/** Visible columns, remembered in this browser. Default: user, password, link and subscription. */
function loadCols() {
    try {
        const v = JSON.parse(localStorage.getItem(COLS_KEY) ?? 'null');
        if (Array.isArray(v))
            return ALL_COLS.filter((c) => v.includes(c));
    }
    catch { /* storage blocked */ }
    return ['user', 'password', 'link', 'plan'];
}
function saveCols(cols) { try {
    localStorage.setItem(COLS_KEY, JSON.stringify(cols));
}
catch { /* storage blocked */ } }
