import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { daysFrom } from '../lib/dates';
import { isLate } from './requestFilters';
import { missingOf, smartDate } from './requestBits';
/**
 * "Your turn": only what needs someone, shown only when there is something. The client sees what waits for their
 * approval; NickMark sees what waits for the client, what is late, what is due this week and what arrived incomplete
 * (with a button that asks the client for the missing part as a comment on the request).
 */
export function ActionStrip({ brandId, list, isAdmin }) {
    const { t, lang } = useI18n();
    const open = list.filter((r) => !r.archived);
    const week = (r) => { const n = daysFrom(r.dueDate); return r.status === 'in_production' && n != null && n >= 0 && n <= 7; };
    const groups = (isAdmin
        ? [
            { key: 'late', items: open.filter(isLate) },
            { key: 'week', items: open.filter(week) },
            { key: 'incomplete', items: open.filter((r) => missingOf(r).length && !r.askedMissingAt) },
            { key: 'waiting', items: open.filter((r) => r.status === 'to_approve') },
        ]
        : [{ key: 'approve', items: open.filter((r) => r.status === 'to_approve') }]).filter((g) => g.items.length);
    if (!groups.length)
        return null;
    return (_jsxs("section", { className: "card col g16", "aria-labelledby": "h-turn", style: { borderColor: isAdmin ? undefined : '#F5D98A', background: isAdmin ? undefined : '#FFFCF3' }, children: [_jsx("h2", { className: "h3", id: "h-turn", style: { margin: 0 }, children: t(isAdmin ? 'at.titleAdmin' : 'at.title') }), _jsx("div", { className: `grid gap-5 ${groups.length > 1 ? 'md:grid-cols-2 xl:grid-cols-4' : ''}`, children: groups.map((g) => (_jsxs("div", { className: "col g8 min-w-0", children: [(isAdmin || groups.length > 1) && _jsx("p", { className: "label", style: { margin: 0, color: g.key === 'late' ? '#C0362C' : undefined }, children: t(`at.${g.key}`, { n: g.items.length }) }), g.items.slice(0, 3).map((r) => _jsx(Row, { brandId: brandId, r: r, kind: g.key, sub: g.key === 'incomplete' ? missingOf(r) : null, date: smartDate(r, lang, t).text }, r.id)), g.items.length > 3 && _jsx("span", { className: "t-xs t-mute", children: t('at.more', { n: g.items.length - 3 }) })] }, g.key))) })] }));
}
function Row({ brandId, r, kind, sub, date }) {
    const { t } = useI18n();
    const { user } = useAuth();
    const [state, setState] = useState('idle');
    const ask = async () => {
        if (!user || !sub)
            return;
        setState('busy');
        try {
            await addDoc(collection(db, 'brands', brandId, 'requests', r.id, 'comments'), { author: user.uid, text: [t('at.askIntro'), ...sub.map((k) => `• ${t(`at.ask.${k}`)}`)].join('\n'), kind: 'missing_info', createdAt: serverTimestamp() });
            await updateDoc(doc(db, 'brands', brandId, 'requests', r.id), { askedMissingAt: serverTimestamp() });
            setState('done');
        }
        catch {
            setState('error');
        }
    };
    return (_jsxs("div", { className: "row g8", style: { padding: '8px 0', borderTop: '1px solid var(--line)' }, children: [_jsxs(Link, { to: `/requests/${r.id}`, className: "col grow min-w-0", style: { textDecoration: 'none', color: 'var(--ink)' }, children: [_jsx("span", { className: "t-sm w7 truncate", children: r.title }), _jsx("span", { className: "t-xs t-mute truncate", children: sub ? t('rr.missing', { what: sub.map((k) => t(`rr.miss.${k}`)).join(' · ') }) : date })] }), kind === 'approve' && _jsx(Link, { to: `/requests/${r.id}`, className: "btn btn-primary btn-sm flex-none", style: { height: 32 }, children: t('req.review') }), kind === 'incomplete' && (_jsx("button", { type: "button", className: "btn btn-secondary btn-sm flex-none", style: { height: 32 }, disabled: state === 'busy' || state === 'done', onClick: ask, children: t(state === 'done' ? 'at.asked' : state === 'error' ? 'files.actionError' : 'at.askBtn') }))] }));
}
