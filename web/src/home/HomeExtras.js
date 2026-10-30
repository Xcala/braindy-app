import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useReports } from '../report/useReports';
/** Home · results this month (from the latest published report), design 12. */
export function ResultsCard({ brandId }) {
    const { t, lang } = useI18n();
    const r = useReports(brandId, false)[0];
    const money = (v) => v == null ? '—' : new Intl.NumberFormat(lang === 'es' ? 'es-CO' : 'en-US', { style: 'currency', currency: r?.currency || 'COP', maximumFractionDigits: 0, notation: 'compact' }).format(v);
    return (_jsxs(Link, { to: "/report", className: "card col g12", style: { textDecoration: 'none', color: 'var(--ink)' }, children: [_jsxs("div", { className: "row between", children: [_jsx("h2", { className: "h3", children: t('home.results') }), _jsx("span", { className: "chip chip-plain", children: "Marketer" })] }), r ? (_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "col", children: [_jsx("span", { className: "h2", children: r.leads ?? '—' }), _jsx("span", { className: "t-xs t-mute", children: t('rep.leads') })] }), _jsxs("div", { className: "col", children: [_jsx("span", { className: "h2", children: money(r.salesAttributed) }), _jsx("span", { className: "t-xs t-mute", children: t('rep.sales') })] })] })) : _jsx("p", { className: "t-sm t-mute", children: t('rep.none') }), _jsx("span", { className: "t-xs t-mute", children: t('home.salesNotLikes') })] }));
}
/** Home · "Approvals by WhatsApp are on" when the brand has a review number. */
export function WhatsappCard({ brandId }) {
    const { t } = useI18n();
    const s = useBrandDoc(brandId, 'settings/notices');
    const n = s.data;
    const on = !!n?.whatsapp && n.notices?.delivery !== false;
    return (_jsxs(Link, { to: "/settings", "data-tour": "home-wa", className: "card row g12", style: { textDecoration: 'none', color: 'var(--ink)', background: on ? '#E9F7EF' : undefined, border: on ? 0 : undefined }, children: [_jsx("svg", { viewBox: "0 0 24 24", width: "20", height: "20", fill: "none", stroke: on ? '#0E7A4E' : 'currentColor', strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M5 5h14v10H10l-4 4v-4H5z" }) }), _jsxs("span", { className: "col", children: [_jsx("span", { className: "t-sm w7", children: t(on ? 'home.waOn' : 'home.waOff') }), _jsx("span", { className: "t-xs t-mute", children: t(on ? 'home.waOnSub' : 'home.waOffSub') })] })] }));
}
/** Day 11 (design 17): for two weeks after going live, Home opens with "your brand system is live". */
export function LiveBanner({ liveAt }) {
    const { t } = useI18n();
    if (!liveAt || Date.now() - liveAt.getTime() > 14 * 864e5)
        return null;
    return (_jsxs("section", { className: "stage col g12 rounded-[20px] p-6 sm:p-9", "aria-labelledby": "h-live", children: [_jsx("p", { className: "label", children: t('home.liveKicker') }), _jsxs("h1", { className: "d-lg", id: "h-live", style: { color: '#fff' }, children: [_jsx("span", { className: "w9", children: t('home.live1') }), " ", t('home.live2')] }), _jsx("p", { className: "t-lg muted", children: t('home.liveSub') })] }));
}
