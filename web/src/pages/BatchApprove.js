import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useRequests, useVersions } from '../requests/useRequests';
import { useCanApprove } from '../requests/useCanApprove';
import { useFileUrl, isImage } from '../requests/useFileUrl';
import { approveBatch } from '../requests/api';
/** Approve a month of posts at once (design 14 · batch). */
export function BatchApprove() {
    const { current } = useBrands();
    const { t } = useI18n();
    const { list } = useRequests(current?.id);
    const canApprove = useCanApprove(current?.id);
    const [selected, setSelected] = useState(new Set());
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(null);
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    const items = list.filter((r) => r.status === 'to_approve' && r.latestVersion);
    const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const all = selected.size === items.length && items.length > 0;
    async function approve() {
        setBusy(true);
        try {
            const r = await approveBatch(current.id, items.filter((i) => selected.has(i.id)).map((i) => ({ requestId: i.id, versionId: i.latestVersion })));
            setDone(r.approved);
            setSelected(new Set());
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("div", { className: "col g24", children: [_jsxs("nav", { className: "crumbs", "aria-label": "Breadcrumb", children: [_jsx(Link, { to: "/requests", children: t('nav.requests') }), _jsx(Icon, { name: "chevronRight", size: 14 }), _jsx("span", { className: "cur", children: t('req.batchTitle') })] }), _jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4", children: [_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", children: current.name }), _jsxs("h1", { className: "h1", children: [_jsxs("span", { className: "w9", children: [t('req.batchTitle'), "."] }), " ", t('req.batchSub', { n: items.length })] })] }), _jsxs("div", { className: "row g12 wrap", children: [_jsx("button", { className: "btn btn-secondary", onClick: () => setSelected(all ? new Set() : new Set(items.map((i) => i.id))), children: all ? t('req.selectNone') : t('req.selectAll') }), _jsxs("button", { className: "btn btn-primary", disabled: !canApprove || !selected.size || busy, onClick: approve, children: [_jsx(Icon, { name: "check" }), t('req.approveN', { n: selected.size })] })] })] }), !canApprove && _jsx("p", { className: "t-sm t-mute", children: t('req.cannotApprove') }), done !== null && _jsxs("div", { className: "toast self-start", role: "status", children: [_jsx("span", { className: "ok", children: _jsx(Icon, { name: "check", size: 14 }) }), t('req.batchDone', { n: done })] }), items.length === 0 ? _jsx("div", { className: "card empty", children: _jsx("p", { className: "t-mute", children: t('req.nothingToApprove') }) }) : (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: items.map((r) => _jsx(BatchTile, { brandId: current.id, r: r, on: selected.has(r.id), onToggle: () => toggle(r.id) }, r.id)) }))] }));
}
function BatchTile({ brandId, r, on, onToggle }) {
    const { t } = useI18n();
    const versions = useVersions(brandId, r.id);
    const v = versions.find((x) => x.id === r.latestVersion);
    const url = useFileUrl(brandId, r.id, v);
    return (_jsxs("label", { className: `tile ${on ? 'is-sel' : ''}`, style: { cursor: 'pointer' }, children: [_jsxs("div", { className: "thumb", style: { height: 200, overflow: 'hidden' }, children: [url && isImage(v?.files?.[0]?.contentType) ? _jsx("img", { src: url, alt: "", className: "h-full w-full object-cover", loading: "lazy" }) : _jsx(Icon, { name: "file", size: 36 }), _jsx("input", { type: "checkbox", checked: on, onChange: onToggle, className: "absolute left-3 top-3", style: { width: 22, height: 22, accentColor: 'var(--azul)' }, "aria-label": r.title }), v && _jsx("span", { className: "chip chip-plain c-type absolute right-3 top-3", style: { background: '#fff' }, children: t('home.version', { n: v.n }) })] }), _jsxs("div", { className: "tile-meta", children: [_jsx("span", { className: "tile-name", children: r.title }), _jsx(Link, { to: `/requests/${r.id}`, className: "t-sm w7", onClick: (e) => e.stopPropagation(), children: t('req.review') })] })] }));
}
