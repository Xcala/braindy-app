import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
import { money } from '../billing/useBilling';
import { Scan } from '../components/Scan';
const COLOR = {
    web: '#2A7FFF', email: '#8B5CF6', ai: '#06B6D4', automation: '#2F4DE0', social: '#E0428A',
    analytics: '#F5B301', hosting: '#10B981', design: '#F97316', other: '#64748B',
};
const SOON = 30 * 864e5;
/** Block 4 · The third-party apps the brand runs on: what each one does, plan, cost, who pays it and when it renews. */
export function Stack({ items }) {
    const { t, lang } = useI18n();
    if (!items.length)
        return null;
    const date = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    // Monthly equivalent of what is active and recurring, per currency.
    const monthly = items.filter((x) => x.status === 'active' && x.cost && (x.period === 'month' || x.period === 'year'))
        .reduce((a, x) => ({ ...a, [x.currency]: (a[x.currency] ?? 0) + (x.period === 'year' ? x.cost / 12 : x.cost) }), {});
    const order = [...items].sort((a, b) => Number(a.status !== 'active') - Number(b.status !== 'active'));
    return (_jsxs("section", { className: "col g16", "aria-labelledby": "plan-stack", children: [_jsxs("div", { className: "row g16", style: { justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap' }, children: [_jsxs("div", { className: "col g4", children: [_jsx("p", { className: "label", children: t('plan.b4') }), _jsx("h2", { id: "plan-stack", className: "h2", children: t('plan.stackTitle') }), _jsx("p", { className: "t-sm t-mute", style: { margin: 0, maxWidth: 640 }, children: t('plan.stackSub') })] }), Object.keys(monthly).length > 0 && (_jsxs("div", { className: "col", style: { textAlign: 'right' }, children: [_jsx("span", { className: "label", children: t('plan.stackMonthly') }), _jsx("span", { className: "w9", style: { fontSize: 24, lineHeight: '30px' }, children: Object.entries(monthly).map(([cur, v]) => money(Math.round(v), cur, lang)).join(' + ') })] }))] }), _jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: order.map((x, i) => {
                    const soon = !!x.renews && x.status === 'active' && new Date(`${x.renews}T12:00:00`).getTime() - Date.now() < SOON;
                    return (_jsxs("article", { className: "card card-tight col g8", style: { opacity: x.status === 'active' ? 1 : 0.6 }, children: [_jsxs("div", { className: "row g12", style: { alignItems: 'center' }, children: [_jsx("span", { "aria-hidden": true, style: { width: 40, height: 40, borderRadius: 12, background: COLOR[x.category] ?? COLOR.other, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 18, flex: 'none' }, children: x.name.slice(0, 1).toUpperCase() }), _jsxs("div", { className: "col", style: { minWidth: 0, flex: 1 }, children: [x.url ? _jsx("a", { href: x.url, target: "_blank", rel: "noreferrer", className: "w9", style: { color: 'var(--ink)' }, children: x.name }) : _jsx("span", { className: "w9", children: x.name }), _jsxs("span", { className: "t-sm t-mute", children: [t(`plan.cat.${x.category}`), x.plan ? ` · ${x.plan}` : ''] })] })] }), x.purpose && _jsx("p", { className: "t-sm", style: { margin: 0 }, children: x.purpose }), _jsxs("div", { className: "row g8", style: { flexWrap: 'wrap', alignItems: 'center', marginTop: 'auto' }, children: [x.cost != null && _jsxs("span", { className: "w7", children: [money(x.cost, x.currency, lang), " ", _jsx("span", { className: "t-sm t-mute", children: t(`plan.per.${x.period}`) })] }), x.cost == null && x.period === 'usage' && _jsx("span", { className: "t-sm t-mute", children: t('plan.per.usage') }), _jsx("span", { className: "chip", style: x.payer === 'client' ? { background: '#FFFBF0', borderColor: '#F5D98A' } : undefined, children: t(`plan.payer.${x.payer}`) }), x.status !== 'active' && _jsx("span", { className: "chip", children: t(`plan.tool.${x.status}`) })] }), x.renews && _jsx("span", { className: "t-sm", style: { color: soon ? '#B54708' : 'var(--mute, #5B6475)' }, children: t('plan.renews', { date: date(x.renews) }) }), x.note && _jsx(Scan, { text: x.note, points: true })] }, i));
                }) })] }));
}
