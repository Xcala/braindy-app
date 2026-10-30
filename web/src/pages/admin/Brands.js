import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { asTree, useBrands } from '../../brands/BrandProvider';
import { BrandMark } from '../../brands/BrandMark';
import { useI18n } from '../../i18n/I18nProvider';
import { normalizeSearch } from '../../lib/text';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toaster';
import { useOpenWork } from '../../team/useWork';
import { daysFrom } from '../../lib/dates';
import { CITIES } from '../../brands/cities';
const COLS = 'minmax(0,1fr) 110px 200px 170px 170px';
export function AdminBrands() {
    const { brands } = useBrands();
    const { t } = useI18n();
    const [q, setQ] = useState('');
    const [status, setStatus] = useState('all');
    const [groupsOnly, setGroupsOnly] = useState(false);
    const [collapsed, setCollapsed] = useState(new Set());
    const toast = useToast();
    const { items } = useOpenWork();
    const health = useMemo(() => {
        const m = new Map();
        for (const i of items) {
            const h = m.get(i.brandId) ?? { open: 0, late: 0, last: 0 };
            h.open++;
            if (i.status === 'in_production' && i.dueDate && (daysFrom(i.dueDate) ?? 0) < 0)
                h.late++;
            h.last = Math.max(h.last, i.updatedAt?.toMillis() ?? i.createdAt?.toMillis() ?? 0);
            m.set(i.brandId, h);
        }
        return m;
    }, [items]);
    const rows = useMemo(() => {
        const needle = normalizeSearch(q);
        const tree = asTree(brands);
        const hiddenBy = (b) => brands.find((x) => x.id === b.groupId && collapsed.has(x.id));
        return tree.filter(({ brand }) => {
            if (groupsOnly && brand.kind !== 'group')
                return false;
            if (status !== 'all' && brand.status !== status)
                return false;
            if (needle)
                return normalizeSearch(brand.name).includes(needle);
            let p = hiddenBy(brand);
            while (p) {
                if (collapsed.has(p.id))
                    return false;
                p = hiddenBy(p);
            }
            return true;
        });
    }, [brands, q, status, groupsOnly, collapsed]);
    const toggleCollapse = (id) => setCollapsed((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    // Archive and activate are reversible: act now, offer Undo (design 30) instead of a confirmation.
    async function toggle(brand) {
        const to = brand.status === 'archived' ? 'active' : 'archived';
        const set = (status) => updateDoc(doc(db, 'brands', brand.id), { status, statusUpdatedAt: serverTimestamp() });
        await set(to);
        toast({ text: t(to === 'archived' ? 'toast.archived' : 'toast.activated', { name: brand.name }), undo: () => set(brand.status) });
    }
    const active = brands.filter((b) => b.status === 'active').length;
    return (_jsxs("section", { className: "col g24", children: [_jsx("div", { className: "flex flex-wrap items-end justify-between gap-4", children: _jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", children: t('role.admin') }), _jsxs("h1", { className: "h1", children: [_jsxs("span", { className: "w9", children: [t('admin.brands.title'), "."] }), " ", t('admin.brands.summary', { active, total: brands.length })] })] }) }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs("div", { className: "search w-full sm:w-[320px]", children: [_jsx(Icon, { name: "search" }), _jsx("input", { className: "input", placeholder: t('admin.brands.search'), "aria-label": t('brand.search'), value: q, onChange: (e) => setQ(e.target.value) })] }), _jsx("div", { className: "seg", role: "group", "aria-label": t('admin.brands.statusFilter'), children: ['all', 'active', 'archived'].map((s) => (_jsx("button", { className: status === s ? 'is-on' : '', "aria-pressed": status === s, onClick: () => setStatus(s), children: s === 'all' ? t('admin.brands.all') : t(`status.${s}`) }, s))) }), _jsxs("div", { className: "seg", role: "group", "aria-label": t('admin.brands.kindFilter'), children: [_jsx("button", { className: !groupsOnly ? 'is-on' : '', "aria-pressed": !groupsOnly, onClick: () => setGroupsOnly(false), children: t('admin.brands.groupsAndBrands') }), _jsx("button", { className: groupsOnly ? 'is-on' : '', "aria-pressed": groupsOnly, onClick: () => setGroupsOnly(true), children: t('admin.brands.groupsOnly') })] }), _jsx("span", { className: "grow" }), _jsx("span", { className: "t-sm t-mute", children: t('admin.brands.count', { n: rows.length }) })] }), _jsxs("div", { className: "table overflow-x-auto", children: [_jsxs("div", { className: "trow head label min-w-[920px]", style: { gridTemplateColumns: COLS }, children: [_jsx("span", { children: t('admin.brands.colBrand') }), _jsx("span", { children: t('admin.brands.colKind') }), _jsx("span", { children: t('brands.health') }), _jsx("span", { children: t('admin.brands.colCity') }), _jsx("span", { children: t('admin.brands.colStatus') })] }), rows.map(({ brand, depth }) => (_jsx(Row, { brand: brand, depth: depth, health: health.get(brand.id), collapsed: collapsed.has(brand.id), onCollapse: () => toggleCollapse(brand.id), onToggle: () => toggle(brand) }, brand.id)))] })] }));
}
function Row({ brand, depth, health, collapsed, onCollapse, onToggle }) {
    const { t, lang } = useI18n();
    const { select } = useBrands();
    const navigate = useNavigate();
    const on = brand.status === 'active';
    return (_jsxs("div", { className: `trow min-w-[920px] ${depth ? 'child' : ''} ${on ? '' : 'is-archived'}`, style: { gridTemplateColumns: COLS }, children: [_jsxs("span", { className: "row g12", style: { paddingLeft: depth * 44 }, children: [brand.kind === 'group' ? (_jsx("button", { className: "btn btn-ghost btn-icon btn-sm", onClick: onCollapse, "aria-expanded": !collapsed, "aria-label": `${collapsed ? t('admin.brands.expand') : t('admin.brands.collapse')} ${brand.name}`, style: { width: 32, color: 'var(--ink)' }, children: _jsx(Icon, { name: collapsed ? 'chevronRight' : 'chevronDown', size: 16 }) })) : _jsx("span", { style: { width: 32 } }), _jsx("span", { className: "sel", style: { border: 0, height: 'auto', padding: 0, background: 'none' }, children: _jsx(BrandMark, { brand: brand }) }), _jsx("button", { onClick: () => { select(brand.id); navigate('/brand'); }, className: "w7 truncate text-left", style: { background: 'none', border: 0, cursor: 'pointer', color: 'inherit' }, children: brand.name })] }), _jsx("span", { children: _jsx("span", { className: `chip ${brand.kind === 'group' ? 'c-group' : 'c-type'}`, children: brand.kind === 'group' ? t('brand.group') : t('admin.brands.brand') }) }), _jsxs("span", { className: "row g8 wrap t-sm", children: [brand.kind === 'group' || !on ? _jsx("span", { className: "t-mute", children: "\u2014" })
                        : health?.late ? _jsx("span", { className: "chip", style: { background: '#FDECEA', color: '#C0362C' }, children: t('brands.lateN', { n: health.late }) })
                            : health?.open ? _jsx("span", { className: "chip c-active", children: t('brands.ok') })
                                : _jsx("span", { className: "chip chip-plain", children: t('brands.quiet') }), health?.open ? _jsxs("span", { className: "t-mute", children: [health.open, " ", t('brands.open').toLowerCase()] }) : null] }), _jsx("span", { children: _jsxs("select", { className: "input", style: { height: 34, padding: '0 8px' }, "aria-label": `${t('admin.brands.colCity')} ${brand.name}`, value: brand.city ?? '', onChange: (e) => updateDoc(doc(db, 'brands', brand.id), { city: e.target.value || null }), children: [_jsx("option", { value: "", children: t('admin.brands.noCity') }), CITIES.map((c) => _jsx("option", { value: c.id, children: lang === 'es' ? c.es : c.en }, c.id))] }) }), _jsxs("span", { className: "row g12", children: [_jsx("button", { className: `switch ${on ? 'is-on' : ''}`, role: "switch", "aria-checked": on, "aria-label": `${brand.name} ${t('status.active')}`, onClick: onToggle }), _jsx("span", { className: "t-sm w7", style: { color: on ? 'var(--success)' : 'var(--graphite)' }, children: t(`status.${brand.status}`) })] })] }));
}
