import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { weekDate } from './text';
/** Bar colors by kind of work: the Brains' palette, so the schedule reads like the rest of the app. */
export const TONE_COLOR = {
    strategy: '#F5B301', brand: '#06B6D4', content: '#8B5CF6', web: '#2A7FFF', agents: '#2F4DE0', ads: '#E0428A', knowledge: '#10B981',
};
const BY_GROUP = ['brand', 'agents', 'strategy', 'web', 'content', 'knowledge', 'ads'];
const MILESTONE = 'linear-gradient(90deg,#F26B1D,#F7943C)';
const TODAY = '#E0428A';
// The activity column stays put while the weeks scroll; on phones it shrinks so the bars keep room.
const LABEL_W = 'min(240px, 40vw)';
const COL_MIN = 44;
const cell = { borderBottom: '1px solid var(--line)', padding: '8px 10px' };
/** Week (0-based) that contains today, or -1 outside the schedule. */
export const todayWeek = (s) => {
    const w = Math.floor((Date.now() - Date.parse(`${s.start}T00:00:00Z`)) / (7 * 864e5));
    return w >= 0 && w < s.weeks ? w : -1;
};
/** Contract deliveries done vs total. */
export const deliveries = (s) => {
    const ms = s.groups.flatMap((g) => g.rows.filter((r) => r.milestone));
    return { done: ms.filter((r) => r.status === 'done').length, total: ms.length };
};
/** The schedule by week (Anexo 2 of the contract, then the live one): a band of months, one column per week, a bar per
 *  activity colored by kind of work, contract deliveries in orange with ⚡ and a check once delivered, and today's week.
 *  With onStatus (admin) each delivery can be ticked as delivered. */
export function Gantt({ schedule: s, onStatus }) {
    const { t, lang } = useI18n();
    const locale = lang === 'es' ? 'es-CO' : 'en-US';
    const n = s.weeks;
    const today = todayWeek(s);
    const toneOf = (r, gi) => r.tone ?? BY_GROUP[gi % BY_GROUP.length];
    const tones = [...new Set(s.groups.flatMap((g, gi) => g.rows.filter((r) => !r.milestone).map((r) => toneOf(r, gi))))];
    const months = [];
    for (let w = 0; w < n; w++) {
        const label = weekDate(s.start, w).toLocaleDateString(locale, { month: 'short', year: '2-digit', timeZone: 'UTC' });
        if (months.at(-1)?.label === label)
            months.at(-1).span++;
        else
            months.push({ label, span: 1 });
    }
    const grid = { display: 'grid', gridTemplateColumns: `${LABEL_W} repeat(${n}, minmax(${COL_MIN}px, 1fr))`, minWidth: `calc(${LABEL_W} + ${n * COL_MIN}px)` };
    const sticky = { position: 'sticky', left: 0, zIndex: 2, background: 'var(--white)', borderRight: '1px solid var(--line)' };
    const head = { ...cell, background: 'var(--niebla)', textAlign: 'center', padding: '6px 2px' };
    const wd = t(`ctr.wd.${s.meeting.weekday}`);
    return (_jsxs("div", { className: "col g12", children: [_jsxs("div", { className: "row g16 t-sm", style: { flexWrap: 'wrap' }, "aria-label": t('plan.legend'), children: [tones.map((k) => _jsxs("span", { className: "row g8", children: [_jsx("i", { style: { width: 22, height: 10, borderRadius: 4, background: TONE_COLOR[k] } }), t(`plan.tone.${k}`)] }, k)), _jsxs("span", { className: "row g8", children: [_jsx("i", { style: { width: 22, height: 10, borderRadius: 4, background: MILESTONE } }), t('ctr.milestone')] }), today >= 0 && _jsxs("span", { className: "row g8", children: [_jsx("i", { style: { width: 2, height: 14, background: TODAY } }), t('plan.today')] })] }), _jsx("div", { className: "card", style: { padding: 0, overflowX: 'auto' }, role: "region", "aria-label": t('ctr.gantt'), tabIndex: 0, children: _jsxs("div", { role: "table", "aria-label": t('ctr.gantt'), style: grid, children: [_jsxs("div", { role: "row", style: { display: 'contents' }, children: [_jsx("div", { role: "columnheader", className: "label", style: { ...cell, ...sticky, background: 'var(--niebla)', gridRow: 'span 2', display: 'flex', alignItems: 'flex-end' }, children: t('plan.activity') }), months.map((m, i) => _jsx("div", { role: "columnheader", className: "label", style: { ...head, gridColumn: `span ${m.span}`, color: 'var(--azul)', borderLeft: i ? '1px solid var(--line)' : undefined }, children: m.label }, i))] }), _jsx("div", { role: "row", style: { display: 'contents' }, children: Array.from({ length: n }, (_, w) => (_jsxs("div", { role: "columnheader", style: { ...head, background: w === today ? '#FDEFF5' : 'var(--niebla)' }, children: [_jsx("div", { className: "w9", style: { fontSize: 12, color: w === today ? '#C2185B' : 'var(--ink)' }, children: t('ctr.weekShort', { n: w + 1 }) }), _jsx("div", { className: "t-mute", style: { fontSize: 10 }, children: weekDate(s.start, w).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }) })] }, w))) }), _jsxs("div", { role: "row", style: { display: 'contents' }, children: [_jsxs("div", { role: "rowheader", style: { ...cell, ...sticky }, children: [_jsx("div", { className: "w7 t-sm", children: t('plan.meeting', { minutes: s.meeting.minutes }) }), _jsxs("div", { className: "t-mute", style: { fontSize: 12 }, children: [wd, " \u00B7 ", s.meeting.time] })] }), Array.from({ length: n }, (_, w) => _jsx("div", { role: "cell", style: { ...cell, padding: '8px 3px', display: 'flex', justifyContent: 'center', alignItems: 'center' }, children: _jsx("i", { "aria-hidden": "true", style: { width: 8, height: 8, borderRadius: 99, background: w < today ? '#9DB0FF' : '#C9D3FF', border: w === today ? `2px solid ${TODAY}` : undefined } }) }, w))] }), s.groups.map((g, gi) => (_jsxs(Fragment, { children: [_jsxs("div", { role: "row", style: { display: 'contents' }, children: [_jsx("div", { role: "rowheader", className: "label", style: { ...cell, ...sticky, background: '#F8F9FC', color: 'var(--azul)' }, children: g.title }), _jsx("div", { style: { ...cell, gridColumn: `span ${n}`, background: '#F8F9FC' } })] }), g.rows.map((r, ri) => _jsx(Bar, { r: r, n: n, today: today, fill: r.milestone ? MILESTONE : TONE_COLOR[toneOf(r, gi)], sticky: sticky, onDone: onStatus && r.milestone ? (d) => onStatus(gi, ri, d ? 'done' : 'pending') : undefined }, r.id))] }, g.id)))] }) })] }));
}
function Bar({ r, n, today, fill, sticky, onDone }) {
    const { t } = useI18n();
    const done = r.status === 'done';
    const late = r.milestone && !done && today > r.to;
    const text = r.milestone ? `${done ? '✓ ' : ''}${r.label ?? ''}` : r.label ?? (done ? '✓' : '');
    const status = r.status === 'blocked' ? { color: '#B42318', text: t('ctr.st.blocked') } : done ? { color: '#0E8A5F', text: t('ctr.delivered') } : late ? { color: '#B45309', text: t('plan.inReview') } : null;
    return (_jsxs("div", { role: "row", style: { display: 'contents' }, children: [_jsx("div", { role: "rowheader", style: { ...cell, ...sticky }, children: _jsxs("div", { className: "row g8", style: { alignItems: 'flex-start' }, children: [r.milestone && _jsx("span", { "aria-hidden": "true", style: { color: '#F26B1D' }, children: "\u26A1" }), _jsxs("div", { className: "col", style: { minWidth: 0 }, children: [_jsx("span", { className: `t-sm ${r.milestone ? 'w9' : 'w7'}`, children: r.title }), r.note && _jsx("span", { className: "t-mute", style: { fontSize: 12, lineHeight: '16px' }, children: r.note }), onDone ? (_jsxs("label", { className: "row g4", style: { fontSize: 12, marginTop: 4, cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: done, onChange: (e) => onDone(e.target.checked) }), t('ctr.delivered')] })) : status && _jsx("span", { className: "w7", style: { fontSize: 12, marginTop: 2, color: status.color }, children: status.text })] })] }) }), _jsxs("div", { role: "cell", style: { ...cell, gridColumn: `span ${n}`, display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, alignItems: 'center', padding: '8px 0', position: 'relative' }, children: [today >= 0 && _jsx("i", { "aria-hidden": "true", style: { position: 'absolute', top: 0, bottom: 0, left: `${((today + 0.5) / n) * 100}%`, width: 2, background: TODAY, opacity: 0.5 } }), _jsx("div", { title: `${r.title} · ${t(`ctr.st.${r.status}`)}`, style: {
                            gridColumn: `${r.from + 1} / ${r.to + 2}`, height: 24, margin: '0 3px', borderRadius: 6, background: fill,
                            opacity: r.status === 'pending' && !r.milestone ? 0.75 : 1, outline: r.status === 'blocked' ? '2px solid #B42318' : undefined,
                            color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: r.milestone ? '0 4px 14px rgba(242,107,29,.35)' : undefined, whiteSpace: 'nowrap', overflow: 'hidden',
                        }, children: text })] })] }));
}
