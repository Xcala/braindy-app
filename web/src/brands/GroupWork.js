import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
import { useBrandsRequests } from '../requests/useBrandsRequests';
import { BrandMark } from './BrandMark';
import { useBrands } from './BrandProvider';
/** Global view of a group: the work of every brand below it, side by side (multi-brand clients). */
export function GroupWork({ group, all }) {
    const { t } = useI18n();
    const { select } = useBrands();
    const below = all.filter((b) => b.groupId === group.id || all.find((p) => p.id === b.groupId)?.groupId === group.id);
    const reqs = useBrandsRequests([group.id, ...below.map((b) => b.id)]);
    const rows = [group, ...below].map((b) => {
        const r = reqs.filter((x) => x.brandId === b.id);
        return { b, prod: r.filter((x) => x.status === 'in_production').length, approve: r.filter((x) => x.status === 'to_approve').length, done: r.filter((x) => x.status === 'approved' || x.status === 'published').length };
    });
    const total = rows.reduce((n, r) => ({ prod: n.prod + r.prod, approve: n.approve + r.approve, done: n.done + r.done }), { prod: 0, approve: 0, done: 0 });
    return (_jsxs("div", { className: "col g16", children: [_jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { className: "card card-tight col", children: [_jsx("span", { className: "h2", children: total.prod }), _jsx("span", { className: "t-xs t-mute", children: t('req.status.in_production') })] }), _jsxs("div", { className: "card card-tight col", style: total.approve ? { borderColor: '#F5D98A', background: '#FFFBF0' } : undefined, children: [_jsx("span", { className: "h2", children: total.approve }), _jsx("span", { className: "t-xs t-mute", children: t('req.status.to_approve') })] }), _jsxs("div", { className: "card card-tight col", children: [_jsx("span", { className: "h2", children: total.done }), _jsx("span", { className: "t-xs t-mute", children: t('group.delivered') })] })] }), _jsxs("div", { className: "table overflow-x-auto", children: [_jsxs("div", { className: "trow head label min-w-[560px]", style: { gridTemplateColumns: 'minmax(0,1fr) 120px 120px 120px' }, children: [_jsx("span", { children: t('admin.brands.colBrand') }), _jsx("span", { children: t('req.status.in_production') }), _jsx("span", { children: t('req.status.to_approve') }), _jsx("span", { children: t('group.delivered') })] }), rows.map(({ b, prod, approve, done }) => (_jsxs("div", { className: "trow min-w-[560px]", style: { gridTemplateColumns: 'minmax(0,1fr) 120px 120px 120px', minHeight: 56 }, children: [_jsxs("button", { className: "row g12 text-left", style: { background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)' }, onClick: () => { select(b.id); window.scrollTo({ top: 0 }); }, children: [_jsx("span", { className: "sel", style: { border: 0, height: 'auto', padding: 0, background: 'none' }, children: _jsx(BrandMark, { brand: b }) }), _jsx("span", { className: `truncate ${b.kind === 'group' ? 'w9' : 'w7'}`, children: b.name })] }), _jsx("span", { children: prod }), _jsx("span", { style: approve ? { color: 'var(--warning)', fontWeight: 700 } : undefined, children: approve }), _jsx("span", { children: done })] }, b.id)))] })] }));
}
