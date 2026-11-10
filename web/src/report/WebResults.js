import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { change, inRange, rangeOf } from './socialMath';
import { SocialChart } from './SocialChart';
import { Bars } from './SocialAudience';
const CHART = ['users', 'sessions', 'views', 'keyEvents'];
const KPIS = ['users', 'newUsers', 'sessions', 'views', 'engRate', 'engTime', 'keyEvents'];
const SHORT = ['users', 'sessions', 'views', 'keyEvents'];
const asNet = (s) => s.daily;
const isGa = (p) => p === '30' || p === '90' || p === '365';
/** Visits, views and actions add up day by day; visitors don't, so they (and time per visitor) come from GA's own totals for 30/90/365 days. */
function sum(daily, r) {
    if (!r)
        return null;
    const rows = daily.filter((x) => inRange(x.d, r));
    if (!rows.length)
        return null;
    const add = (k) => rows.reduce((n, x) => n + (x[k] ?? 0), 0);
    return { sessions: add('sessions'), views: add('views'), engaged: add('engaged'), keyEvents: add('keyEvents'), newUsers: add('newUsers') };
}
function value(k, x) {
    if (!x)
        return null;
    if (k === 'engRate')
        return x.sessions ? (x.engaged ?? 0) / x.sessions : null;
    if (k === 'engTime')
        return x.users ? (x.engTime ?? 0) / x.users : null;
    return x[k] ?? null;
}
/** The website numbers for the period vs the period before; short = the four that go in the summary. */
export function WebKpis({ stats, period, short }) {
    const { t, lang } = useI18n();
    const locale = lang === 'es' ? 'es-CO' : 'en-US';
    const { cur, prev } = useMemo(() => rangeOf(period, asNet(stats)), [period, stats]);
    const ga = isGa(period) ? stats.totals[period] : undefined;
    const now = ga?.cur ?? sum(stats.daily, cur), before = ga ? ga.prev : sum(stats.daily, prev);
    const show = (k, v) => v == null ? '—'
        : k === 'engRate' ? new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(v)
            : k === 'engTime' ? `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, '0')} min` : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(v);
    const kpis = (short ? SHORT : KPIS).filter((k) => value(k, now) != null && (k !== 'keyEvents' || (now?.keyEvents ?? 0) > 0));
    return (_jsx("div", { className: "grid gap-4 grid-cols-2 lg:grid-cols-4", children: kpis.map((k) => {
            const v = value(k, now), pct = change(v, value(k, before));
            return (_jsxs("div", { className: "card col g4", children: [_jsx("span", { className: "t-sm t-mute w7", children: t(`web.k.${k}`) }), _jsx("span", { className: "h1", children: show(k, v) }), _jsx("span", { className: "t-xs t-mute", children: pct != null ? t('soc.vsPrev', { n: `${pct >= 0 ? '+' : ''}${pct}%` }) : t(`web.h.${k}`) })] }, k));
        }) }));
}
/** Results › Website: numbers, a chart and where visitors come from (top lists are GA's for 30, 90 or 365 days, the closest to the period). */
export function WebBody({ stats, period }) {
    const { t, lang } = useI18n();
    const locale = lang === 'es' ? 'es-CO' : 'en-US';
    const { cur } = useMemo(() => rangeOf(period, asNet(stats)), [period, stats]);
    const keys = useMemo(() => new Set(stats.daily.flatMap((x) => Object.keys(x).filter((k) => k !== 'd' && x[k] != null))), [stats]);
    const lp = isGa(period) ? period : period === 'all' ? '365' : '30';
    const lists = stats.lists[lp] ?? {};
    const int = (v) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(v);
    // GA names channels and devices in English; known ones are translated, the rest show as GA says.
    const named = (prefix, rows = []) => rows.map((r) => ({ name: t(`${prefix}.${r.name}`) ?? r.name, n: r.n }));
    const sub = t('web.listsSub', { p: t(`${lp === '365' ? 'web' : 'soc'}.p.${lp}`).toLowerCase() });
    return (_jsxs(_Fragment, { children: [_jsx(WebKpis, { stats: stats, period: period }), _jsx(SocialChart, { net: { daily: asNet(stats) }, range: cur, keys: keys, metrics: CHART, prefix: "web.k" }, `web-${period}`), _jsxs("div", { className: "grid gap-4 md:grid-cols-2 items-start", children: [(lists.pages?.length ?? 0) > 0 && _jsx(Bars, { card: true, top: 3, title: t('web.pages'), sub: sub, rows: lists.pages, fmt: (n) => t('web.views', { n: int(n) }) }), (lists.channels?.length ?? 0) > 0 && _jsx(Bars, { card: true, top: 3, title: t('web.channels'), sub: sub, rows: named('web.ch', lists.channels), fmt: int }), (lists.sources?.length ?? 0) > 0 && _jsx(Bars, { card: true, top: 3, title: t('web.sources'), rows: lists.sources, fmt: int }), (lists.countries?.length ?? 0) > 0 && _jsx(Bars, { card: true, top: 3, title: t('web.countries'), rows: lists.countries, fmt: int }), (lists.cities?.length ?? 0) > 0 && _jsx(Bars, { card: true, top: 3, title: t('web.cities'), rows: lists.cities, fmt: int }), (lists.devices?.length ?? 0) > 0 && _jsx(Bars, { card: true, top: 3, title: t('web.devices'), rows: named('web.dev', lists.devices), fmt: int })] })] }));
}
