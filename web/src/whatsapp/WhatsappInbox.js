import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
import { useBrands } from '../brands/BrandProvider';
/** NickMark only: WhatsApp channel status and messages from numbers no brand knows yet. */
export function WhatsappInbox() {
    const { t } = useI18n();
    const { brands } = useBrands();
    const [st, setSt] = useState(null);
    const [items, setItems] = useState([]);
    const [brand, setBrand] = useState({});
    const [person, setPerson] = useState({});
    const [people, setPeople] = useState({});
    const [msg, setMsg] = useState(null);
    useEffect(() => { api('/v1/admin/whatsapp/status').then(setSt).catch(() => setSt(null)); }, []);
    useEffect(() => onSnapshot(query(collection(db, 'waInbox'), where('status', '==', 'new')), (s) => setItems(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.at?.toDate().getTime() ?? 0) - (a.at?.toDate().getTime() ?? 0))), () => setItems([])), []);
    const active = brands.filter((b) => b.status === 'active').sort((a, b) => a.name.localeCompare(b.name));
    async function pickBrand(id, brandId) {
        setBrand({ ...brand, [id]: brandId });
        setPerson({ ...person, [id]: '' });
        if (!brandId || people[brandId])
            return;
        const snap = await getDocs(collection(db, 'brands', brandId, 'members')).catch(() => null);
        setPeople((p) => ({ ...p, [brandId]: (snap?.docs ?? []).map((d) => ({ uid: d.id, label: String(d.get('name') || d.get('email') || d.id) })) }));
    }
    async function act(id, path) {
        setMsg(null);
        try {
            await api(`/v1/admin/whatsapp/inbox/${id}/${path}`, { method: 'POST', body: JSON.stringify(path === 'assign' ? { brandId: brand[id], uid: person[id] } : {}) });
            if (path === 'assign')
                setMsg(t('wa.assigned'));
        }
        catch {
            setMsg(t('wa.error'));
        }
    }
    const when = (iso) => (iso ? new Date(iso).toLocaleString() : t('wa.never'));
    const chip = (on) => _jsx("span", { className: `chip ${on ? 'c-active' : 'c-draft'}`, children: on ? t('wa.on') : t('wa.off') });
    return (_jsxs("section", { className: "card col g12", "aria-labelledby": "h-wa", children: [_jsxs("div", { className: "col", children: [_jsx("h2", { className: "h3", id: "h-wa", children: t('wa.title') }), _jsx("span", { className: "t-xs t-mute", children: t('wa.sub') })] }), st && (_jsxs("div", { className: "row g16 wrap t-sm", children: [_jsxs("span", { className: "row g8", children: [t('wa.receiving'), " ", chip(st.receiving)] }), _jsxs("span", { className: "row g8", children: [t('wa.sending'), " ", chip(st.sending)] }), _jsxs("span", { className: "t-mute", children: [t('wa.lastWebhook'), ": ", when(st.lastWebhookAt)] }), _jsxs("span", { className: "t-mute", children: [t('wa.inbound'), ": ", st.inbound] }), st.lastError && _jsxs("span", { style: { color: 'var(--danger)' }, children: [t('wa.lastError'), ": ", st.lastError.title || st.lastError.code, " \u00B7 ", when(st.lastError.at)] })] })), msg && _jsx("p", { className: "t-sm", role: "status", children: msg }), items.length === 0 && _jsx("p", { className: "t-sm t-mute", children: t('wa.empty') }), items.map((i) => (_jsxs("div", { className: "col g8", style: { borderTop: '1px solid var(--line)', paddingTop: 10 }, children: [_jsxs("span", { className: "t-sm", children: [_jsx("b", { children: i.name || `+${i.phone}` }), " ", _jsxs("span", { className: "t-mute", children: ["\u00B7 +", i.phone, i.at ? ` · ${i.at.toDate().toLocaleString()}` : ''] })] }), i.text && _jsx("p", { className: "t-sm", style: { margin: 0, whiteSpace: 'pre-wrap' }, children: i.text }), i.media?.length ? _jsx("span", { className: "t-xs t-mute", children: t('wa.files', { n: i.media.length }) }) : null, _jsxs("div", { className: "row g8 wrap", children: [_jsxs("select", { className: "input", style: { height: 36, width: 'auto', minWidth: 180 }, value: brand[i.id] ?? '', onChange: (e) => pickBrand(i.id, e.target.value), "aria-label": t('wa.brand'), children: [_jsx("option", { value: "", children: t('wa.brand') }), active.map((b) => _jsx("option", { value: b.id, children: b.name }, b.id))] }), _jsxs("select", { className: "input", style: { height: 36, width: 'auto', minWidth: 180 }, disabled: !brand[i.id], value: person[i.id] ?? '', onChange: (e) => setPerson({ ...person, [i.id]: e.target.value }), "aria-label": t('wa.person'), children: [_jsx("option", { value: "", children: t('wa.person') }), (people[brand[i.id]] ?? []).map((p) => _jsx("option", { value: p.uid, children: p.label }, p.uid))] }), _jsx("button", { className: "btn btn-primary btn-sm", disabled: !brand[i.id] || !person[i.id], onClick: () => act(i.id, 'assign'), children: t('wa.assign') }), _jsx("button", { className: "btn btn-ghost btn-sm", onClick: () => act(i.id, 'dismiss'), children: t('wa.dismiss') })] })] }, i.id)))] }));
}
