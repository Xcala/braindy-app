import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { ALL_COLS, AccessRow, gridFor } from '../accesses/AccessRow';
import { AccessForm } from '../accesses/AccessForm';
import { useAccessLog, useAccesses } from '../accesses/useAccesses';
/** Accesses (design 07): encrypted credentials, reveal on demand, read-only access log. */
export function Accesses() {
    const { current } = useBrands();
    const { t, lang } = useI18n();
    const { list, loading, denied } = useAccesses(current?.id);
    const log = useAccessLog(denied ? undefined : current?.id);
    const [editing, setEditing] = useState(null);
    const [cols, setCols] = useState(loadCols);
    const toggle = (c) => setCols((now) => { const next = now.includes(c) ? now.filter((x) => x !== c) : ALL_COLS.filter((x) => x === c || now.includes(x)); saveCols(next); return next; });
    const label = { user: t('acc.user'), password: t('acc.password'), link: t('acc.link'), notes: t('acc.notes') };
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    const when = (d) => {
        if (!d)
            return '';
        const today = new Date().toDateString() === d.toDateString();
        return today ? d.toLocaleTimeString(lang === 'es' ? 'es-CO' : 'en-US', { hour: '2-digit', minute: '2-digit' })
            : d.toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' });
    };
    return (_jsxs("div", { className: "col g32", children: [_jsxs("div", { className: "row between g16 wrap", children: [_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", children: current.name }), _jsx("h1", { className: "h1", children: t('nav.accesses') }), _jsx("p", { className: "t-mute", children: t('acc.tagline') })] }), !denied && _jsx("button", { className: "btn btn-primary", onClick: () => setEditing('new'), children: t('acc.addAccess') })] }), denied ? _jsx("div", { className: "card t-mute", children: t('acc.ownersOnly') }) : (_jsxs("div", { className: "col g24", children: [_jsxs("div", { className: "col g12 min-w-0", children: [_jsxs("div", { className: "row g8 wrap", role: "group", "aria-label": t('acc.columns'), children: [_jsx("span", { className: "label", children: t('acc.columns') }), ALL_COLS.map((c) => (_jsxs("button", { type: "button", "aria-pressed": cols.includes(c), onClick: () => toggle(c), className: `btn btn-sm ${cols.includes(c) ? 'btn-primary' : 'btn-secondary'}`, children: [cols.includes(c) ? '✓ ' : '', label[c]] }, c)))] }), _jsxs("div", { className: "table overflow-x-auto", children: [_jsxs("div", { className: "trow head label", style: { gridTemplateColumns: gridFor(cols), minWidth: 260 + cols.length * 170 }, children: [_jsx("span", { children: t('acc.platform') }), cols.map((c) => _jsx("span", { children: label[c] }, c)), _jsx("span", {})] }), loading && _jsxs("p", { className: "t-sm t-mute", style: { padding: 16 }, children: [t('common.loading'), "\u2026"] }), !loading && list.length === 0 && _jsx("p", { className: "t-sm t-mute", style: { padding: 16 }, children: t('acc.empty') }), list.map((a) => _jsx(AccessRow, { brandId: current.id, a: a, cols: cols, onEdit: () => setEditing(a) }, a.id))] }), _jsx("p", { className: "t-xs t-mute", children: t('acc.revealNote') })] }), _jsxs("aside", { className: "grid grid-cols-1 items-start gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "card col g12", children: [_jsx("h2", { className: "h3", children: t('acc.log') }), log.length === 0 && _jsx("p", { className: "t-sm t-mute", children: t('acc.logEmpty') }), log.map((e) => (_jsxs("div", { className: "row between g8 t-sm", children: [_jsxs("span", { className: "truncate", children: [_jsx("span", { className: "w7", children: e.byName }), " ", t(`acc.action.${e.action}`), " ", e.platform] }), _jsx("span", { className: "t-xs t-mute whitespace-nowrap", children: when(e.at?.toDate()) })] }, e.id))), _jsx("p", { className: "t-xs t-mute", children: t('acc.logNote') })] }), _jsxs("div", { className: "card col g8", children: [_jsx("h2", { className: "h3", children: t('acc.howTitle') }), _jsx("p", { className: "t-sm t-mute", children: t('acc.howBody') })] })] })] })), editing && _jsx(AccessForm, { brandId: current.id, editing: editing === 'new' ? null : editing, onClose: () => setEditing(null) })] }));
}
const COLS_KEY = 'acc-cols';
/** Visible columns, remembered in this browser. Default: user, password and link. */
function loadCols() {
    try {
        const v = JSON.parse(localStorage.getItem(COLS_KEY) ?? 'null');
        if (Array.isArray(v))
            return ALL_COLS.filter((c) => v.includes(c));
    }
    catch { /* storage blocked */ }
    return ['user', 'password', 'link'];
}
function saveCols(cols) { try {
    localStorage.setItem(COLS_KEY, JSON.stringify(cols));
}
catch { /* storage blocked */ } }
