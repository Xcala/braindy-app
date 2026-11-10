import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { api } from '../lib/api';
/** Book 30 minutes with NickMark: pick a day, then a free time (shown in the person's own time zone). */
export function BookMeeting({ brandId, onClose }) {
    const { t, lang } = useI18n();
    const loc = lang === 'es' ? 'es-CO' : 'en-US';
    const [slots, setSlots] = useState(null);
    const [connected, setConnected] = useState(true);
    const [day, setDay] = useState(null);
    const [pick, setPick] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(null);
    const box = useRef(null);
    const load = () => api(`/v1/brands/${brandId}/meetings/slots`)
        .then((r) => { setConnected(r.connected); setSlots(r.slots); }).catch(() => { setConnected(false); setSlots([]); });
    useEffect(() => { load(); }, [brandId]);
    useEffect(() => {
        const prev = document.activeElement;
        box.current?.querySelector('button')?.focus();
        const esc = (e) => { if (e.key === 'Escape')
            onClose(); };
        document.addEventListener('keydown', esc);
        return () => { document.removeEventListener('keydown', esc); prev?.focus(); };
    }, [onClose]);
    const dayKey = (iso) => new Date(iso).toLocaleDateString('en-CA');
    const days = useMemo(() => [...new Set((slots ?? []).map(dayKey))], [slots]);
    const current = day && days.includes(day) ? day : days[0];
    const times = (slots ?? []).filter((s) => dayKey(s) === current);
    const fmtDay = (k) => new Date(`${k}T12:00:00`).toLocaleDateString(loc, { weekday: 'short', day: 'numeric', month: 'short' });
    const fmtTime = (iso) => new Date(iso).toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' });
    async function book() {
        if (!pick)
            return;
        setBusy(true);
        setError(null);
        try {
            setDone(await api(`/v1/brands/${brandId}/meetings/book`, { method: 'POST', body: JSON.stringify({ start: pick }) }));
        }
        catch (e) {
            const m = String(e);
            setError(t(m.includes('409') ? 'bk.taken' : m.includes('429') ? 'bk.tooMany' : 'bk.error'));
            if (m.includes('409')) {
                setPick(null);
                load();
            }
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsx("div", { className: "scrim fixed inset-0 z-50 flex items-center justify-center p-4", onMouseDown: (e) => e.target === e.currentTarget && onClose(), children: _jsxs("div", { ref: box, className: "modal col g16 w-full max-w-[520px]", role: "dialog", "aria-modal": "true", "aria-labelledby": "bk-title", children: [_jsxs("div", { className: "row between g8", children: [_jsx("h2", { className: "h2", id: "bk-title", children: t('bk.title') }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: onClose, "aria-label": t('common.cancel'), children: "\u2715" })] }), done ? (_jsxs("div", { className: "col g12", children: [_jsx("p", { className: "w7", children: t('bk.done', { when: `${fmtDay(dayKey(done.start))} · ${fmtTime(done.start)}` }) }), _jsx("p", { className: "t-sm t-mute", children: t('bk.doneSub') }), done.link && _jsx("a", { className: "btn btn-primary self-start", href: done.link, target: "_blank", rel: "noreferrer", children: t('hg.join') })] })) : slots === null ? _jsxs("p", { className: "t-mute", children: [t('common.loading'), "\u2026"] })
                    : !connected ? _jsx("p", { className: "t-sm t-mute", children: t('bk.notOpen') })
                        : !slots.length ? _jsx("p", { className: "t-sm t-mute", children: t('bk.none') })
                            : (_jsxs(_Fragment, { children: [_jsx("p", { className: "t-sm t-mute", children: t('bk.sub', { tz: Intl.DateTimeFormat().resolvedOptions().timeZone }) }), _jsx("div", { className: "seg seg-scroll", role: "tablist", "aria-label": t('bk.day'), children: days.map((k) => _jsx("button", { type: "button", role: "tab", "aria-selected": k === current, className: k === current ? 'is-on' : '', onClick: () => { setDay(k); setPick(null); }, children: fmtDay(k) }, k)) }), _jsx("div", { className: "grid grid-cols-3 gap-2 sm:grid-cols-4", role: "radiogroup", "aria-label": t('bk.time'), children: times.map((s) => (_jsx("button", { type: "button", role: "radio", "aria-checked": pick === s, className: `btn btn-sm ${pick === s ? 'btn-primary' : 'btn-secondary'}`, onClick: () => setPick(s), children: fmtTime(s) }, s))) }), error && _jsx("p", { className: "t-sm", role: "alert", style: { color: 'var(--danger)' }, children: error }), _jsx("button", { type: "button", className: "btn btn-primary self-end", disabled: !pick || busy, onClick: book, children: busy ? `${t('common.loading')}…` : pick ? t('bk.confirm', { when: `${fmtDay(current)} · ${fmtTime(pick)}` }) : t('bk.pick') })] }))] }) }));
}
