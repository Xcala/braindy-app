import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { NetBadge, netInfo, PostThumb } from '../calendar/PostBits';
import { PostDetail } from '../calendar/PostDetail';
import { useSocialStats } from '../report/useSocialStats';
import { statFor } from '../report/askMore';
import { useSocialPosts } from '../calendar/useSocialPosts';
import { MiniMonth, dayKey } from '../calendar/MiniMonth';
import '../calendar/calendar.css';
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const DOT = { published: 'var(--success)', scheduled: 'var(--azul)', error: '#D93025', draft: 'var(--graphite)' };
/** Calendar: the brand's social media posts, published and scheduled, by month. View only; Metricool publishes. */
export function Calendar() {
    const { current } = useBrands();
    const { t, lang } = useI18n();
    const locale = lang === 'es' ? 'es-CO' : 'en-US';
    const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
    const [net, setNet] = useState('');
    const [open, setOpen] = useState(null);
    const [sel, setSel] = useState(null);
    // Weeks start on Monday; the grid covers whole weeks around the month.
    const start = useMemo(() => { const d = new Date(month); d.setDate(1 - ((d.getDay() + 6) % 7)); return d; }, [month]);
    const end = useMemo(() => { const d = new Date(month.getFullYear(), month.getMonth() + 1, 1); d.setDate(d.getDate() + ((8 - d.getDay()) % 7)); return d; }, [month]);
    const { posts, loading } = useSocialPosts(current?.id, start, end);
    // Numbers next to each published post where Results is on (the rules keep them closed otherwise).
    const stats = useSocialStats(current?.id, !!current?.resultsOn);
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    const nets = [...new Set(posts.flatMap((p) => p.networks.map((n) => n.network)))];
    const shown = net ? posts.filter((p) => p.networks.some((n) => n.network === net)) : posts;
    const byDay = new Map();
    for (const p of shown)
        byDay.set(dayKey(p.date), [...(byDay.get(dayKey(p.date)) ?? []), p]);
    const days = [];
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1))
        days.push(new Date(d));
    const inMonth = shown.filter((p) => p.date.getMonth() === month.getMonth());
    const count = (s) => inMonth.filter((p) => p.status === s).length;
    const today = dayKey(new Date());
    const move = (n) => { setSel(null); setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1)); };
    const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'short' }));
    const time = (d) => d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
    return (_jsxs("div", { className: "col g24", children: [_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", children: current.name }), _jsxs("h1", { className: "h1", children: [_jsxs("span", { className: "w9", children: [t('nav.calendar'), "."] }), " ", t('cal.tagline')] })] }), _jsxs("div", { className: "cal-bar", children: [_jsxs("div", { className: "row g8", children: [_jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => move(-1), "aria-label": t('cal.prev'), children: "\u2039" }), _jsx("h2", { className: "h3 cal-month", "aria-live": "polite", children: cap(month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })) }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => move(1), "aria-label": t('cal.next'), children: "\u203A" }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => { setSel(null); setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); }, children: t('cal.today') })] }), _jsxs("p", { className: "t-sm t-mute", style: { margin: 0 }, children: [_jsx("span", { className: "cal-dot is-published" }), " ", t('cal.nPublished', { n: count('published') }), " \u00B7 ", _jsx("span", { className: "cal-dot is-scheduled" }), " ", t('cal.nScheduled', { n: count('scheduled') }), count('error') > 0 && _jsxs(_Fragment, { children: [" \u00B7 ", _jsx("span", { className: "cal-dot is-error" }), " ", t('cal.nError', { n: count('error') })] })] })] }), nets.length > 1 && (_jsxs("div", { className: "row g8 wrap", role: "group", "aria-label": t('cal.networks'), children: [_jsx("button", { type: "button", className: `btn btn-sm ${!net ? 'btn-primary' : 'btn-secondary'}`, "aria-pressed": !net, onClick: () => setNet(''), children: t('cal.all') }), nets.map((n) => _jsxs("button", { type: "button", className: `btn btn-sm ${net === n ? 'btn-primary' : 'btn-secondary'}`, "aria-pressed": net === n, onClick: () => setNet(net === n ? '' : n), children: [_jsx(NetBadge, { network: n }), " ", netInfo(n).label] }, n))] })), _jsxs("div", { className: "cal-grid", role: "grid", "aria-busy": loading, children: [weekdays.map((w) => _jsx("div", { className: "cal-wd", role: "columnheader", children: w }, w)), days.map((d) => {
                        const list = byDay.get(dayKey(d)) ?? [];
                        return (_jsxs("div", { role: "gridcell", className: `cal-day${d.getMonth() !== month.getMonth() ? ' is-out' : ''}${dayKey(d) === today ? ' is-today' : ''}`, children: [_jsx("span", { className: "cal-num", children: d.getDate() }), list.slice(0, 4).map((p) => (_jsxs("button", { type: "button", className: `cal-post is-${p.status}`, onClick: () => setOpen(p), "aria-label": `${time(p.date)} · ${p.networks.map((n) => netInfo(n.network).label).join(', ')} · ${t(`cal.st.${p.status}`)}`, children: [_jsx(PostThumb, { post: p }), _jsxs("span", { className: "cal-post-meta", children: [_jsx("span", { className: "t-xs", children: time(p.date) }), _jsx("span", { className: "cal-post-nets", children: p.networks.map((n, i) => _jsx(NetBadge, { network: n.network }, i)) })] })] }, p.id))), list.length > 4 && _jsxs("button", { type: "button", className: "cal-more", onClick: () => setOpen(list[4]), children: ["+", list.length - 4] })] }, +d));
                    })] }), _jsx(MiniMonth, { days: days, month: month, selected: sel, onSelect: setSel, dots: new Map([...byDay].map(([k, l]) => [k, l.map((p) => DOT[p.status] ?? DOT.draft)])) }), _jsxs("div", { className: "cal-agenda", children: [!sel && inMonth.length === 0 && !loading && _jsx("div", { className: "card t-mute", children: t('cal.empty') }), (sel ? [sel] : [...new Set(inMonth.map((p) => dayKey(p.date)))]).map((k) => {
                        const list = byDay.get(k) ?? [];
                        return (_jsxs("section", { className: "col g8", children: [_jsx("h3", { className: "label", style: { margin: 0 }, children: list[0].date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }) }), list.map((p) => (_jsxs("button", { type: "button", className: `card cal-row is-${p.status}`, onClick: () => setOpen(p), children: [_jsx(PostThumb, { post: p }), _jsxs("span", { className: "col g4 min-w-0", children: [_jsxs("span", { className: "row g8", children: [_jsx("span", { className: "t-sm w7", children: time(p.date) }), p.networks.map((n, i) => _jsx(NetBadge, { network: n.network }, i))] }), _jsx("span", { className: "t-xs t-mute truncate", children: p.text || p.title || t(`cal.st.${p.status}`) })] })] }, p.id)))] }, k));
                    })] }), inMonth.length === 0 && !loading && _jsx("p", { className: "t-sm t-mute cal-empty-desk", children: t('cal.empty') }), _jsx("p", { className: "t-xs t-mute", children: t('cal.note') }), open && _jsx(PostDetail, { post: open, stat: statFor(stats.list, open), onClose: () => setOpen(null) })] }));
}
