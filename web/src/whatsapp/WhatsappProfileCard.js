import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
const VERTICALS = ['OTHER', 'PROF_SERVICES', 'EDU', 'ENTERTAIN', 'EVENT_PLAN', 'RETAIL', 'APPAREL', 'BEAUTY', 'HEALTH', 'FINANCE', 'TRAVEL', 'RESTAURANT', 'HOTEL', 'NONPROFIT', 'AUTO', 'GROCERY'];
const ERRORS = { about_required: 'wap.errAbout', invalid_email: 'wap.errEmail', invalid_website: 'wap.errWeb' };
/** NickMark only: the public WhatsApp Business profile clients see when they open Braindy's chat. */
export function WhatsappProfileCard() {
    const { t } = useI18n();
    const [p, setP] = useState(null);
    const [failed, setFailed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);
    useEffect(() => { api('/v1/admin/whatsapp/profile').then(setP).catch(() => setFailed(true)); }, []);
    const set = (k, v) => { if (p) {
        setP({ ...p, [k]: v });
        setMsg(null);
    } };
    const setWeb = (i, v) => { if (p) {
        const w = [p.websites[0] ?? '', p.websites[1] ?? ''];
        w[i] = v;
        setP({ ...p, websites: w });
        setMsg(null);
    } };
    async function save() {
        if (!p)
            return;
        setBusy(true);
        setMsg(null);
        try {
            const { photo: _photo, ...body } = p;
            await api('/v1/admin/whatsapp/profile', { method: 'PUT', body: JSON.stringify(body) });
            setMsg({ ok: true, text: t('wap.saved') });
        }
        catch (e) {
            const code = Object.keys(ERRORS).find((k) => String(e).includes(k));
            setMsg({ ok: false, text: t(code ? ERRORS[code] : 'wap.error') });
        }
        finally {
            setBusy(false);
        }
    }
    const field = (k, max, type = 'text') => (_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: `wap-${k}`, children: t(`wap.${k}`) }), _jsx("input", { id: `wap-${k}`, className: "input", type: type, maxLength: max, value: p?.[k] ?? '', onChange: (e) => set(k, e.target.value) })] }));
    return (_jsxs("section", { className: "card col g12", "aria-labelledby": "h-wap", children: [_jsxs("div", { className: "row g12", style: { alignItems: 'center' }, children: [p?.photo && _jsx("img", { src: p.photo, alt: "", width: 44, height: 44, style: { borderRadius: '50%', objectFit: 'cover' } }), _jsxs("div", { className: "col", children: [_jsx("h2", { className: "h3", id: "h-wap", children: t('wap.title') }), _jsx("span", { className: "t-xs t-mute", children: t('wap.sub') })] })] }), failed && _jsx("p", { className: "t-sm t-mute", children: t('wap.unavailable') }), p && (_jsxs(_Fragment, { children: [field('about', 139), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "wap-desc", children: t('wap.description') }), _jsx("textarea", { id: "wap-desc", className: "input", rows: 4, maxLength: 512, style: { padding: '10px 12px', resize: 'vertical', lineHeight: 1.45 }, value: p.description, onChange: (e) => set('description', e.target.value) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "wap-vertical", children: t('wap.vertical') }), _jsx("select", { id: "wap-vertical", className: "input", value: p.vertical || 'OTHER', onChange: (e) => set('vertical', e.target.value), children: VERTICALS.map((v) => _jsx("option", { value: v, children: t(`wap.v.${v}`) }, v)) })] }), field('address', 256), field('email', 128, 'email'), [0, 1].map((i) => (_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: `wap-web${i}`, children: t('wap.website', { n: i + 1 }) }), _jsx("input", { id: `wap-web${i}`, className: "input", type: "url", placeholder: "https://", maxLength: 256, value: p.websites[i] ?? '', onChange: (e) => setWeb(i, e.target.value) })] }, i))), _jsx("p", { className: "t-xs t-mute", style: { margin: 0 }, children: t('wap.phoneOnly') }), _jsx("div", { className: "row g8", children: _jsx("button", { type: "button", className: "btn btn-primary btn-sm", disabled: busy, onClick: save, children: t('wap.save') }) }), msg && _jsx("p", { className: "t-sm", role: "status", style: { margin: 0, color: msg.ok ? undefined : 'var(--danger)' }, children: msg.text })] }))] }));
}
