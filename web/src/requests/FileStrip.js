import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useFileUrl, viewKind } from './useFileUrl';
const ORDER = ['image', 'video', 'pdf', 'text', 'other'];
const ext = (name) => (name.match(/\.([^.]+)$/)?.[1] ?? '').toUpperCase();
/** The files of a version as small tiles grouped by kind ("8 slides", "PDF", "Text"); the name shows on hover. */
export function FileStrip({ brandId, requestId, v, index, onPick }) {
    const { t } = useI18n();
    const groups = ORDER.map((k) => ({ k, items: v.files.map((f, i) => ({ f, i })).filter(({ f }) => viewKind(f) === k) })).filter((g) => g.items.length);
    const label = (k, n) => k === 'image' ? (n > 1 ? t('vw.slides', { n }) : t('vw.image')) : `${t(`vw.${k}`)}${n > 1 ? ` · ${n}` : ''}`;
    return (_jsx("div", { className: "vw-strip", role: "tablist", "aria-label": t('vw.files'), children: groups.map((g) => (_jsxs("div", { className: "vw-group", children: [_jsx("span", { className: "t-xs t-mute w7", children: label(g.k, g.items.length) }), _jsx("div", { className: "row g8", children: g.items.map(({ f, i }, n) => (_jsx(Tile, { brandId: brandId, requestId: requestId, v: v, i: i, on: i === index, onPick: onPick, kind: g.k, name: f.name, n: g.items.length > 1 ? String(n + 1).padStart(2, '0') : '' }, i))) })] }, g.k))) }));
}
function Tile({ brandId, requestId, v, i, on, onPick, kind, name, n }) {
    const url = useFileUrl(brandId, requestId, kind === 'image' ? v : undefined, i);
    const ref = useRef(null);
    useEffect(() => { if (on)
        ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [on]);
    return (_jsxs("button", { ref: ref, type: "button", role: "tab", "aria-selected": on, title: name, "aria-label": name, className: `vw-tile${on ? ' is-on' : ''}`, onClick: () => onPick(i), children: [kind === 'image'
                ? (url ? _jsx("img", { src: url, alt: "", loading: "lazy", draggable: false }) : _jsx("span", { className: "skel", style: { width: '100%', height: '100%' } }))
                : _jsxs("span", { className: "vw-ico", children: [_jsx(Icon, { name: kind === 'video' ? 'external' : 'file', size: 20 }), _jsx("span", { className: "t-xs w7", children: ext(name) || '·' })] }), n && _jsx("span", { className: "vw-n", children: n })] }));
}
