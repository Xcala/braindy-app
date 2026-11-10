import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
import { weekDate } from './text';
/** The schedule at a glance: % delivered, a line from start to end with each delivery as a node (filled once delivered),
 *  where we are today, and what is done vs what is left with the next delivery called out. */
export function ScheduleTrack({ schedule: s }) {
    const { t, lang } = useI18n();
    const locale = lang === 'es' ? 'es-CO' : 'en-US';
    const all = s.groups.flatMap((g) => g.rows);
    // Contract deliveries are the milestones; a schedule without them follows every activity.
    const rows = (all.some((r) => r.milestone) ? all.filter((r) => r.milestone) : all).slice().sort((a, b) => a.to - b.to);
    if (!rows.length || s.weeks <= 0)
        return null;
    const raw = (Date.now() - Date.parse(`${s.start}T00:00:00Z`)) / (7 * 864e5);
    const now = Math.min(Math.max(raw, 0), s.weeks);
    const firstOpen = rows.find((r) => r.status !== 'done');
    const points = rows.map((r) => ({
        ...r,
        state: r.status === 'done' ? 'done' : r.status === 'doing' ? 'doing' : r.to + 1 < raw ? 'due' : r === firstOpen ? 'next' : 'later',
    }));
    const done = points.filter((p) => p.state === 'done');
    const left = points.filter((p) => p.state !== 'done');
    const pct = Math.round((done.length / points.length) * 100);
    const next = left.find((p) => p.state !== 'due') ?? left[0];
    const date = (w) => weekDate(s.start, w, 4).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
    const where = raw < 0 ? t('trk.before', { date: date(0) }) : raw >= s.weeks ? t('trk.after') : t('trk.week', { w: Math.floor(raw) + 1, n: s.weeks });
    const at = (w) => `${Math.min(100, (w / s.weeks) * 100)}%`;
    const list = (items) => (_jsxs("ul", { children: [items.slice(0, 4).map((p) => _jsxs("li", { className: `is-${p.state}`, children: [_jsx("i", {}), p.title] }, p.id)), items.length > 4 && _jsx("li", { className: "trk-more", children: t('trk.more', { n: items.length - 4 }) })] }));
    return (_jsxs("section", { className: "trk", "aria-label": t('trk.label'), children: [_jsxs("div", { className: "trk-top", children: [_jsxs("div", { className: "trk-pct", role: "img", "aria-label": `${pct}% ${t('trk.pct')}`, children: [_jsxs("b", { children: [pct, _jsx("small", { children: "%" })] }), _jsxs("span", { children: [t('trk.pct'), " \u00B7 ", done.length, "/", points.length] })] }), _jsx("span", { className: "trk-where", children: where })] }), _jsxs("div", { className: "trk-line", "aria-hidden": "true", children: [_jsx("span", { className: "trk-rail" }), _jsx("span", { className: "trk-fill", style: { width: at(now) } }), raw >= 0 && raw < s.weeks && _jsx("span", { className: "trk-today", style: { left: at(now) }, children: _jsx("em", { children: t('trk.today') }) }), points.map((p, i) => (
                    // Deliveries due the same week sit side by side instead of on top of each other.
                    _jsx("span", { className: `trk-node is-${p.state}`, style: { left: at(p.to + 1), marginLeft: -11 + points.slice(0, i).filter((q) => q.to === p.to).length * 16 }, title: `${p.title} · ${date(p.to)}`, children: p.state === 'done' && _jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3.2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "m5 12.5 4.5 4.5L19 7.5" }) }) }, p.id)))] }), _jsxs("div", { className: "trk-ends", "aria-hidden": "true", children: [_jsx("span", { children: date(0) }), _jsx("span", { children: date(s.weeks - 1) })] }), next ? (_jsxs("div", { className: "trk-next", children: [_jsx("span", { className: "trk-lbl", children: t('trk.next') }), _jsx("b", { children: next.title }), _jsx("span", { className: "t-sm t-mute", children: t('trk.by', { date: date(next.to) }) })] })) : _jsx("div", { className: "trk-next is-all", children: _jsx("b", { children: t('trk.all') }) }), _jsxs("div", { className: "trk-cols", children: [_jsxs("div", { className: "trk-col", children: [_jsxs("span", { className: "trk-lbl", children: [t('trk.done'), " \u00B7 ", done.length] }), done.length ? list(done) : _jsx("p", { className: "t-sm t-mute", children: "\u2014" })] }), _jsxs("div", { className: "trk-col", children: [_jsxs("span", { className: "trk-lbl", children: [t('trk.left'), " \u00B7 ", left.length] }), left.length ? list(left) : _jsx("p", { className: "t-sm t-mute", children: "\u2014" })] })] })] }));
}
