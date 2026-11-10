import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { toDay } from '../lib/dates';
import { isLate } from './requestFilters';
import { MiniMonth, dayKey } from '../calendar/MiniMonth';
import '../calendar/calendar.css';
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const COLOR = { in_production: 'var(--azul)', to_approve: '#E0A100', approved: 'var(--success)', published: 'var(--ink)' };
const color = (r) => (isLate(r) ? '#D93025' : COLOR[r.status]);
/** Deliveries by due date, the same month grid as the social calendar (a small month and the agenda on phones). */
export function DueCalendar({ shown }) {
    const { t, lang } = useI18n();
    const locale = lang === 'es' ? 'es-CO' : 'en-US';
    const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
    const [sel, setSel] = useState(null);
    const start = useMemo(() => { const d = new Date(month); d.setDate(1 - ((d.getDay() + 6) % 7)); return d; }, [month]);
    const end = useMemo(() => { const d = new Date(month.getFullYear(), month.getMonth() + 1, 1); d.setDate(d.getDate() + ((8 - d.getDay()) % 7)); return d; }, [month]);
    const byDay = new Map();
    for (const r of shown) {
        const d = toDay(r.dueDate);
        if (d)
            byDay.set(dayKey(d), [...(byDay.get(dayKey(d)) ?? []), r]);
    }
    const days = [];
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1))
        days.push(new Date(d));
    const inMonth = shown.filter((r) => { const d = toDay(r.dueDate); return d && d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear(); });
    const noDate = shown.filter((r) => !r.dueDate).length;
    const today = dayKey(new Date());
    const move = (n) => { setSel(null); setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1)); };
    const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'short' }));
    const item = (r, big = false) => (_jsx(Link, { to: `/requests/${r.id}`, className: big ? 'card cal-row' : 'cal-post', style: { '--c': color(r), textDecoration: 'none', padding: big ? undefined : '4px 6px' }, title: `${r.title} · ${t(`req.status.${r.status}`)}`, children: _jsxs("span", { className: "col min-w-0", style: { gap: 2 }, children: [_jsx("span", { className: `${big ? 't-sm' : 't-xs'} w7 truncate`, children: r.title }), _jsx("span", { className: "t-xs t-mute truncate", children: isLate(r) ? t('rf.tab.late') : t(`req.status.${r.status}`) })] }) }, r.id));
    return (_jsxs("div", { className: "col g16", children: [_jsxs("div", { className: "cal-bar", children: [_jsxs("div", { className: "row g8", children: [_jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => move(-1), "aria-label": t('cal.prev'), children: "\u2039" }), _jsx("h3", { className: "h3 cal-month", "aria-live": "polite", children: cap(month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })) }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => move(1), "aria-label": t('cal.next'), children: "\u203A" }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => { setSel(null); setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); }, children: t('cal.today') })] }), _jsxs("p", { className: "t-sm t-mute", style: { margin: 0 }, children: [t('rv.dueThisMonth', { n: inMonth.length }), noDate ? ` · ${t('rv.noDate', { n: noDate })}` : ''] })] }), _jsxs("div", { className: "cal-grid", role: "grid", children: [weekdays.map((w) => _jsx("div", { className: "cal-wd", role: "columnheader", children: w }, w)), days.map((d) => {
                        const list = byDay.get(dayKey(d)) ?? [];
                        return (_jsxs("div", { role: "gridcell", className: `cal-day${d.getMonth() !== month.getMonth() ? ' is-out' : ''}${dayKey(d) === today ? ' is-today' : ''}`, children: [_jsx("span", { className: "cal-num", children: d.getDate() }), list.slice(0, 3).map((r) => item(r)), list.length > 3 && _jsxs("span", { className: "cal-more", children: ["+", list.length - 3] })] }, +d));
                    })] }), _jsx(MiniMonth, { days: days, month: month, selected: sel, onSelect: setSel, dots: new Map([...byDay].map(([k, l]) => [k, l.map(color)])) }), _jsxs("div", { className: "cal-agenda", children: [!sel && inMonth.length === 0 && _jsx("div", { className: "card t-mute", children: t('rv.noneThisMonth') }), (sel ? [sel] : [...new Set(inMonth.map((r) => dayKey(toDay(r.dueDate))))]).map((k) => {
                        const list = byDay.get(k) ?? [];
                        return (_jsxs("section", { className: "col g8", children: [_jsx("h4", { className: "label", style: { margin: 0 }, children: toDay(list[0].dueDate).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }) }), list.map((r) => item(r, true))] }, k));
                    })] })] }));
}
