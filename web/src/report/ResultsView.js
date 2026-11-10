import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { NetBadge, netInfo } from '../calendar/PostBits';
import { combine, rangeOf } from './socialMath';
import { NetBody } from './SocialResults';
import { WebBody, WebKpis } from './WebResults';
import { SearchBody, SearchKpis } from './SearchResults';
const PERIODS = ['30', '90', 'month', 'lastMonth', '365', 'all'];
/** Page ids, YouTube channel ids and LinkedIn urns are not handles people recognise. */
const realHandle = (h) => !!h && !/^\d|urn:|^UC[\w-]{20,}$/.test(h);
/** Results: one row of tabs — the summary of website and social media first, then the website (Analytics + Google search), then each network — and one period for all of them. */
export function ResultsView({ social, web, search }) {
    const site = !!(web || search);
    const { t, lang } = useI18n();
    const locale = lang === 'es' ? 'es-CO' : 'en-US';
    const all = useMemo(() => (social.length > 1 ? combine(social) : social[0] ?? null), [social]);
    const tabs = [
        ...((site && social.length) || social.length > 1 ? ['sum'] : []),
        ...(site ? ['web'] : []),
        ...social.map((n) => n.network),
    ];
    const [tab, setTab] = useState(tabs[0]);
    const [period, setPeriod] = useState('30');
    const cur = tabs.includes(tab) ? tab : tabs[0];
    const net = social.find((n) => n.network === cur);
    const base = cur === 'web' || !all ? (web ?? search).daily : (net ?? all).daily;
    const range = useMemo(() => rangeOf(period, base).cur, [period, base]);
    const day = (s) => new Date(`${s.slice(0, 10)}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: range.from.slice(0, 4) !== range.to.slice(0, 4) ? 'numeric' : undefined });
    const updated = [...social.map((n) => n.updatedAt), web?.updatedAt, search?.updatedAt].filter(Boolean).sort((a, b) => +b - +a)[0];
    const label = (p) => t(`${p === '365' ? 'web' : 'soc'}.p.${p}`);
    return (_jsxs("section", { className: "col g16", "aria-label": t('rep.title'), children: [_jsxs("div", { className: "row between g12 wrap", children: [_jsxs("p", { className: "t-sm t-mute", children: [t('soc.sub', { from: day(range.from), to: day(range.to) }), updated ? ` · ${t('soc.updated', { d: updated.toLocaleDateString(locale, { day: 'numeric', month: 'short' }) })}` : ''] }), _jsx("select", { className: "input print:hidden", style: { width: 'auto' }, value: period, onChange: (e) => setPeriod(e.target.value), "aria-label": t('soc.period'), children: PERIODS.map((p) => _jsx("option", { value: p, children: label(p) }, p)) })] }), tabs.length > 1 && (_jsx("div", { className: "row g8 wrap", role: "tablist", "aria-label": t('rep.title'), children: tabs.map((id) => {
                    const n = social.find((x) => x.network === id);
                    return (_jsxs("button", { role: "tab", "aria-selected": id === cur, onClick: () => setTab(id), className: `btn btn-sm ${id === cur ? 'btn-primary' : 'btn-secondary'}`, children: [id === 'sum' ? t('res.sum') : id === 'web' ? t('web.title') : _jsxs(_Fragment, { children: [_jsx(NetBadge, { network: id }), " ", netInfo(id).label] }), n && realHandle(n.handle) ? ` · @${n.handle}` : ''] }, id));
                }) })), cur === 'sum' ? (_jsxs(_Fragment, { children: [site && _jsx("h2", { className: "h3", children: t('web.title') }), web && _jsx(WebKpis, { stats: web, period: period, short: true }), search && _jsx(SearchKpis, { stats: search, period: period, short: true }), all && _jsx("h2", { className: "h3", children: t('soc.title') }), all && _jsx(NetBody, { net: all, period: period, chart: false }, `sum-${period}`)] })) : cur === 'web' ? _jsxs(_Fragment, { children: [web && _jsx(WebBody, { stats: web, period: period }), search && _jsx(SearchBody, { stats: search, period: period })] }) : net && _jsx(NetBody, { net: net, period: period }, net.network), _jsx("p", { className: "t-xs t-mute", children: [cur !== 'sum' && cur !== 'web' ? '' : web ? t('web.note') : '', cur !== 'sum' && cur !== 'web' ? '' : search ? t('gsc.note') : '', cur === 'web' ? '' : social.length ? t('soc.note') : ''].filter(Boolean).join(' ') })] }));
}
