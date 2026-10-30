import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { brainName } from '../components/BrainStack';
import { dayLabel, isOverdue } from '../lib/dates';
import { useRequests } from '../requests/useRequests';
import { findCategory, findSub } from '../requests/taxonomy';
import { STATUS_CHIP } from '../requests/types';
import { AskBox } from '../requests/AskBox';
import { useAuth } from '../auth/AuthProvider';
import { moveRequest } from '../requests/moveRequest';
const COLUMNS = [
    { status: 'in_production', bg: '#EEF1F7' }, { status: 'to_approve', bg: '#FFF7E3' },
    { status: 'approved', bg: '#EEF1F7' }, { status: 'published', bg: '#EEF1F7' },
];
export function brainState(r) {
    return r.status === 'to_approve' ? 'approval' : r.status === 'in_production' ? 'working' : 'idle';
}
export function Requests() {
    const { current } = useBrands();
    const { t, lang } = useI18n();
    const { list, loading } = useRequests(current?.id);
    const [view, setView] = useState('board');
    const isAdmin = useAuth().profile?.role === 'admin';
    const [dragId, setDragId] = useState(null);
    const [overCol, setOverCol] = useState(null);
    const [moveError, setMoveError] = useState(false);
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    const typeLabel = (r) => [findCategory(r.category)?.label[lang], findSub(r.category, r.subcategory)?.label[lang]].filter(Boolean).join(' · ');
    const toApprove = list.filter((r) => r.status === 'to_approve').length;
    const drop = (status) => {
        const r = list.find((x) => x.id === dragId);
        setDragId(null);
        setOverCol(null);
        setMoveError(false);
        if (r && r.status !== status)
            moveRequest(current.id, r.id, status).catch(() => setMoveError(true));
    };
    return (_jsxs("div", { className: "col g24", children: [_jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4", children: [_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", children: current.name }), _jsxs("h1", { className: "h1", children: [_jsxs("span", { className: "w9", children: [t('nav.requests'), "."] }), " ", t('req.tagline')] })] }), toApprove > 1 && _jsx(Link, { className: "btn btn-secondary", to: "/requests/approve", children: t('req.batch', { n: toApprove }) })] }), _jsxs("div", { className: "grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)]", children: [_jsx(AskBox, { brandId: current.id }), _jsx(InMotion, { list: list, loading: loading })] }), _jsxs("div", { className: "row between g12 wrap", children: [_jsx("h2", { className: "h3", children: t('req.allRequests') }), _jsxs("div", { className: "seg", role: "group", "aria-label": t('files.view'), children: [_jsx("button", { className: view === 'list' ? 'is-on' : '', "aria-pressed": view === 'list', onClick: () => setView('list'), children: t('req.list') }), _jsx("button", { className: view === 'board' ? 'is-on' : '', "aria-pressed": view === 'board', onClick: () => setView('board'), children: t('req.board') })] })] }), loading ? _jsx("div", { className: "grid gap-5 md:grid-cols-4", children: [0, 1, 2, 3].map((i) => _jsx("div", { className: "skel", style: { height: 300 } }, i)) })
                : list.length === 0 ? (_jsx("div", { className: "card empty", children: _jsx("p", { className: "h3", children: t('req.empty') }) })) : view === 'board' ? (_jsxs("div", { className: "col g8", children: [isAdmin && _jsx("p", { className: "t-xs t-mute", children: t(moveError ? 'req.moveError' : 'req.dragHint') }), _jsx("div", { className: "grid items-start gap-5 md:grid-cols-2 xl:grid-cols-4", children: COLUMNS.map(({ status, bg }) => {
                                const items = list.filter((r) => r.status === status);
                                const target = isAdmin ? {
                                    onDragOver: (e) => { if (dragId) {
                                        e.preventDefault();
                                        setOverCol(status);
                                    } },
                                    onDragLeave: (e) => { if (!e.currentTarget.contains(e.relatedTarget))
                                        setOverCol(null); },
                                    onDrop: (e) => { e.preventDefault(); drop(status); },
                                } : {};
                                return (_jsxs("section", { ...target, className: "col g12 rounded-[24px] p-4", "aria-label": t(`req.status.${status}`), style: { background: bg, minHeight: 320, outline: overCol === status ? '2px dashed var(--azul)' : undefined, outlineOffset: -2 }, children: [_jsxs("div", { className: "row between", children: [_jsx("span", { className: `chip ${STATUS_CHIP[status]}`, children: t(`req.status.${status}`) }), _jsx("span", { className: "t-sm t-mute", children: items.length })] }), items.map((r) => (_jsxs(Link, { to: `/requests/${r.id}`, className: "card col", draggable: isAdmin, onDragStart: isAdmin ? (e) => { setDragId(r.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', r.id); } : undefined, onDragEnd: () => { setDragId(null); setOverCol(null); }, style: { padding: 16, gap: 10, textDecoration: 'none', color: 'var(--ink)', borderColor: status === 'to_approve' ? '#F5D98A' : undefined, cursor: isAdmin ? 'grab' : undefined, opacity: dragId === r.id ? 0.5 : 1 }, children: [_jsx("span", { className: "w7", children: r.title }), r.formatType && r.formatType !== r.title && _jsx("span", { className: "t-xs t-mute", children: r.formatType }), r.versionCount ? _jsxs("span", { className: "row g8", children: [_jsx("span", { className: "chip chip-plain c-type", style: { height: 22 }, children: t("home.version", { n: r.versionCount }) }), r.approvalLevel === 'nicolas' && _jsx("span", { className: "t-xs t-mute", children: t('req.reviewedByNicolas') })] }) : null, _jsxs("div", { className: "row between g8", children: [_jsxs("span", { className: "row g8", style: { minWidth: 0 }, children: [r.leadBrain && _jsx("img", { src: `/brand/brains/${r.leadBrain}.png`, alt: "", className: "h-6 w-6 flex-none rounded-full", style: { background: 'var(--niebla)' } }), _jsx("span", { className: "t-xs t-mute truncate", children: status === 'in_production' ? t('req.onIt', { brain: brainName(r.leadBrain) }) : t('req.madeByReviewed') })] }), status === 'to_approve' && _jsx("span", { className: "btn btn-primary btn-sm flex-none", style: { height: 32 }, children: t('req.review') })] }), status === 'in_production' && r.dueDate && _jsx("span", { className: "t-xs", style: { color: isOverdue(r.dueDate) ? '#C0362C' : 'var(--graphite)' }, children: t(isOverdue(r.dueDate) ? 'home.late' : 'home.dueDay', { day: dayLabel(r.dueDate, lang) }) })] }, r.id)))] }, status));
                            }) })] })) : (_jsxs("div", { className: "table overflow-x-auto", children: [_jsxs("div", { className: "trow head label min-w-[760px]", style: { gridTemplateColumns: 'minmax(0,1fr) 200px 110px 200px 140px' }, children: [_jsx("span", { children: t('req.col.request') }), _jsx("span", { children: t('req.col.type') }), _jsx("span", { children: t('req.col.due') }), _jsx("span", { children: t('req.col.brains') }), _jsx("span", { children: t('req.col.status') })] }), list.map((r) => (_jsxs("div", { className: "trow min-w-[760px]", style: { gridTemplateColumns: 'minmax(0,1fr) 200px 110px 200px 140px', background: r.status === 'to_approve' ? '#FFFBF0' : undefined }, children: [_jsx(Link, { to: `/requests/${r.id}`, className: "w7 truncate", style: { color: 'var(--ink)', textDecoration: 'none' }, children: r.title }), _jsx("span", { className: "t-sm truncate", children: typeLabel(r) }), _jsx("span", { className: "t-sm", children: r.dueDate ? dayLabel(r.dueDate, lang) : '—' }), _jsx("span", { className: "t-sm truncate", children: t('req.onIt', { brain: brainName(r.leadBrain) }) }), _jsx("span", { children: _jsx("span", { className: `chip ${STATUS_CHIP[r.status]}`, children: t(`req.status.${r.status}`) }) })] }, r.id)))] }))] }));
}
/** Right of the ask box: what is moving now (waiting for the client first, then in production by due date). */
function InMotion({ list, loading }) {
    const { t, lang } = useI18n();
    const items = list.filter((r) => r.status === 'to_approve' || r.status === 'in_production')
        .sort((a, b) => (a.status === b.status ? String(a.dueDate ?? '9999').localeCompare(String(b.dueDate ?? '9999')) : a.status === 'to_approve' ? -1 : 1))
        .slice(0, 6);
    return (_jsxs("section", { className: "card col g12", "aria-labelledby": "h-motion", children: [_jsx("h2", { className: "h3", id: "h-motion", children: t('req.inMotion') }), loading && _jsx("div", { className: "skel", style: { height: 120 } }), !loading && items.length === 0 && _jsx("p", { className: "t-sm t-mute", children: t('req.inMotionEmpty') }), items.map((r) => (_jsxs(Link, { to: `/requests/${r.id}`, className: "row g12", style: { textDecoration: 'none', color: 'var(--ink)', padding: '8px 0', borderTop: '1px solid var(--line)' }, children: [r.leadBrain && _jsx("img", { src: `/brand/brains/${r.leadBrain}.png`, alt: "", className: "h-8 w-8 flex-none rounded-full", style: { background: 'var(--niebla)' } }), _jsxs("span", { className: "col grow min-w-0", children: [_jsx("span", { className: "w7 truncate", children: r.title }), _jsxs("span", { className: "t-xs t-mute truncate", children: [r.status === 'in_production' ? t('req.onIt', { brain: brainName(r.leadBrain) }) : t('req.madeByReviewed'), r.dueDate ? ` · ${dayLabel(r.dueDate, lang)}` : ''] })] }), _jsx("span", { className: `chip flex-none ${STATUS_CHIP[r.status]}`, children: t(`req.status.${r.status}`) })] }, r.id)))] }));
}
