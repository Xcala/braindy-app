import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { logoDomain } from './AppLogo';
import { AccessRow, COL_LABEL, gridFor, priceLabel } from './AccessRow';
import { AccessCard } from './AccessCard';
import { groupApps, groupKey, matches, monthlyTotals, passes, sortApps } from './appsView';
import { useDragOrder } from './useDragOrder';
import { accessesApi } from './useAccesses';
import './apps.css';
const money = (list, t, lang) => [...monthlyTotals(list)].map(([cur, v]) => priceLabel(Math.round(v * 100) / 100, cur, 'month', t, lang)).join(' + ');
/** The apps as a table or a grid, searched, filtered, sorted and grouped; drag to reorder in «My order». */
export function AppsList({ brandId, list, view, q, cols, onEdit, onClear }) {
    const { t, lang } = useI18n();
    // The dragged order shows at once; the live list replaces it when the save comes back.
    const [local, setLocal] = useState(null);
    useEffect(() => setLocal(null), [list]);
    const ordered = useMemo(() => {
        if (!local)
            return list;
        const at = new Map(local.ids.map((id, i) => [id, i]));
        return list.map((a) => ({ ...a, order: at.get(a.id) ?? a.order, group: local.groups[a.id] ?? a.group }));
    }, [list, local]);
    const shown = sortApps(ordered.filter((a) => passes(a, view.filter) && (!q.trim() || matches(a, q))), view.sort);
    const groups = groupApps(shown, view.groupBy, t);
    const canDrag = view.sort === 'manual' && view.filter === 'all' && !q.trim() && view.groupBy !== 'signIn' && view.groupBy !== 'account';
    const flat = groups.flatMap((g) => g.items.map((a) => ({ a, group: view.groupBy === 'group' ? groupKey(a, 'group') : null })));
    const drag = useDragOrder(flat, canDrag, (ids, moved) => {
        setLocal({ ids, groups: moved });
        accessesApi.reorder(brandId, ids, moved).catch(() => setLocal(null));
    });
    if (shown.length === 0 && list.length > 0) {
        return _jsxs("div", { className: "card row between g12 wrap", children: [_jsx("span", { className: "t-mute", children: t('apps.noMatch') }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: onClear, children: t('apps.clear') })] });
    }
    const head = (g) => g.label && (_jsxs("div", { className: "apps-ghead", children: [_jsx("span", { className: "w7", children: g.label }), _jsxs("span", { className: "t-xs t-mute", children: [g.items.length === 1 ? t('apps.countOne') : t('apps.count', { n: String(g.items.length) }), monthlyTotals(g.items).size ? ` · ${money(g.items, t, lang)}` : ''] })] }));
    return (_jsxs("div", { className: "col g16", children: [groups.map((g) => view.layout === 'grid' ? (_jsxs("section", { className: "col g12", children: [head(g), _jsx("div", { className: "apps-grid", children: g.items.map((a) => _jsx(AccessCard, { brandId: brandId, a: a, logo: logoDomain(a, list), drag: drag(a), onEdit: () => onEdit(a) }, a.id)) })] }, g.key)) : (_jsxs("section", { className: "col g8", children: [head(g), _jsxs("div", { className: "table acc-table overflow-x-auto", children: [_jsxs("div", { className: "trow head label", style: { gridTemplateColumns: gridFor(cols), minWidth: 260 + cols.length * 170 }, children: [_jsx("span", { children: t('acc.platform') }), cols.map((c) => _jsx("span", { children: t(COL_LABEL[c]) }, c)), _jsx("span", {})] }), g.items.map((a) => _jsx(AccessRow, { brandId: brandId, a: a, cols: cols, logo: logoDomain(a, list), drag: drag(a), onEdit: () => onEdit(a) }, a.id))] })] }, g.key))), _jsx("p", { className: "t-xs t-mute", children: t(canDrag ? 'apps.dragHint' : 'apps.dragOff') })] }));
}
