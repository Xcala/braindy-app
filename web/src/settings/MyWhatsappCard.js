import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
/** Settings · My WhatsApp: the person's own number (with consent). Messages from it become requests. */
export function MyWhatsappCard() {
    const { t } = useI18n();
    const [phone, setPhone] = useState('');
    const [saved, setSaved] = useState('');
    const [optIn, setOptIn] = useState(false);
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        api('/v1/me/whatsapp').then((r) => { setPhone(r.phone); setSaved(r.phone); setOptIn(r.optIn); }).catch(() => null);
    }, []);
    async function save(remove = false) {
        if (!remove && !optIn) {
            setMsg({ ok: false, text: t('mywa.needConsent') });
            return;
        }
        setBusy(true);
        setMsg(null);
        try {
            const r = await api('/v1/me/whatsapp', { method: 'PUT', body: JSON.stringify(remove ? {} : { phone, optIn }) });
            const p = remove ? '' : r.phone ?? phone;
            setPhone(p);
            setSaved(p);
            if (remove)
                setOptIn(false);
            setMsg({ ok: true, text: t(remove ? 'mywa.removed' : 'mywa.saved') });
        }
        catch (e) {
            const s = String(e);
            setMsg({ ok: false, text: t(s.includes('409') ? 'mywa.taken' : s.includes('400') ? 'mywa.bad' : 'mywa.error') });
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("div", { className: "card col g16", "aria-labelledby": "h-mywa", children: [_jsx("div", { className: "row between g8 wrap", children: _jsxs("span", { className: "row g8 wrap min-w-0", children: [_jsx("h2", { className: "h3", id: "h-mywa", children: t('mywa.title') }), _jsx("span", { className: `chip ${saved ? 'c-active' : 'c-draft'}`, children: saved ? t('set.connected') : t('set.notConnected') })] }) }), _jsx("p", { className: "t-sm t-mute", style: { margin: 0 }, children: t('mywa.sub') }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "mywa-num", children: t('mywa.number') }), _jsx("input", { id: "mywa-num", className: "input", inputMode: "tel", placeholder: "+57 300 000 0000", value: phone, onChange: (e) => { setPhone(e.target.value); setMsg(null); } })] }), _jsxs("label", { className: "row g8 t-sm", style: { alignItems: 'flex-start' }, children: [_jsx("input", { type: "checkbox", checked: optIn, onChange: (e) => { setOptIn(e.target.checked); setMsg(null); }, style: { marginTop: 3 } }), _jsx("span", { children: t('mywa.consent') })] }), _jsxs("div", { className: "row g8 wrap", children: [_jsx("button", { type: "button", className: "btn btn-primary btn-sm", disabled: busy || !phone.trim(), onClick: () => save(), children: t('mywa.save') }), saved && _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", disabled: busy, onClick: () => save(true), children: t('mywa.remove') })] }), msg && _jsx("p", { className: "t-sm", role: "status", style: { margin: 0, color: msg.ok ? undefined : 'var(--danger)' }, children: msg.text })] }));
}
