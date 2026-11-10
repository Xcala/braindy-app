import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { brainName } from '../components/BrainStack';
import { dateLabel } from '../lib/dates';
import { STATUS_CHIP } from './types';
import { moveRequest } from './moveRequest';
import { missingOf, pieceLabel, smartDate } from './requestBits';
export const COLUMNS = [
    { status: 'in_production', bg: '#EEF1F7' }, { status: 'to_approve', bg: '#FFF7E3' },
    { status: 'approved', bg: '#EEF1F7' }, { status: 'published', bg: '#EEF1F7' },
];
// Each column starts short; the rest opens on request so the page does not run for metres.
const COL_FIRST = 6;
export function TagChips({ tags }) {
    if (!tags?.length)
        return null;
    return _jsx("span", { className: "row g4 wrap", children: tags.map((g) => _jsxs("span", { className: "chip chip-plain", style: { height: 22, fontSize: 11, background: '#F2F5FF', color: 'var(--azul)' }, children: ["#", g] }, g)) });
}
/** NickMark only: what an open request still lacks ("Missing: date · where"). */
export function MissingChip({ r }) {
    const { t } = useI18n();
    const m = missingOf(r);
    if (!m.length)
        return null;
    return _jsx("span", { className: "chip chip-plain", style: { height: 22, fontSize: 11, background: '#FFF4E5', color: '#8A4B00' }, children: t('rr.missing', { what: m.map((k) => t(`rr.miss.${k}`)).join(' · ') }) });
}
/** Board by status. NickMark drags a card to another column to move it. */
export function RequestsBoard({ brandId, shown, columns, isAdmin }) {
    const { t, lang } = useI18n();
    const [dragId, setDragId] = useState(null);
    const [overCol, setOverCol] = useState(null);
    const [moveError, setMoveError] = useState(false);
    const [openCols, setOpenCols] = useState([]);
    const drop = (status) => {
        const r = shown.find((x) => x.id === dragId);
        setDragId(null);
        setOverCol(null);
        setMoveError(false);
        if (r && r.status !== status)
            moveRequest(brandId, r.id, status).catch(() => setMoveError(true));
    };
    return (_jsxs("div", { className: "col g8", children: [isAdmin && _jsx("p", { className: "t-xs t-mute", children: t(moveError ? 'req.moveError' : 'req.dragHint') }), _jsx("div", { className: `grid grid-cols-1 items-start gap-5 md:grid-cols-2 ${columns.length > 2 ? 'xl:grid-cols-4' : ''}`, children: columns.map(({ status, bg }) => {
                    const all = shown.filter((r) => r.status === status);
                    const items = openCols.includes(status) ? all : all.slice(0, COL_FIRST);
                    const target = isAdmin ? {
                        onDragOver: (e) => { if (dragId) {
                            e.preventDefault();
                            setOverCol(status);
                        } },
                        onDragLeave: (e) => { if (!e.currentTarget.contains(e.relatedTarget))
                            setOverCol(null); },
                        onDrop: (e) => { e.preventDefault(); drop(status); },
                    } : {};
                    return (_jsxs("section", { ...target, className: "col g12 rounded-[24px] p-4", "aria-label": t(`req.status.${status}`), style: { background: bg, minHeight: 320, outline: overCol === status ? '2px dashed var(--azul)' : undefined, outlineOffset: -2 }, children: [_jsxs("div", { className: "row between", children: [_jsx("span", { className: `chip ${STATUS_CHIP[status]}`, children: t(`req.status.${status}`) }), _jsx("span", { className: "t-sm t-mute", children: all.length })] }), items.map((r) => (_jsxs(Link, { to: `/requests/${r.id}`, className: "card col", draggable: isAdmin, onDragStart: isAdmin ? (e) => { setDragId(r.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', r.id); } : undefined, onDragEnd: () => { setDragId(null); setOverCol(null); }, style: { padding: 16, gap: 10, textDecoration: 'none', color: 'var(--ink)', borderColor: status === 'to_approve' ? '#F5D98A' : undefined, cursor: isAdmin ? 'grab' : undefined, opacity: dragId === r.id ? 0.5 : 1 }, children: [_jsx("span", { className: "w7", style: { overflowWrap: 'anywhere' }, children: r.title }), r.createdAt && _jsx("span", { className: "t-xs t-mute", children: t('req.requestedOn', { day: dateLabel(r.createdAt.toDate(), lang) }) }), pieceLabel(r, lang) && _jsx("span", { className: "t-xs t-mute", children: pieceLabel(r, lang) }), _jsx(TagChips, { tags: r.tags }), isAdmin && _jsx(MissingChip, { r: r }), r.versionCount ? _jsxs("span", { className: "row g8", children: [_jsx("span", { className: "chip chip-plain c-type", style: { height: 22 }, children: t('home.version', { n: r.versionCount }) }), r.approvalLevel === 'nicolas' && _jsx("span", { className: "t-xs t-mute", children: t('req.reviewedByNicolas') })] }) : null, _jsxs("div", { className: "row between g8", children: [_jsxs("span", { className: "row g8", style: { minWidth: 0 }, children: [r.leadBrain && _jsx("img", { src: `/brand/brains/${r.leadBrain}.png`, alt: "", className: "h-6 w-6 flex-none rounded-full", style: { background: 'var(--niebla)' } }), _jsx("span", { className: "t-xs t-mute truncate", children: status === 'in_production' ? t('req.onIt', { brain: brainName(r.leadBrain) }) : t('req.madeByReviewed') })] }), status === 'to_approve' && _jsx("span", { className: "btn btn-primary btn-sm flex-none", style: { height: 32 }, children: t('req.review') })] }), (() => { const d = smartDate(r, lang, t); return d.text && _jsx("span", { className: "t-xs", style: { color: d.late ? '#C0362C' : 'var(--graphite)' }, children: d.text }); })()] }, r.id))), all.length > COL_FIRST && (_jsx("button", { type: "button", className: "btn btn-ghost btn-sm self-start", onClick: () => setOpenCols((c) => (c.includes(status) ? c.filter((x) => x !== status) : [...c, status])), children: openCols.includes(status) ? t('common.showLess') : t('req.moreN', { n: all.length - COL_FIRST }) }))] }, status));
                }) })] }));
}
