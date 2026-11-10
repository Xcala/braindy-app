import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../lib/api';
import { HomeMeetings } from './HomeMeetings';
const stamp = (iso) => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, '');
const googleUrl = (m, brand) => `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(m.title || `Braindy · ${brand}`)}&dates=${stamp(m.start)}/${stamp(m.end ?? m.start)}${m.link ? `&details=${encodeURIComponent(m.link)}&location=${encodeURIComponent(m.link)}` : ''}`;
const icsUrl = (m, brand) => `data:text/calendar;charset=utf-8,${encodeURIComponent([
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Braindy//Home//ES', 'BEGIN:VEVENT', `UID:${stamp(m.start)}-${brand.replace(/\W/g, '')}@braindy.co`,
    `DTSTAMP:${stamp(new Date().toISOString())}`, `DTSTART:${stamp(m.start)}`, `DTEND:${stamp(m.end ?? m.start)}`,
    `SUMMARY:${(m.title || `Braindy · ${brand}`).replace(/[,;\n]/g, ' ')}`, ...(m.link ? [`LOCATION:${m.link}`, `URL:${m.link}`] : []), 'END:VEVENT', 'END:VCALENDAR',
].join('\r\n'))}`;
/** Meetings row: the next meeting (with add-to-my-calendar) and the history with each meeting's notes. */
export function HomeMeetingsRow({ brandId, brandName }) {
    const { t, lang } = useI18n();
    const { profile } = useAuth();
    const admin = profile?.role === 'admin';
    const [next, setNext] = useState(null);
    const [cal, setCal] = useState(null);
    useEffect(() => {
        api(`/v1/brands/${brandId}/meetings/next`).then(setNext).catch(() => setNext({ connected: false, next: null }));
    }, [brandId]);
    useEffect(() => { if (admin)
        api('/v1/admin/calendar').then(setCal).catch(() => setCal(null)); }, [admin]);
    async function connect() {
        const r = await api('/v1/admin/calendar/connect', { method: 'POST', body: '{}' });
        window.location.href = r.url;
    }
    const m = next?.next;
    const start = m?.start ? new Date(m.start) : null;
    return (_jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-4", children: [_jsxs("section", { className: "card col g12 hg-next min-w-0", "aria-labelledby": "h-next", children: [_jsx("h2", { className: "h3", id: "h-next", children: t('hg.next') }), m && start ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "row g12", children: [_jsxs("span", { className: "mdate", "aria-hidden": "true", children: [_jsx("b", { children: start.getDate() }), _jsx("span", { children: start.toLocaleDateString(lang, { month: 'short' }).replace('.', '') })] }), _jsxs("span", { className: "col", style: { minWidth: 0 }, children: [_jsxs("span", { className: "w7", children: [start.toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { weekday: 'long' }), " \u00B7 ", start.toLocaleTimeString(lang === 'es' ? 'es-CO' : 'en-US', { hour: 'numeric', minute: '2-digit' })] }), _jsx("span", { className: "t-xs t-mute truncate", children: m.title })] })] }), m.link && _jsx("a", { className: "btn btn-primary btn-sm", href: m.link, target: "_blank", rel: "noreferrer", children: t('hg.join') }), _jsx("a", { className: "btn btn-secondary btn-sm", href: googleUrl(m, brandName), target: "_blank", rel: "noreferrer", children: t('hg.addGoogle') }), _jsx("a", { className: "t-xs w7", href: icsUrl(m, brandName), download: "braindy-reunion.ics", children: t('hg.addOther') })] })) : _jsx("p", { className: "t-sm t-mute", children: t('hg.noNext') }), admin && cal && !cal.connected && (_jsxs("div", { className: "col g6", style: { borderTop: '1px solid var(--line)', paddingTop: 12 }, children: [cal.ready ? _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: connect, children: t('hg.connectCal') }) : null, _jsx("span", { className: "t-xs t-mute", children: t(cal.ready ? 'hg.connectCalSub' : 'hg.calNotReady') })] }))] }), _jsx("div", { className: "min-w-0 lg:col-span-3", children: _jsx(HomeMeetings, { brandId: brandId, admin: admin }) })] }));
}
