import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useFileUrl, isImage, isVideo } from './useFileUrl';
import { versionFileUrl } from './api';
/** Piece viewer with version tabs and "mark on piece": drag a box, then comment on it. */
export function VersionViewer({ brandId, requestId, versions, current, onPick, comments, onMark, onCompare }) {
    const { t, lang } = useI18n();
    const [fileIndex, setFileIndex] = useState(0);
    const [marking, setMarking] = useState(false);
    const [draft, setDraft] = useState(null);
    const box = useRef(null);
    const file = current?.files?.[fileIndex];
    const url = useFileUrl(brandId, requestId, current, fileIndex);
    const pos = (e) => {
        const r = box.current.getBoundingClientRect();
        return { x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)), y: Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)) };
    };
    const up = () => {
        if (draft && current) {
            const a = { x: Math.min(draft.x0, draft.x), y: Math.min(draft.y0, draft.y), w: Math.abs(draft.x - draft.x0), h: Math.abs(draft.y - draft.y0), versionId: current.id };
            onMark(a.w < 2 || a.h < 2 ? { ...a, w: 0, h: 0 } : a);
            setMarking(false);
        }
        setDraft(null);
    };
    const pins = comments.filter((c) => c.annotation && c.annotation.versionId === current?.id);
    const date = (v) => (v.publishedAt ?? v.createdAt)?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' });
    return (_jsxs("div", { className: "col min-w-0", style: { background: 'var(--niebla)' }, children: [_jsxs("div", { className: "row between g8 wrap", style: { padding: '14px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }, children: [_jsx("div", { className: "seg", role: "tablist", "aria-label": t('req.versions'), children: versions.map((v) => _jsxs("button", { role: "tab", "aria-selected": v.id === current?.id, className: v.id === current?.id ? 'is-on' : '', onClick: () => { onPick(v.id); setFileIndex(0); }, children: ["v", v.n, date(v) ? ` · ${date(v)}` : ''] }, v.id)) }), _jsxs("div", { className: "row g8 wrap", children: [isImage(file?.contentType) && _jsx("button", { "data-tour": "review-mark", className: "btn btn-ghost btn-sm", "aria-pressed": marking, style: marking ? { background: 'var(--hielo)' } : undefined, onClick: () => setMarking((m) => !m), children: t('req.markOnPiece') }), versions.length > 1 && isImage(file?.contentType) && _jsx("button", { "data-tour": "review-compare", className: "btn btn-ghost btn-sm", onClick: onCompare, children: t('req.compare') }), current && file && _jsxs("button", { className: "btn btn-ghost btn-sm", onClick: async () => window.location.assign(await versionFileUrl(brandId, requestId, current.id, fileIndex, true)), children: [_jsx(Icon, { name: "download" }), t('common.download')] })] })] }), _jsx("div", { className: "flex min-h-[420px] flex-1 items-center justify-center p-4 sm:p-7", children: !url ? _jsx("div", { className: "skel", style: { width: '60%', height: 360 } }) : isImage(file?.contentType) ? (_jsxs("div", { ref: box, className: "relative select-none", style: { cursor: marking ? 'crosshair' : 'default', touchAction: marking ? 'none' : 'auto' }, onPointerDown: (e) => { if (marking) {
                        const p = pos(e);
                        setDraft({ x0: p.x, y0: p.y, ...p });
                    } }, onPointerMove: (e) => draft && setDraft({ ...draft, ...pos(e) }), onPointerUp: up, children: [_jsx("img", { src: url, alt: file?.name, draggable: false, className: "block max-h-[70vh] max-w-full rounded-lg", style: { boxShadow: 'var(--sh-2)' } }), pins.map((c, i) => _jsx(Pin, { a: c.annotation, n: i + 1, resolved: c.resolved }, c.id)), draft && _jsx("span", { className: "absolute", style: { left: `${Math.min(draft.x0, draft.x)}%`, top: `${Math.min(draft.y0, draft.y)}%`, width: `${Math.abs(draft.x - draft.x0)}%`, height: `${Math.abs(draft.y - draft.y0)}%`, border: '2px dashed var(--azul)', borderRadius: 10, background: 'rgba(47,77,224,.08)' } })] })) : isVideo(file?.contentType) ? _jsx("video", { src: url, controls: true, className: "max-h-[70vh] max-w-full rounded-lg" })
                    : _jsxs("a", { className: "btn btn-secondary", href: url, target: "_blank", rel: "noreferrer", children: [t('common.open'), " ", file?.name] }) }), (current?.files?.length ?? 0) > 1 && (_jsx("div", { className: "row g8 wrap", style: { padding: '0 20px 16px' }, children: current.files.map((f, i) => _jsx("button", { className: `btn btn-sm ${i === fileIndex ? 'btn-primary' : 'btn-secondary'}`, onClick: () => setFileIndex(i), children: f.name }, i)) }))] }));
}
function Pin({ a, n, resolved }) {
    const color = resolved ? 'var(--success)' : 'var(--azul)';
    return (_jsxs(_Fragment, { children: [a.w > 0 && _jsx("span", { className: "pointer-events-none absolute", style: { left: `${a.x}%`, top: `${a.y}%`, width: `${a.w}%`, height: `${a.h}%`, border: `2px dashed ${color}`, borderRadius: 10, background: resolved ? 'transparent' : 'rgba(47,77,224,.08)' } }), _jsx("span", { className: "pointer-events-none absolute flex items-center justify-center", style: { left: `calc(${a.x + a.w}% - 16px)`, top: `calc(${a.y}% - 16px)`, width: 32, height: 32, borderRadius: '50% 50% 50% 4px', background: color, color: '#fff', font: '800 13px/1 var(--f-text)', boxShadow: '0 0 0 3px #fff, var(--sh-2)' }, children: resolved ? _jsx(Icon, { name: "check", size: 14 }) : n })] }));
}
