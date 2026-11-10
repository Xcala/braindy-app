import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
import { useBrands } from '../brands/BrandProvider';
/** NickMark only: Granola meetings that could not be matched to a brand. Assigning one teaches the domains. */
export function GranolaInbox() {
    const { t } = useI18n();
    const { brands } = useBrands();
    const [items, setItems] = useState([]);
    const [pick, setPick] = useState({});
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);
    useEffect(() => onSnapshot(query(collection(db, 'granolaInbox'), where('status', '==', 'unassigned')), (s) => setItems(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.date.localeCompare(a.date))), () => setItems([])), []);
    const active = brands.filter((b) => b.status === 'active').sort((a, b) => a.name.localeCompare(b.name));
    async function sync() {
        setBusy(true);
        setMsg(t('gra.syncing'));
        try {
            const r = await api('/v1/admin/granola/sync?days=30', { method: 'POST', body: '{}' });
            setMsg(t('gra.synced', { filed: r.filed, inbox: r.inbox }));
        }
        catch (e) {
            setMsg(String(e).includes('503') ? t('gra.notConfigured') : t('brains.error'));
        }
        finally {
            setBusy(false);
        }
    }
    const assign = (id) => pick[id] && api(`/v1/admin/granola/inbox/${id}/assign`, { method: 'POST', body: JSON.stringify({ brandId: pick[id] }) });
    const ignore = (id) => api(`/v1/admin/granola/inbox/${id}/ignore`, { method: 'POST', body: '{}' });
    return (_jsxs("section", { className: "card col g12", "aria-labelledby": "h-granola", children: [_jsxs("div", { className: "row between g8 wrap", children: [_jsxs("div", { className: "col", children: [_jsx("h2", { className: "h3", id: "h-granola", children: t('gra.title') }), _jsx("span", { className: "t-xs t-mute", children: t('gra.sub') })] }), _jsx("button", { className: "btn btn-secondary btn-sm", disabled: busy, onClick: sync, children: t('gra.sync') })] }), msg && _jsx("p", { className: "t-sm", role: "status", children: msg }), items.length === 0 && _jsx("p", { className: "t-sm t-mute", children: t('gra.empty') }), items.map((i) => (_jsxs("div", { className: "col g8", style: { borderTop: '1px solid var(--line)', paddingTop: 10 }, children: [_jsxs("div", { className: "row between g8 wrap", children: [_jsxs("span", { className: "t-sm", children: [_jsx("b", { children: i.title }), " ", _jsxs("span", { className: "t-mute", children: ["\u00B7 ", i.date] })] }), i.webUrl && _jsx("a", { className: "t-xs", href: i.webUrl, target: "_blank", rel: "noreferrer", children: "Granola" })] }), i.attendees?.length ? _jsx("span", { className: "t-xs t-mute truncate", children: i.attendees.join(', ') }) : null, _jsxs("div", { className: "row g8 wrap", children: [_jsxs("select", { className: "input", style: { height: 36, width: 'auto', minWidth: 200 }, value: pick[i.id] ?? '', onChange: (e) => setPick({ ...pick, [i.id]: e.target.value }), "aria-label": t('gra.brand'), children: [_jsx("option", { value: "", children: t('gra.brand') }), active.map((b) => _jsx("option", { value: b.id, children: b.name }, b.id))] }), _jsx("button", { className: "btn btn-primary btn-sm", disabled: !pick[i.id], onClick: () => assign(i.id), children: t('gra.assign') }), _jsx("button", { className: "btn btn-ghost btn-sm", onClick: () => ignore(i.id), children: t('gra.ignore') })] })] }, i.id)))] }));
}
