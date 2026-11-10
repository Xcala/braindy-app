import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { change, followersAt, keysOf, postsIn, rangeOf, total } from './socialMath';
import { SocialChart } from './SocialChart';
import { SocialPosts } from './SocialPosts';
import { SocialAudience } from './SocialAudience';
/** The numbers on top, in this order; a network only shows the ones it has. */
const KPIS = ['followers', 'views', 'reach', 'interactions', 'engaged', 'pageViews'];
/** One network (or all of them added up) for the period: numbers vs the period before, a chart, the posts that worked best and the audience. */
export function NetBody({ net, period, chart = true }) {
    const { t, lang } = useI18n();
    const locale = lang === 'es' ? 'es-CO' : 'en-US';
    const { cur, prev } = useMemo(() => rangeOf(period, net.daily), [period, net]);
    const keys = useMemo(() => keysOf(net.daily), [net]);
    const fmt = (v) => (v == null ? '—' : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(v));
    const posts = postsIn(net.posts, cur);
    const published = posts.filter((p) => p.type !== 'story').length;
    const stories = posts.length - published;
    const startF = followersAt(net.daily, cur);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid gap-4 grid-cols-2 lg:grid-cols-4", children: [KPIS.filter((k) => keys.has(k)).map((k) => {
                        const now = total(net.daily, k, cur);
                        const before = k === 'followers' ? startF : prev ? total(net.daily, k, prev) : null;
                        const diff = k === 'followers' && now != null && before != null ? now - before : null;
                        const pct = k === 'followers' ? null : change(now, before);
                        return (_jsxs("div", { className: "card col g4", children: [_jsx("span", { className: "t-sm t-mute w7", children: t(`soc.k.${k}`) }), _jsx("span", { className: "h1", children: fmt(now) }), _jsx("span", { className: "t-xs t-mute", children: diff != null ? t('soc.fDiff', { n: `${diff >= 0 ? '+' : ''}${fmt(diff)}` }) : pct != null ? t('soc.vsPrev', { n: `${pct >= 0 ? '+' : ''}${pct}%` }) : t(`soc.h.${k}`) })] }, k));
                    }), _jsxs("div", { className: "card col g4", children: [_jsx("span", { className: "t-sm t-mute w7", children: t('soc.k.posts') }), _jsx("span", { className: "h1", children: fmt(published) }), _jsx("span", { className: "t-xs t-mute", children: stories ? t('soc.plusStories', { n: fmt(stories) }) : t('soc.h.posts') })] })] }), chart && _jsx(SocialChart, { net: net, range: cur, keys: keys }, net.network), _jsx(SocialPosts, { posts: posts, network: net.network }), net.audience && _jsx(SocialAudience, { audience: net.audience })] }));
}
