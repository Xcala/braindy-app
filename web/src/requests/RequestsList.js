import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { brainName } from '../components/BrainStack';
import { dateLabel } from '../lib/dates';
import { STATUS_CHIP } from './types';
import { MissingChip, TagChips } from './RequestsBoard';
import { BulkBar } from './BulkBar';
import { pieceLabel, smartDate } from './requestBits';
const LIST_FIRST = 20;
/**
 * Table of requests: the request (with who works on it, when it was asked, its campaign), the piece in a few words,
 * the one date that matters now and the status. NickMark ticks rows (Shift for a range) to change many at once.
 */
export function RequestsList({ brandId, shown, isAdmin, archived, tags }) {
    const { t, lang } = useI18n();
    const [max, setMax] = useState(LIST_FIRST);
    const [picked, setPicked] = useState([]);
    const [anchor, setAnchor] = useState(null);
    const rows = shown.slice(0, max);
    const ids = picked.filter((id) => shown.some((r) => r.id === id));
    const cols = `${isAdmin ? '36px ' : ''}minmax(0,1fr) 170px 190px 150px`;
    const pick = (i, shift) => {
        const id = rows[i].id;
        if (shift && anchor != null)
            setPicked((p) => [...new Set([...p, ...rows.slice(Math.min(anchor, i), Math.max(anchor, i) + 1).map((r) => r.id)])]);
        else
            setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
        setAnchor(i);
    };
    const allOn = rows.length > 0 && rows.every((r) => ids.includes(r.id));
    const check = { width: 28, height: 28, border: 0, background: 'transparent' };
    return (_jsxs("div", { className: "col g12", children: [isAdmin && ids.length > 0 && _jsx(BulkBar, { brandId: brandId, ids: ids, archived: archived, tags: tags, clear: () => setPicked([]) }), _jsxs("div", { className: "table overflow-x-auto", children: [_jsxs("div", { className: "trow head label min-w-[760px]", style: { gridTemplateColumns: cols }, children: [isAdmin && _jsx("label", { className: "fx-check", style: check, children: _jsx("input", { type: "checkbox", checked: allOn, "aria-label": t('files.selectAll'), onChange: () => setPicked(allOn ? [] : rows.map((r) => r.id)) }) }), _jsx("span", { children: t('req.col.request') }), _jsx("span", { children: t('rr.piece') }), _jsx("span", { children: t('rr.date') }), _jsx("span", { children: t('req.col.status') })] }), rows.map((r, i) => {
                        const d = smartDate(r, lang, t);
                        return (_jsxs("div", { className: "trow min-w-[760px]", style: { gridTemplateColumns: cols, background: ids.includes(r.id) ? '#F5F8FF' : r.status === 'to_approve' ? '#FFFBF0' : undefined }, children: [isAdmin && _jsx("label", { className: "fx-check", style: check, children: _jsx("input", { type: "checkbox", checked: ids.includes(r.id), "aria-label": r.title, onClick: (e) => { e.preventDefault(); pick(i, e.shiftKey); }, onChange: () => undefined }) }), _jsxs("span", { className: "row g12 min-w-0", children: [r.leadBrain && _jsx("img", { src: `/brand/brains/${r.leadBrain}.png`, alt: brainName(r.leadBrain), title: t('req.onIt', { brain: brainName(r.leadBrain) }), className: "h-7 w-7 flex-none rounded-full", style: { background: 'var(--niebla)' } }), _jsxs("span", { className: "col min-w-0", style: { gap: 3 }, children: [_jsx(Link, { to: `/requests/${r.id}`, className: "w7 truncate", style: { color: 'var(--ink)', textDecoration: 'none' }, children: r.title }), _jsxs("span", { className: "row g8 wrap t-xs t-mute", children: [r.createdAt && _jsx("span", { children: t('rr.askedOn', { day: dateLabel(r.createdAt.toDate(), lang) }) }), _jsx(TagChips, { tags: r.tags }), isAdmin && _jsx(MissingChip, { r: r })] })] })] }), _jsx("span", { className: "t-sm truncate", children: pieceLabel(r, lang) }), _jsx("span", { className: "t-sm", style: { color: d.late ? '#C0362C' : undefined }, children: d.text }), _jsx("span", { children: _jsx("span", { className: `chip ${STATUS_CHIP[r.status]}`, children: t(`req.status.${r.status}`) }) })] }, r.id));
                    })] }), isAdmin && _jsx("p", { className: "t-xs t-mute fx-hint", style: { margin: 0 }, children: t('files.rangeHint') }), shown.length > max && _jsx("button", { type: "button", className: "btn btn-secondary btn-sm self-start", onClick: () => setMax((m) => m + LIST_FIRST), children: t('files.showMore', { n: LIST_FIRST }) })] }));
}
