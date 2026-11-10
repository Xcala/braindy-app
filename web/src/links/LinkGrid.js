import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { LinkViewer } from './LinkViewer';
import { LinkAdjust } from './LinkAdjust';
import { useSiteChanges } from './SiteChanges';
import { addLink, isHttps, removeLink, saveLink } from './useBrandLinks';
const COVERS = {
    web: 'radial-gradient(120% 90% at 85% 0%, rgba(42,127,255,.9), transparent 55%), radial-gradient(90% 80% at 0% 100%, rgba(6,182,212,.6), transparent 60%), #1F3596',
    app: 'radial-gradient(110% 90% at 100% 0%, rgba(139,92,246,.75), transparent 55%), #14123A',
    dashboard: 'radial-gradient(110% 90% at 0% 0%, rgba(6,182,212,.6), transparent 55%), #0B1730',
    research: 'radial-gradient(100% 90% at 100% 0%, rgba(245,179,1,.35), transparent 55%), #060D1E',
    marketmap: 'radial-gradient(100% 90% at 100% 0%, rgba(245,179,1,.35), transparent 55%), #060D1E',
};
const KINDS = { apps: ['web', 'app', 'dashboard'], research: ['research', 'marketmap'] };
const host = (url) => { try {
    return new URL(url).host.replace(/^www\./, '');
}
catch {
    return url;
} };
/** Cards for My apps / My research. Everyone in the brand opens them; NickMark adds, edits and deletes.
 *  A site or app card shows its adjustments; opening it puts the page beside its triage. */
export function LinkGrid({ brandId, section, links }) {
    const { t } = useI18n();
    const { profile } = useAuth();
    const isAdmin = profile?.role === 'admin';
    const [editing, setEditing] = useState(null);
    const [viewing, setViewing] = useState(null);
    const closeViewer = useCallback(() => setViewing(null), []);
    const changes = useSiteChanges(brandId);
    return (_jsxs("div", { className: "col g16", children: [isAdmin && !editing && _jsx("div", { children: _jsxs("button", { type: "button", className: "btn btn-primary btn-sm", onClick: () => setEditing('new'), children: ["+ ", t('links.add')] }) }), editing && _jsx(LinkForm, { brandId: brandId, section: section, link: editing === 'new' ? undefined : editing, onClose: () => setEditing(null) }), _jsx("div", { className: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3", children: links.map((l) => (_jsxs("div", { className: "deck", children: [_jsx("button", { type: "button", onClick: () => setViewing(l), "aria-label": `${t('links.open')} ${l.title}`, className: "cover", style: { background: COVERS[l.kind] ?? COVERS.web, color: '#fff', textDecoration: 'none', border: 0, width: '100%', cursor: 'pointer', padding: 0 }, children: l.ogImage ? _jsx("img", { className: "bg", src: l.ogImage, alt: "", loading: "lazy", referrerPolicy: "no-referrer", onError: (e) => { e.currentTarget.style.display = 'none'; } }) : (_jsxs("div", { className: "col g8", style: { alignItems: 'center' }, children: [_jsx(Icon, { name: "file", size: 30 }), _jsx("span", { className: "t-sm w7", style: { opacity: 0.85 }, children: host(l.url) })] })) }), _jsxs("div", { className: "body", children: [_jsxs("div", { className: "row between g8", children: [_jsx("span", { className: "kind kind-logodeck", children: t(`links.kind.${l.kind}`) }), _jsx("span", { className: `chip ${l.status === 'building' ? 'c-draft' : 'c-approved'}`, children: t(l.status === 'building' ? 'links.status.building' : 'links.status.live') })] }), _jsx("span", { className: "h3", children: l.title }), l.description && _jsx("p", { className: "t-sm t-mute line-clamp-2", children: l.description }), section === 'apps' && _jsx(LinkAdjust, { link: l, links: links, all: changes, onOpen: () => setViewing(l) }), _jsxs("div", { className: "row between g8 wrap", children: [_jsxs("span", { className: "row g12", children: [_jsx("button", { type: "button", className: "t-sm w7", style: { color: 'var(--azul)', background: 'none', border: 0, padding: 0, cursor: 'pointer' }, onClick: () => setViewing(l), children: t('links.open') }), _jsx("a", { href: l.url, target: "_blank", rel: "noreferrer", className: "t-sm", style: { color: 'var(--graphite)' }, title: t('lv.newTab'), "aria-label": `${t('lv.newTab')}: ${l.title}`, children: "\u2197" })] }), isAdmin && (_jsxs("span", { className: "row g8", children: [_jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => setEditing(l), children: t('links.edit') }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => removeLink(brandId, l.id), children: t('links.delete') })] }))] })] })] }, l.id))) }), viewing && _jsx(LinkViewer, { brandId: brandId, link: viewing, links: links, onClose: closeViewer })] }));
}
function LinkForm({ brandId, section, link, onClose }) {
    const { t } = useI18n();
    const [v, setV] = useState({ kind: link?.kind ?? KINDS[section][0], title: link?.title ?? '', url: link?.url ?? '', description: link?.description ?? '', status: link?.status ?? 'live' });
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
    const badUrl = v.url.trim() !== '' && !isHttps(v.url);
    async function submit(e) {
        e.preventDefault();
        if (!v.title.trim() || !isHttps(v.url))
            return;
        setBusy(true);
        try {
            await (link ? saveLink(brandId, link.id, section, v) : addLink(brandId, section, v));
            onClose();
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("form", { className: "card grid gap-3 sm:grid-cols-2", onSubmit: submit, children: [_jsxs("label", { className: "col g4", children: [_jsx("span", { className: "label", children: t('links.title') }), _jsx("input", { className: "input", value: v.title, onChange: set('title'), maxLength: 120, required: true })] }), _jsxs("label", { className: "col g4", children: [_jsx("span", { className: "label", children: t('links.url') }), _jsx("input", { className: "input", value: v.url, onChange: set('url'), type: "url", placeholder: "https://", required: true }), badUrl && _jsx("span", { className: "t-xs", style: { color: 'var(--danger, #C0362C)' }, children: t('links.badUrl') })] }), _jsxs("label", { className: "col g4", children: [_jsx("span", { className: "label", children: t('links.kind') }), _jsx("select", { className: "input", value: v.kind, onChange: set('kind'), children: KINDS[section].map((k) => _jsx("option", { value: k, children: t(`links.kind.${k}`) }, k)) })] }), _jsxs("label", { className: "col g4", children: [_jsx("span", { className: "label", children: t('links.status') }), _jsxs("select", { className: "input", value: v.status, onChange: set('status'), children: [_jsx("option", { value: "live", children: t('links.status.live') }), _jsx("option", { value: "building", children: t('links.status.building') })] })] }), _jsxs("label", { className: "col g4 sm:col-span-2", children: [_jsx("span", { className: "label", children: t('links.description') }), _jsx("input", { className: "input", value: v.description, onChange: set('description'), maxLength: 300 })] }), _jsxs("div", { className: "row g8 sm:col-span-2", children: [_jsx("button", { type: "submit", className: "btn btn-primary btn-sm", disabled: busy || !v.title.trim() || !isHttps(v.url), children: t('links.save') }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: onClose, children: t('links.cancel') })] })] }));
}
