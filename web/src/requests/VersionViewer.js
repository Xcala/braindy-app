import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useFileUrl, viewKind, markFile } from './useFileUrl';
import { downloadVersionZip, versionFileUrl } from './api';
import { FileStrip } from './FileStrip';
import { FileBody } from './FileBody';
import { Popover } from './Popover';
import { VideoMarks } from './VideoMarks';
import './viewer.css';
/**
 * Piece viewer with version tabs and "mark on piece": drag a box, then comment on it. A version with several files
 * gets arrows (and ← →, and a swipe on phones), a "3 of 10" counter and a strip of tiles; marks belong to one file.
 */
export function VersionViewer({ brandId, requestId, versions, current, onPick, fileIndex, onFile, comments, onMark, onCompare, seek }) {
    const { t, lang } = useI18n();
    const [marking, setMarking] = useState(false);
    const [draft, setDraft] = useState(null);
    const box = useRef(null);
    const swipe = useRef(null);
    const player = useRef(null);
    const [duration, setDuration] = useState(0);
    const count = current?.files?.length ?? 0;
    const file = current?.files?.[fileIndex];
    const kind = viewKind(file);
    const url = useFileUrl(brandId, requestId, current, fileIndex);
    const go = (d) => { const i = fileIndex + d; if (i >= 0 && i < count) {
        onFile(i);
        setMarking(false);
    } };
    useEffect(() => {
        if (count < 2)
            return;
        const onKey = (e) => {
            const el = e.target;
            if (marking || (el instanceof Element && el.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')))
                return;
            if (e.key === 'ArrowLeft')
                go(-1);
            if (e.key === 'ArrowRight')
                go(1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }); // eslint-disable-line react-hooks/exhaustive-deps
    const seekTo = (t) => { const p = player.current; if (p) {
        p.currentTime = t;
        p.pause();
    } };
    useEffect(() => { if (seek)
        seekTo(seek.t); }, [seek?.n]); // eslint-disable-line react-hooks/exhaustive-deps
    const markMoment = () => {
        const p = player.current;
        if (!p || !current)
            return;
        p.pause();
        onMark({ x: 0, y: 0, w: 0, h: 0, versionId: current.id, fileIndex, t: Math.round(p.currentTime * 10) / 10 });
    };
    const pos = (e) => {
        const r = box.current.getBoundingClientRect();
        return { x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)), y: Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)) };
    };
    const up = () => {
        if (draft && current) {
            const a = { x: Math.min(draft.x0, draft.x), y: Math.min(draft.y0, draft.y), w: Math.abs(draft.x - draft.x0), h: Math.abs(draft.y - draft.y0), versionId: current.id, fileIndex };
            onMark(a.w < 2 || a.h < 2 ? { ...a, w: 0, h: 0 } : a);
            setMarking(false);
        }
        setDraft(null);
    };
    const onThis = comments.filter((c) => c.annotation && c.annotation.versionId === current?.id && markFile(c.annotation) === fileIndex);
    const pins = onThis.filter((c) => typeof c.annotation.t !== 'number');
    const state = (v) => (v.approval?.state === 'approved' ? 'approved' : v.approval?.state === 'changes_requested' ? 'changes' : v.published ? 'review' : null);
    const date = (v) => (v.publishedAt ?? v.createdAt)?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' });
    const getOne = async () => { if (current)
        window.location.assign(await versionFileUrl(brandId, requestId, current.id, fileIndex, true)); };
    return (_jsxs("div", { className: "col min-w-0", style: { background: 'var(--niebla)' }, children: [_jsxs("div", { className: "row between g8 wrap", style: { padding: '14px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }, children: [_jsx("div", { className: "seg", role: "tablist", "aria-label": t('req.versions'), children: versions.map((v) => {
                            const st = state(v);
                            const label = st ? t(`vs.${st}`) : undefined;
                            return (_jsxs("button", { role: "tab", "aria-selected": v.id === current?.id, className: v.id === current?.id ? 'is-on' : '', onClick: () => { onPick(v.id); onFile(0); }, title: label, children: ["v", v.n, date(v) ? ` · ${date(v)}` : '', st && _jsx("span", { className: `vs-dot is-${st}`, role: "img", "aria-label": label })] }, v.id));
                        }) }), _jsxs("div", { className: "row g8 wrap", children: [count > 1 && _jsx("span", { className: "vw-count", "aria-live": "polite", children: t('vw.counter', { i: fileIndex + 1, n: count }) }), kind === 'image' && _jsx("button", { "data-tour": "review-mark", className: "btn btn-ghost btn-sm", "aria-pressed": marking, style: marking ? { background: 'var(--hielo)' } : undefined, onClick: () => setMarking((m) => !m), children: t('req.markOnPiece') }), kind === 'video' && _jsx("button", { className: "btn btn-ghost btn-sm", onClick: markMoment, children: t('vm.commentHere') }), versions.length > 1 && (kind === 'image' || kind === 'video') && _jsx("button", { "data-tour": "review-compare", className: "btn btn-ghost btn-sm", onClick: onCompare, children: t('req.compare') }), current && file && (count > 1 ? (_jsx(Popover, { align: "right", className: "btn btn-ghost btn-sm", label: _jsxs(_Fragment, { children: [_jsx(Icon, { name: "download" }), t('common.download'), _jsx(Icon, { name: "chevronDown", size: 14 })] }), children: (close) => (_jsxs("div", { className: "col g8", children: [_jsx("button", { className: "btn btn-secondary btn-sm", onClick: () => { close(); void getOne(); }, children: t('vw.thisFile') }), _jsx("button", { className: "btn btn-primary btn-sm", onClick: () => { close(); void downloadVersionZip(brandId, requestId, current.id, `v${current.n}`); }, children: t('vw.all') })] })) })) : _jsxs("button", { className: "btn btn-ghost btn-sm", onClick: getOne, children: [_jsx(Icon, { name: "download" }), t('common.download')] }))] })] }), _jsxs("div", { className: "vw-stage flex min-h-[420px] flex-1 items-center justify-center p-4 sm:px-16 sm:py-7", onTouchStart: (e) => { swipe.current = marking ? null : e.touches[0].clientX; }, onTouchEnd: (e) => { if (swipe.current === null)
                    return; const dx = e.changedTouches[0].clientX - swipe.current; swipe.current = null; if (Math.abs(dx) > 50)
                    go(dx < 0 ? 1 : -1); }, children: [count > 1 && _jsx("button", { className: "vw-arrow is-prev", "aria-label": t('vw.prev'), disabled: fileIndex === 0, onClick: () => go(-1), children: _jsx(Icon, { name: "arrowLeft", size: 18 }) }), !url && kind !== 'text' ? _jsx("div", { className: "skel", style: { width: '60%', height: 360 } }) : kind === 'image' ? (_jsxs("div", { ref: box, className: "relative select-none", style: { cursor: marking ? 'crosshair' : 'default', touchAction: marking ? 'none' : 'auto' }, onPointerDown: (e) => { if (marking) {
                            const p = pos(e);
                            setDraft({ x0: p.x, y0: p.y, ...p });
                        } }, onPointerMove: (e) => draft && setDraft({ ...draft, ...pos(e) }), onPointerUp: up, children: [_jsx("img", { src: url ?? undefined, alt: file?.name, draggable: false, className: "block max-h-[70vh] max-w-full rounded-lg", style: { boxShadow: 'var(--sh-2)' } }), pins.map((c, i) => _jsx(Pin, { a: c.annotation, n: i + 1, resolved: c.resolved }, c.id)), draft && _jsx("span", { className: "absolute", style: { left: `${Math.min(draft.x0, draft.x)}%`, top: `${Math.min(draft.y0, draft.y)}%`, width: `${Math.abs(draft.x - draft.x0)}%`, height: `${Math.abs(draft.y - draft.y0)}%`, border: '2px dashed var(--azul)', borderRadius: 10, background: 'rgba(47,77,224,.08)' } })] })) : kind === 'video' ? (_jsxs("div", { className: "vm-wrap", children: [_jsx("video", { ref: player, src: url ?? undefined, controls: true, className: "mx-auto max-h-[70vh] max-w-full rounded-lg", onLoadedMetadata: (e) => setDuration(e.currentTarget.duration || 0) }), _jsx(VideoMarks, { comments: onThis, duration: duration, onSeek: seekTo })] }))
                        : current && file && _jsx(FileBody, { brandId: brandId, requestId: requestId, versionId: current.id, index: fileIndex, file: file, kind: kind, url: url ?? '', onDownload: getOne }), count > 1 && _jsx("button", { className: "vw-arrow is-next", "aria-label": t('vw.next'), disabled: fileIndex === count - 1, onClick: () => go(1), children: _jsx(Icon, { name: "arrowRight", size: 18 }) })] }), count > 1 && current && _jsx(FileStrip, { brandId: brandId, requestId: requestId, v: current, index: fileIndex, onPick: (i) => { onFile(i); setMarking(false); } })] }));
}
function Pin({ a, n, resolved }) {
    const color = resolved ? 'var(--success)' : 'var(--azul)';
    return (_jsxs(_Fragment, { children: [a.w > 0 && _jsx("span", { className: "pointer-events-none absolute", style: { left: `${a.x}%`, top: `${a.y}%`, width: `${a.w}%`, height: `${a.h}%`, border: `2px dashed ${color}`, borderRadius: 10, background: resolved ? 'transparent' : 'rgba(47,77,224,.08)' } }), _jsx("span", { className: "pointer-events-none absolute flex items-center justify-center", style: { left: `calc(${a.x + a.w}% - 16px)`, top: `calc(${a.y}% - 16px)`, width: 32, height: 32, borderRadius: '50% 50% 50% 4px', background: color, color: '#fff', font: '800 13px/1 var(--f-text)', boxShadow: '0 0 0 3px #fff, var(--sh-2)' }, children: resolved ? _jsx(Icon, { name: "check", size: 14 }) : n })] }));
}
