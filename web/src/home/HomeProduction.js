import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { useBrands } from '../brands/BrandProvider';
import { TeamAtWork } from '../requests/TeamAtWork';
import { SLA_HOURS, addBusinessHours, businessMsBetween } from '../lib/businessHours';
/** When it is due: the plan's date when NickMark set a later one (big projects), otherwise 48 business hours from the request. */
function clock(r, now) {
    const asked = r.createdAt?.toMillis?.() ?? now;
    const sla = addBusinessHours(asked, SLA_HOURS);
    const planned = r.dueDate ? Date.parse(`${r.dueDate}T18:00:00-05:00`) : NaN;
    const due = Number.isFinite(planned) && planned > sla ? planned : sla;
    const total = Math.max(1, businessMsBetween(asked, due));
    const used = businessMsBetween(asked, now);
    return { asked, due, share: Math.min(1, used / total), late: now > due, leftH: Math.max(0, Math.ceil((total - used) / 3600_000)) };
}
/** In production: the 48-business-hour promise up top, then one card per piece with its own clock (the first four; the rest in Requests). */
const FIRST = 4;
export function HomeProduction({ items }) {
    const { t, lang } = useI18n();
    const { current, select } = useBrands();
    const now = Date.now();
    const fmt = (ms) => new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' }).format(ms);
    return (_jsxs("section", { className: "col g16", "aria-labelledby": "h-prod", "data-tour": "home-prod", children: [_jsxs("div", { className: "col g4", children: [_jsx("h2", { className: "h3", id: "h-prod", children: t('hg.prod') }), _jsx("p", { className: "t-sm t-mute", children: t('hg.prodSub') })] }), items.length === 0 && _jsx("div", { className: "card t-mute", children: t('hg.nothingProd') }), _jsx("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: items.slice(0, FIRST).map((r) => {
                    const c = clock(r, now);
                    const tone = c.late ? 'late' : c.share > 0.75 ? 'near' : 'ok';
                    return (_jsxs(Link, { to: `/requests/${r.id}`, onClick: () => current?.id !== r.brandId && select(r.brandId), className: "card col g12 hg-prod min-w-0", style: { textDecoration: 'none', color: 'var(--ink)' }, children: [_jsxs("div", { className: "row g12", children: [_jsxs("div", { className: "col grow", style: { minWidth: 0 }, children: [_jsx("span", { className: "w7 truncate", children: r.title }), _jsx(TeamAtWork, { r: r, compact: true })] }), _jsx("span", { className: `hg-left is-${tone}`, children: c.late ? '!' : t('hg.left', { h: c.leftH }) })] }), _jsx("div", { className: `hg-bar is-${tone}`, role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": Math.round(c.share * 100), "aria-label": t('hg.dueBy', { when: fmt(c.due) }), children: _jsx("i", { style: { width: `${Math.max(4, c.share * 100)}%` } }) }), _jsxs("div", { className: "row between g8 wrap t-xs", children: [_jsx("span", { className: "t-mute", children: t('hg.asked', { when: fmt(c.asked) }) }), _jsx("span", { className: "w7", style: c.late ? { color: 'var(--danger)' } : undefined, children: t(c.late ? 'hg.late' : 'hg.dueBy', { when: fmt(c.due) }) })] })] }, `${r.brandId}/${r.id}`));
                }) }), items.length > FIRST && _jsxs(Link, { to: "/requests", className: "t-sm w7 self-start", style: { color: 'var(--azul)' }, children: [t('home.seeAll'), " (", items.length, ") \u2192"] })] }));
}
