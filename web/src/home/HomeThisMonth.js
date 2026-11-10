import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { BrainStack } from '../components/BrainStack';
import { useSocialPosts } from '../calendar/useSocialPosts';
import { useSiteChanges } from '../links/SiteChanges';
const ms = (x) => x?.toMillis?.() ?? 0;
/**
 * "The work, done": the month in three numbers, what was delivered, published and adjusted, signed by NickMark
 * with his Brains. The client sees the outcome, not the tools. Hidden while the month is still empty.
 */
export function HomeThisMonth({ brandId, requests }) {
    const { t } = useI18n();
    const [from, to] = useMemo(() => { const d = new Date(); return [new Date(d.getFullYear(), d.getMonth(), 1), new Date(d.getFullYear(), d.getMonth() + 1, 1)]; }, []);
    const { posts } = useSocialPosts(brandId, from, to);
    const changes = useSiteChanges(brandId);
    const since = +from;
    const delivered = requests.filter((r) => r.status !== 'in_production' && ms(r.updatedAt) >= since).length;
    const published = posts.filter((p) => p.status === 'published').length;
    const scheduled = posts.filter((p) => p.status === 'scheduled').length;
    const adjusted = changes.filter((c) => c.status === 'delivered' && ms(c.updatedAt) >= since).length;
    if (!delivered && !published && !scheduled && !adjusted)
        return null;
    const all = [
        { n: delivered, k: delivered === 1 ? 'tm.deliveredOne' : 'tm.delivered', to: '/requests' },
        { n: published, k: published === 1 ? 'tm.publishedOne' : 'tm.published', to: '/calendar', sub: scheduled ? t('tm.scheduled', { n: scheduled }) : '' },
        { n: adjusted, k: adjusted === 1 ? 'tm.adjustedOne' : 'tm.adjusted', to: '/apps' },
    ];
    const stats = all.filter((s) => s.n || s.sub);
    return (_jsxs("section", { className: "card col g16", "aria-labelledby": "h-month", children: [_jsxs("div", { className: "row between g12 wrap", children: [_jsxs("div", { className: "col g4", children: [_jsx("p", { className: "label", children: t('tm.label') }), _jsx("h2", { className: "h3", id: "h-month", style: { margin: 0 }, children: _jsx("span", { className: "w9", children: t('tm.title') }) })] }), _jsx(BrainStack, { label: t('tm.sign') })] }), _jsx("div", { className: "grid gap-4 sm:grid-cols-3", children: stats.map((s) => (_jsxs(Link, { to: s.to, className: "col g4", style: { textDecoration: 'none', color: 'var(--ink)' }, children: [_jsx("span", { className: "w9", style: { fontSize: 40, lineHeight: '44px', letterSpacing: '-.03em' }, children: s.n }), _jsx("span", { className: "t-sm w7", children: t(s.k) }), s.sub && _jsx("span", { className: "t-xs t-mute", children: s.sub })] }, s.k))) })] }));
}
