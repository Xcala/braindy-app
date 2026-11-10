import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
import { useBrands } from '../brands/BrandProvider';
/** NickMark only: per brand, who may write to Braindy on WhatsApp (and with which number). */
export function WhatsappAccess() {
    const { t } = useI18n();
    const { brands, current } = useBrands();
    const active = brands.filter((b) => b.status === 'active' && b.kind === 'brand').sort((a, b) => a.name.localeCompare(b.name));
    const [brandId, setBrandId] = useState(current?.kind === 'brand' ? current.id : '');
    const [people, setPeople] = useState(null);
    const [phones, setPhones] = useState({});
    const [msg, setMsg] = useState(null);
    const load = useCallback(() => {
        if (!brandId) {
            setPeople([]);
            return;
        }
        setPeople(null);
        api(`/v1/admin/whatsapp/brands/${brandId}/people`)
            .then((r) => { setPeople(r.people); setPhones(Object.fromEntries(r.people.map((p) => [p.uid, p.phone ? `+${p.phone}` : '']))); })
            .catch(() => setPeople([]));
    }, [brandId]);
    useEffect(load, [load]);
    async function save(p, patch) {
        setMsg(null);
        try {
            await api(`/v1/admin/whatsapp/brands/${brandId}/people/${p.uid}`, { method: 'PUT', body: JSON.stringify(patch) });
            setMsg({ ok: true, text: t('waa.saved') });
            load();
        }
        catch (e) {
            const status = e?.status;
            setMsg({ ok: false, text: t(status === 409 ? 'mywa.taken' : status === 400 ? 'mywa.bad' : 'mywa.error') });
        }
    }
    return (_jsxs("section", { className: "card col g16", "aria-labelledby": "h-waa", children: [_jsxs("div", { className: "row between wrap g12", children: [_jsxs("div", { className: "col", children: [_jsx("h2", { className: "h3", id: "h-waa", children: t('waa.title') }), _jsx("span", { className: "t-xs t-mute", children: t('waa.sub') })] }), _jsxs("select", { className: "input", style: { width: 'auto', minWidth: 200 }, value: brandId, onChange: (e) => setBrandId(e.target.value), "aria-label": t('wa.brand'), children: [_jsx("option", { value: "", children: t('wa.brand') }), active.map((b) => _jsx("option", { value: b.id, children: b.name }, b.id))] })] }), msg && _jsx("p", { className: "t-sm", role: "status", style: { color: msg.ok ? 'var(--success)' : 'var(--danger)' }, children: msg.text }), !brandId && _jsx("p", { className: "t-sm t-mute", children: t('waa.pick') }), brandId && people === null && _jsx("div", { className: "skel", style: { height: 80 } }), brandId && people?.length === 0 && _jsx("p", { className: "t-sm t-mute", children: t('team.noMembers') }), people?.map((p) => {
                const label = p.name && p.name !== p.email ? p.name : p.email || p.uid;
                const dirty = (phones[p.uid] ?? '').replace(/\D/g, '') !== p.phone;
                return (_jsxs("div", { className: "row g12 wrap", style: { paddingBottom: 12, borderBottom: '1px solid var(--line)' }, children: [_jsx("span", { className: "avatar-txt", children: (p.email || '?').slice(0, 2).toUpperCase() }), _jsxs("div", { className: "col grow", style: { minWidth: 180 }, children: [_jsx("span", { className: "w7 truncate", children: label }), _jsxs("span", { className: "t-xs t-mute truncate", children: [p.email, p.phone ? ` · ${t(p.optIn ? 'waa.linked' : 'waa.stopped')}` : ` · ${t('waa.noNumber')}`] })] }), _jsxs("form", { className: "row g8", onSubmit: (e) => { e.preventDefault(); save(p, { phone: phones[p.uid] ?? '' }); }, children: [_jsx("input", { className: "input", style: { height: 36, width: 170 }, type: "tel", inputMode: "tel", placeholder: "+57 300 000 0000", "aria-label": `${t('mywa.number')} · ${label}`, value: phones[p.uid] ?? '', onChange: (e) => setPhones({ ...phones, [p.uid]: e.target.value }) }), dirty && _jsx("button", { type: "submit", className: "btn btn-secondary btn-sm", children: t('mywa.save') })] }), _jsxs("span", { className: "row g8 t-sm", children: [_jsx("button", { className: `switch ${p.allowed ? 'is-on' : ''}`, role: "switch", "aria-checked": p.allowed, "aria-label": `${t('waa.allowed')} · ${label}`, onClick: () => save(p, { allowed: !p.allowed }) }), t('waa.allowed')] })] }, p.uid));
            }), _jsx("p", { className: "t-xs t-mute", children: t('waa.hint') })] }));
}
