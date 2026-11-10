import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useCopy } from '../brands/identity/useCopy';
import { createSend } from './api';
/** Send panel from the design: every send gets its own tracked link. Email needs Gmail (pending setup). */
export function SendPanel({ p }) {
    const { t } = useI18n();
    const { copied, copy } = useCopy();
    const [channel, setChannel] = useState('whatsapp');
    const [to, setTo] = useState(p.prospect?.phone ?? '');
    const greeting = p.prospect?.name ? p.prospect.name.split(' ')[0] : '';
    const [message, setMessage] = useState(t('proposals.defaultMessage', { name: greeting, company: p.prospect?.company ?? '' }));
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(false);
    const pick = (c) => {
        setChannel(c);
        setResult(null);
        setTo(c === 'whatsapp' ? p.prospect?.phone ?? '' : c === 'email' ? p.prospect?.email ?? '' : '');
    };
    async function send() {
        if (channel === 'email')
            return;
        setBusy(true);
        setError(false);
        try {
            const r = await createSend(p.id, channel, to, message);
            setResult(r);
            if (r.whatsapp)
                window.open(r.whatsapp, '_blank', 'noopener');
        }
        catch {
            setError(true);
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("aside", { className: "card col g20", "aria-labelledby": "psend", children: [_jsxs("div", { className: "col g4", children: [_jsx("h2", { className: "h2", id: "psend", children: t('proposals.send') }), _jsx("p", { className: "t-sm t-mute", children: t('proposals.sendHint') })] }), _jsx("div", { className: "seg", role: "tablist", "aria-label": t('proposals.channelLabel'), style: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }, children: ['link', 'email', 'whatsapp'].map((c) => (_jsxs("button", { role: "tab", "aria-selected": channel === c, className: channel === c ? 'is-on' : '', onClick: () => pick(c), children: [_jsx(Icon, { name: c === 'link' ? 'link' : c === 'email' ? 'file' : 'external' }), t(`proposals.channel.${c}`)] }, c))) }), channel === 'email' ? (_jsxs("div", { className: "card card-tight col g8", style: { background: 'var(--warning-bg)', border: 0 }, children: [_jsx("p", { className: "w7", style: { color: 'var(--warning)' }, children: t('proposals.emailPending') }), _jsx("p", { className: "t-sm", children: t('proposals.emailPendingBody') })] })) : (_jsxs(_Fragment, { children: [channel === 'whatsapp' && (_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "to", children: t('proposals.toPhone') }), _jsx("input", { className: "input", id: "to", type: "tel", value: to, onChange: (e) => setTo(e.target.value), placeholder: "+57 300 000 0000" })] })), channel === 'link' && (_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "to", children: t('proposals.linkFor') }), _jsx("input", { className: "input", id: "to", value: to, onChange: (e) => setTo(e.target.value), placeholder: t('proposals.linkForPh') })] })), channel === 'whatsapp' && (_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "msg", children: t('proposals.message') }), _jsx("textarea", { id: "msg", className: "input", style: { height: 160, padding: '14px 16px', lineHeight: '22px' }, value: message, onChange: (e) => setMessage(e.target.value) })] })), _jsx("button", { className: "btn btn-primary btn-block", style: { height: 52 }, onClick: send, disabled: busy || (channel === 'whatsapp' && to.replace(/\D/g, '').length < 8), children: channel === 'whatsapp' ? t('proposals.openWhatsapp') : t('proposals.createLink') }), error && _jsx("p", { className: "t-sm", role: "alert", style: { color: 'var(--danger)' }, children: t('proposals.sendError') }), result && (_jsxs("div", { className: "row g12", style: { border: '1px solid var(--line)', borderRadius: 14, padding: '12px 14px' }, children: [_jsx(Icon, { name: "link", size: 20 }), _jsx("span", { className: "mono grow truncate", children: result.url.replace(/^https?:\/\//, '') }), _jsx("button", { className: "copybtn", onClick: () => copy(result.url), children: copied === result.url ? t('common.copied') : t('common.copy') })] }))] }))] }));
}
