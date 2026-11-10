import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useFileUrl, viewKind } from './useFileUrl';
import { useComments } from './useRequests';
import { Scan } from '../components/Scan';
/** Compare two versions (design 14/27): slider, side by side, or only what changed. Same file of each version; videos side by side. */
export function CompareView({ brandId, requestId, versions, fileIndex = 0, onClose }) {
    const { t } = useI18n();
    const [aId, setA] = useState(versions[versions.length - 2]?.id);
    const [bId, setB] = useState(versions[versions.length - 1]?.id);
    const [pos, setPos] = useState(50);
    const [mode, setMode] = useState('slider');
    const comments = useComments(brandId, requestId);
    const a = versions.find((v) => v.id === aId);
    const b = versions.find((v) => v.id === bId);
    const fa = Math.min(fileIndex, Math.max(0, (a?.files?.length ?? 1) - 1));
    const fb = Math.min(fileIndex, Math.max(0, (b?.files?.length ?? 1) - 1));
    const ua = useFileUrl(brandId, requestId, a, fa);
    const ub = useFileUrl(brandId, requestId, b, fb);
    const video = viewKind(b?.files?.[fb]) === 'video' || viewKind(a?.files?.[fa]) === 'video';
    useEffect(() => { if (video && mode === 'slider')
        setMode('side'); }, [video, mode]);
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);
    const pick = (value, set, label) => (_jsx("select", { className: "input", style: { height: 40, width: 'auto' }, value: value, onChange: (e) => set(e.target.value), "aria-label": label, children: versions.map((v) => _jsxs("option", { value: v.id, children: ["v", v.n] }, v.id)) }));
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex flex-col p-4", style: { background: 'var(--noche)' }, role: "dialog", "aria-modal": "true", "aria-label": t('req.compare'), children: [_jsxs("div", { className: "row between g12 wrap", style: { color: '#fff', paddingBottom: 12 }, children: [_jsxs("div", { className: "row g12 wrap", children: [pick(aId, setA, t('req.left')), _jsx("span", { children: "\u2194" }), pick(bId, setB, t('req.right')), _jsx("div", { className: "seg", role: "group", "aria-label": t('req.compareMode'), children: (video ? ['side', 'changes'] : ['slider', 'side', 'changes']).map((m) => _jsx("button", { className: mode === m ? 'is-on' : '', "aria-pressed": mode === m, onClick: () => setMode(m), children: t(`req.mode.${m}`) }, m)) })] }), _jsxs("button", { className: "btn btn-outline-light btn-sm", onClick: onClose, children: [_jsx(Icon, { name: "x" }), t('common.cancel')] })] }), _jsx("div", { className: "relative mx-auto flex min-h-0 flex-1 items-center justify-center", children: mode === 'side' && ua && ub ? (_jsx("div", { className: "grid w-full gap-4 md:grid-cols-2", children: [[a, ua], [b, ub]].map(([v, u]) => (_jsxs("figure", { className: "relative m-0 flex items-center justify-center", children: [video ? _jsx("video", { src: u, controls: true, className: "block max-h-[74vh] max-w-full" })
                                : _jsx("img", { src: u, alt: `v${v.n}`, className: "block max-h-[74vh] max-w-full" }), _jsxs("span", { className: "chip absolute left-3 top-3", style: { background: '#fff' }, children: ["v", v.n] })] }, v.id))) })) : mode === 'changes' ? (_jsxs("div", { className: "card col g12 w-full max-w-[640px]", style: { maxHeight: '78vh', overflowY: 'auto' }, children: [_jsx("h2", { className: "h3", children: t('req.changesTitle', { a: String(a?.n ?? ''), b: String(b?.n ?? '') }) }), b?.notes && _jsx(Scan, { text: b.notes, points: true }), b?.reason && _jsxs("div", { className: "col g4", children: [_jsx("p", { className: "label", children: t('req.whyItWorks') }), _jsx(Scan, { text: b.reason, points: true, tone: "ink" })] }), _jsx("p", { className: "label", children: t('req.askedOn', { n: String(a?.n ?? '') }) }), comments.filter((c) => c.versionId === a?.id).map((c) => _jsx("p", { className: "t-sm", style: { borderLeft: '3px solid var(--line)', paddingLeft: 10 }, children: c.text }, c.id)), !comments.some((c) => c.versionId === a?.id) && _jsx("p", { className: "t-sm t-mute", children: t('req.noChangesAsked') })] })) : ua && ub ? (_jsxs("div", { className: "relative inline-block", children: [_jsx("img", { src: ub, alt: `v${b?.n}`, className: "block max-h-[78vh] max-w-full" }), _jsx("img", { src: ua, alt: `v${a?.n}`, className: "absolute inset-0 block h-full w-full object-contain", style: { clipPath: `inset(0 ${100 - pos}% 0 0)` } }), _jsx("span", { className: "pointer-events-none absolute inset-y-0", style: { left: `${pos}%`, width: 2, background: '#fff' } }), _jsxs("span", { className: "chip absolute left-3 top-3", style: { background: '#fff' }, children: ["v", a?.n] }), _jsxs("span", { className: "chip absolute right-3 top-3", style: { background: '#fff' }, children: ["v", b?.n] })] })) : _jsx("div", { className: "skel", style: { width: 480, height: 480 } }) }), mode === 'slider' && _jsx("input", { type: "range", min: 0, max: 100, value: pos, onChange: (e) => setPos(Number(e.target.value)), "aria-label": t('req.slider'), className: "mx-auto mt-3 w-full max-w-[640px]", onKeyDown: (e) => { if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
                    e.preventDefault();
                    setPos((p) => Math.max(0, Math.min(100, p + (e.key === 'ArrowRight' ? 25 : -25))));
                } }, step: 5 })] }));
}
