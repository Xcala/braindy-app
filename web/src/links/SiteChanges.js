import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
const STATUSES = ['delivered', 'in_progress', 'decision', 'client', 'discarded'];
const CHIP = { delivered: 'c-approved', in_progress: 'c-prod', decision: 'c-approve', client: 'c-approve', discarded: 'c-archived' };
function useSiteChanges(brandId) {
    const [list, setList] = useState([]);
    useEffect(() => onSnapshot(query(collection(db, 'brands', brandId, 'siteChanges'), orderBy('order')), (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setList([])), [brandId]);
    return list;
}
/** Site adjustments: the website triage synced from each site's working session (asked, delivered, state). */
export function SiteChanges({ brandId }) {
    const { t, lang } = useI18n();
    const isAdmin = useAuth().profile?.role === 'admin';
    const list = useSiteChanges(brandId);
    const [filter, setFilter] = useState('');
    const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, list.filter((x) => x.status === s).length])), [list]);
    const groups = useMemo(() => {
        const out = new Map();
        for (const x of list)
            if (!filter || x.status === filter)
                out.set(x.group || '—', [...(out.get(x.group || '—') ?? []), x]);
        return [...out];
    }, [list, filter]);
    if (!list.length)
        return null;
    const last = Math.max(...list.map((x) => x.updatedAt?.toMillis() ?? 0));
    const status = (s) => t(`site.status.${s}`);
    return (_jsxs("section", { className: "col g16", "aria-labelledby": "h-site", children: [_jsx("div", { className: "row between g12 wrap", style: { alignItems: 'flex-end' }, children: _jsxs("div", { className: "col g4", children: [_jsx("h2", { className: "h3", id: "h-site", children: t('site.title') }), _jsxs("p", { className: "t-sm t-mute", children: [t('site.sub', { n: list.length }), last ? ` · ${t('site.updated', { date: new Date(last).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'long' }) })}` : ''] })] }) }), _jsxs("div", { className: "row g8 wrap", role: "group", "aria-label": t('site.filter'), children: [_jsxs("button", { type: "button", className: `btn btn-sm ${!filter ? 'btn-primary' : 'btn-secondary'}`, "aria-pressed": !filter, onClick: () => setFilter(''), children: [t('site.all'), " \u00B7 ", list.length] }), STATUSES.filter((s) => counts[s]).map((s) => (_jsxs("button", { type: "button", className: `btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`, "aria-pressed": filter === s, onClick: () => setFilter(filter === s ? '' : s), children: [status(s), " \u00B7 ", counts[s]] }, s)))] }), groups.map(([group, items]) => (_jsxs("details", { className: "card col", open: groups.length <= 3 || items.some((x) => x.status !== 'delivered'), style: { padding: '14px 18px' }, children: [_jsxs("summary", { className: "row between g12", style: { cursor: 'pointer', listStyle: 'none' }, children: [_jsx("span", { className: "w7", children: group }), _jsx("span", { className: "t-xs t-mute", children: items.length })] }), _jsx("div", { className: "col", style: { marginTop: 8 }, children: items.map((x) => (_jsxs("article", { className: "grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_170px]", style: { padding: '14px 0', borderTop: '1px solid var(--line)' }, children: [_jsxs("div", { className: "col g4 min-w-0", children: [_jsx("span", { className: "t-xs t-mute", children: x.key }), _jsx("span", { className: "w7", children: x.title }), x.request && _jsx("span", { className: "t-sm", children: x.request }), x.source && _jsx("span", { className: "t-xs t-mute", children: x.source })] }), _jsxs("div", { className: "col g4 min-w-0", children: [x.delivered && _jsxs(_Fragment, { children: [_jsx("span", { className: "label", children: t('site.done') }), _jsx("span", { className: "t-sm", style: { whiteSpace: 'pre-line' }, children: x.delivered })] }), x.link && _jsx("a", { href: x.link, target: "_blank", rel: "noreferrer", className: "t-sm", children: t('site.seeChange') })] }), _jsx("div", { children: isAdmin ? (_jsx("select", { className: "input", style: { height: 36, fontSize: 13 }, "aria-label": `${t('site.state')} ${x.key}`, value: x.status, onChange: (e) => updateDoc(doc(db, 'brands', brandId, 'siteChanges', x.id), { status: e.target.value, updatedAt: serverTimestamp() }), children: STATUSES.map((s) => _jsx("option", { value: s, children: status(s) }, s)) })) : _jsx("span", { className: `chip ${CHIP[x.status]}`, children: status(x.status) }) })] }, x.id))) })] }, group)))] }));
}
