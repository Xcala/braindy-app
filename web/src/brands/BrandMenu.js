import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { normalizeSearch } from '../lib/text';
import { Icon } from '../components/Icon';
import { asTree, useBrands } from './BrandProvider';
import { BrandMark } from './BrandMark';
const RECENT_KEY = 'braindy.recentBrands';
const readRecent = () => { try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
}
catch {
    return [];
} };
const pushRecent = (id) => {
    try {
        localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...readRecent().filter((x) => x !== id)].slice(0, 3)));
    }
    catch { /* storage unavailable */ }
};
/** Brand selector from the design: search, recent, groups as a tree, admin entry. */
export function BrandMenu({ isAdmin, onPicked }) {
    const { brands, current, select } = useBrands();
    const { t } = useI18n();
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const box = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        const onDown = (e) => { if (!box.current?.contains(e.target))
            setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape')
            setOpen(false); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
    }, [open]);
    const tree = useMemo(() => asTree(brands), [brands]);
    const childCount = (id) => brands.filter((b) => b.groupId === id).length;
    const needle = normalizeSearch(q);
    const found = needle ? brands.filter((b) => [b.name, ...b.previousNames].some((n) => normalizeSearch(n).includes(needle))) : null;
    const recent = readRecent().map((id) => brands.find((b) => b.id === id)).filter((b) => !!b);
    const choose = (id) => { select(id); pushRecent(id); setOpen(false); setQ(''); onPicked?.(); };
    if (!current)
        return null;
    if (brands.length < 2) {
        return _jsxs("div", { className: "sel", style: { cursor: 'default' }, children: [_jsx(BrandMark, { brand: current }), _jsx(BrandName, { name: current.name })] });
    }
    const item = (b, depth = 0) => (_jsxs("button", { type: "button", role: "option", "aria-selected": b.id === current.id, onClick: () => choose(b.id), className: `menu-item w-full text-left ${b.id === current.id ? 'is-on' : ''} ${depth === 1 ? 'tree-1' : depth >= 2 ? 'tree-2' : ''}`, style: { border: 0, background: undefined, cursor: 'pointer' }, children: [_jsx(BrandMark, { brand: b }), _jsxs("span", { className: "grow col min-w-0", style: { opacity: b.status === 'archived' ? 0.55 : 1 }, children: [_jsx("span", { className: "truncate", children: b.name }), b.previousNames.length > 0 && _jsx("span", { className: "t-xs t-mute truncate", children: t('ver.before', { name: b.previousNames.join(', ') }) })] }), b.kind === 'group' && _jsxs("span", { className: "chip c-group", children: [t('brand.group'), " \u00B7 ", childCount(b.id)] }), b.status === 'archived' && b.kind !== 'group' && _jsx("span", { className: "chip c-archived", children: t('status.archived') }), b.id === current.id && _jsx(Icon, { name: "check", size: 16 })] }, b.id));
    return (_jsxs("div", { ref: box, className: "relative", children: [_jsxs("button", { type: "button", className: "sel", "aria-haspopup": "listbox", "aria-expanded": open, onClick: () => setOpen((o) => !o), children: [_jsx(BrandMark, { brand: current }), _jsxs("span", { className: "flex flex-col items-start", style: { lineHeight: '16px' }, children: [_jsx("span", { className: "t-xs t-mute", style: { fontWeight: 600 }, children: t('brand.switch') }), _jsx(BrandName, { name: current.name })] }), _jsx(Icon, { name: "chevronDown", size: 16 })] }), open && (_jsxs("div", { className: "menu absolute left-0 top-[56px] z-40 flex max-h-[70vh] w-[min(380px,calc(100vw-32px))] flex-col gap-0.5 overflow-y-auto", role: "listbox", "aria-label": t('brand.choose'), children: [_jsxs("div", { className: "search", style: { margin: '4px 4px 8px' }, children: [_jsx(Icon, { name: "search" }), _jsx("input", { className: "input", autoFocus: true, placeholder: t('brand.searchN', { n: brands.length }), "aria-label": t('brand.search'), value: q, onChange: (e) => setQ(e.target.value) })] }), isAdmin && !found && (_jsxs(Link, { to: "/admin/brands", onClick: () => setOpen(false), className: "menu-item", style: { background: 'var(--ink)', color: '#fff' }, children: [_jsx("span", { className: "mark", style: { background: '#fff' }, children: _jsx("img", { src: "/brand/braindy-mark.svg", alt: "", style: { width: 20, height: 20 } }) }), _jsx("span", { className: "grow", children: t('brand.admin') }), _jsx("span", { className: "t-xs", style: { color: '#C9D0DE' }, children: t('nav.brands') })] })), found ? (found.length ? found.map((b) => item(b)) : _jsx("p", { className: "t-sm t-mute", style: { padding: '8px 12px' }, children: t('brand.noMatch') })) : (_jsxs(_Fragment, { children: [recent.length > 0 && (_jsxs(_Fragment, { children: [_jsx("p", { className: "label", style: { padding: '6px 12px' }, children: t('brand.recent') }), recent.map((b) => item(b)), _jsx("div", { className: "divider", style: { margin: '6px 0' } })] })), tree.map(({ brand, depth }) => item(brand, depth))] }))] }))] }));
}
const SMALL = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'of', 'the', 'and', '&']);
/** "Grupo Alternativas" → "GA": what a long brand name shows in the phone header. */
export const initials = (name) => name.split(/[\s_/-]+/).filter((w) => w && !SMALL.has(w.toLowerCase())).slice(0, 3).map((w) => w[0]).join('').toUpperCase();
/** The brand name in the selector; on phones a long name becomes its initials (full name stays in the tooltip and for screen readers). */
function BrandName({ name }) {
    const long = name.length > 12 && initials(name).length > 1;
    return (_jsxs("span", { className: `bname max-w-[12rem] truncate${long ? ' is-long' : ''}`, title: name, children: [_jsx("span", { className: "bname-full", children: name }), long && _jsx("span", { className: "bname-short", "aria-hidden": "true", children: initials(name) })] }));
}
