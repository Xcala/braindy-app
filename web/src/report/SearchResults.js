import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { change, inRange, rangeOf } from './socialMath';
import { SocialChart } from './SocialChart';
import { Bars } from './SocialAudience';
const asNet = (s) => s.daily;
/** Clicks and impressions add up by day; the click rate follows from them and the position is weighted by impressions. */
function sum(daily, r) {
    if (!r)
        return null;
    const rows = daily.filter((x) => inRange(x.d, r));
    if (!rows.length)
        return null;
    const clicks = rows.reduce((n, x) => n + (x.clicks ?? 0), 0), impr = rows.reduce((n, x) => n + (x.impr ?? 0), 0);
    const pos = impr ? rows.reduce((n, x) => n + (x.pos ?? 0) * (x.impr ?? 0), 0) / impr : null;
    return { clicks, impr, ctr: impr ? clicks / impr : null, pos };
}
/** Google search numbers for the period vs the period before; short = clicks and impressions, for the summary. */
export function SearchKpis({ stats, period, short }) {
    const { t, lang } = useI18n();
    const locale = lang === 'es' ? 'es-CO' : 'en-US';
    const { cur, prev } = useMemo(() => rangeOf(period, asNet(stats)), [period, stats]);
    const now = sum(stats.daily, cur), before = sum(stats.daily, prev);
    const show = (k, v) => v == null ? '—'
        : k === 'ctr' ? new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(v)
            : new Intl.NumberFormat(locale, { maximumFractionDigits: k === 'pos' ? 1 : 0 }).format(v);
    const kpis = short ? ['clicks', 'impr'] : ['clicks', 'impr', 'ctr', 'pos'];
    return (_jsx("div", { className: "grid gap-4 grid-cols-2 lg:grid-cols-4", children: kpis.map((k) => {
            const v = now?.[k] ?? null, b = before?.[k] ?? null;
            // A lower position is better, so it shows where it was instead of a percentage.
            const note = k === 'pos' ? (b != null ? t('gsc.posPrev', { n: show(k, b) }) : null) : (() => { const p = change(v, b); return p != null ? t('soc.vsPrev', { n: `${p >= 0 ? '+' : ''}${p}%` }) : null; })();
            return (_jsxs("div", { className: "card col g4", children: [_jsx("span", { className: "t-sm t-mute w7", children: t(`gsc.k.${k}`) }), _jsx("span", { className: "h1", children: show(k, v) }), _jsx("span", { className: "t-xs t-mute", children: note ?? t(`gsc.h.${k}`) })] }, k));
        }) }));
}
/** Results › Website › Google search: numbers, a chart and what people searched (top lists are Search Console's for 30, 90 or 365 days). */
export function SearchBody({ stats, period }) {
    const { t, lang } = useI18n();
    const locale = lang === 'es' ? 'es-CO' : 'en-US';
    const { cur } = useMemo(() => rangeOf(period, asNet(stats)), [period, stats]);
    const keys = useMemo(() => new Set(['clicks', 'impr']), []);
    const lp = period === '90' || period === '365' ? period : period === 'all' ? '365' : '30';
    const lists = stats.lists[lp] ?? {};
    const int = (v) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(v);
    const sub = t('web.listsSub', { p: t(`${lp === '365' ? 'web' : 'soc'}.p.${lp}`).toLowerCase() });
    const page = (u) => u.replace(/^https?:\/\/[^/]+/, '') || '/';
    return (_jsxs("section", { className: "col g16", "aria-labelledby": "gsc-title", children: [_jsxs("div", { className: "col g4", children: [_jsx("h2", { id: "gsc-title", className: "h3", children: t('gsc.title') }), _jsx("p", { className: "t-xs t-mute", children: t('gsc.sub') })] }), _jsx(SearchKpis, { stats: stats, period: period }), _jsx(SocialChart, { net: { daily: asNet(stats) }, range: cur, keys: keys, metrics: ['clicks', 'impr'], prefix: "gsc.k" }, `gsc-${period}`), _jsxs("div", { className: "grid gap-4 md:grid-cols-2 items-start", children: [(lists.queries?.length ?? 0) > 0 && _jsx(Bars, { card: true, top: 3, title: t('gsc.queries'), sub: sub, rows: lists.queries, fmt: (n) => t('gsc.clicks', { n: int(n) }) }), (lists.pages?.length ?? 0) > 0 && _jsx(Bars, { card: true, top: 3, title: t('gsc.pages'), sub: sub, rows: lists.pages.map((r) => ({ ...r, name: page(r.name) })), fmt: (n) => t('gsc.clicks', { n: int(n) }) }), (lists.devices?.length ?? 0) > 0 && _jsx(Bars, { card: true, top: 3, title: t('gsc.devices'), rows: lists.devices.map((r) => ({ ...r, name: t(`gsc.dev.${r.name}`) ?? r.name })), fmt: int })] })] }));
}
