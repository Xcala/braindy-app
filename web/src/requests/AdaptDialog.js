import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { createRequest } from './api';
const FORMATS = ['story', 'feed', 'square', 'landscape', 'linkedin', 'banner', 'print', 'whatsapp'];
/**
 * «Adapt to every format» on an approved piece: the client ticks the places it should run, and a new request goes
 * to Creator (social › content adaptation) pointing at the approved version, whose files the team starts from.
 */
export function AdaptDialog({ brandId, r, v, onClose }) {
    const { t, lang } = useI18n();
    const [picked, setPicked] = useState(new Set(['story', 'feed', 'square']));
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const [done, setDone] = useState(null);
    const ref = useRef(null);
    useEffect(() => {
        const prev = document.activeElement;
        ref.current?.querySelector('input')?.focus();
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('keydown', onKey); prev?.focus(); };
    }, [onClose]);
    const toggle = (f) => setPicked((s) => { const n = new Set(s); if (n.has(f))
        n.delete(f);
    else
        n.add(f); return n; });
    async function send() {
        setBusy(true);
        setError(false);
        const list = FORMATS.filter((f) => picked.has(f)).map((f) => `- ${t(`ad.f.${f}`)}`).join('\n');
        const text = `${t('ad.title', { title: r.title })} (v${v.n}).\n\n${t('ad.pick')}:\n${list}${note.trim() ? `\n\n${note.trim()}` : ''}`;
        try {
            const res = await createRequest(brandId, {
                title: t('ad.reqTitle', { title: r.title }).slice(0, 160), category: 'social', subcategory: 'organic', formatType: lang === 'es' ? 'Adaptación de contenido' : 'Content adaptation',
                cards: { product: { text, links: [`${location.origin}/requests/${r.id}?brand=${brandId}`] } },
                dueDate: null, from: { requestId: r.id, versionId: v.id },
            });
            setDone(res.requestId);
        }
        catch {
            setError(true);
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsx("div", { className: "scrim fixed inset-0 z-50 flex items-center justify-center p-4", onMouseDown: (e) => e.target === e.currentTarget && onClose(), children: _jsxs("div", { ref: ref, className: "modal w-full max-w-[520px]", role: "dialog", "aria-modal": "true", "aria-labelledby": "adapt-title", children: [_jsx("h2", { className: "h3", id: "adapt-title", children: t('ad.title', { title: r.title }) }), done ? (_jsxs(_Fragment, { children: [_jsxs("p", { className: "row g8", children: [_jsx(Icon, { name: "check" }), t('ad.sent')] }), _jsxs("div", { className: "row g12", style: { justifyContent: 'flex-end' }, children: [_jsx("button", { className: "btn btn-secondary", onClick: onClose, children: t('lb.close') }), _jsx(Link, { className: "btn btn-primary", to: `/requests/${done}`, onClick: onClose, children: t('ad.see') })] })] })) : (_jsxs(_Fragment, { children: [_jsx("p", { className: "t-sm t-mute", children: t('ad.lead') }), _jsxs("fieldset", { className: "col g8", style: { border: 0, padding: 0, margin: 0 }, children: [_jsx("legend", { className: "label", style: { marginBottom: 8 }, children: t('ad.pick') }), _jsx("div", { className: "grid grid-cols-1 gap-2 sm:grid-cols-2", children: FORMATS.map((f) => (_jsxs("label", { className: `ad-opt${picked.has(f) ? ' is-on' : ''}`, children: [_jsx("input", { type: "checkbox", checked: picked.has(f), onChange: () => toggle(f) }), _jsx("span", { children: t(`ad.f.${f}`) })] }, f))) })] }), _jsxs("label", { className: "col g4", children: [_jsx("span", { className: "t-sm w7", children: t('ad.note') }), _jsx("textarea", { className: "input", rows: 3, value: note, maxLength: 1000, onChange: (e) => setNote(e.target.value), style: { height: 'auto', paddingTop: 10 } })] }), error && _jsx("p", { className: "t-sm", role: "alert", style: { color: 'var(--danger)' }, children: t('ad.error') }), _jsxs("div", { className: "row g12", style: { justifyContent: 'flex-end' }, children: [_jsx("button", { className: "btn btn-secondary", onClick: onClose, children: t('common.cancel') }), _jsx("button", { className: "btn btn-primary", disabled: busy || !picked.size, onClick: send, children: t('ad.send', { n: picked.size }) })] })] }))] }) }));
}
