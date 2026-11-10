import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n/I18nProvider';
import { useProposals } from '../../proposals/useProposals';
import { ActivityLine } from '../../proposals/ActivityLine';
import { STATUS_CHIP } from '../../proposals/types';
const STATUSES = ['draft', 'sent', 'won', 'lost'];
const COLS = 'minmax(0,1fr) 200px 120px 280px 130px';
export function AdminProposals() {
    const { t, lang } = useI18n();
    const { list, loading } = useProposals();
    const [filter, setFilter] = useState(null);
    const navigate = useNavigate();
    async function create() {
        const ref = await addDoc(collection(db, 'proposals'), {
            title: t('proposals.newTitle'), status: 'draft', lang, prospect: {}, recommended: 'transform',
            createdAt: serverTimestamp(), lastActivity: { type: 'created', at: serverTimestamp() },
        });
        navigate(`/admin/proposals/${ref.id}`);
    }
    const shown = filter ? list.filter((p) => p.status === filter) : list;
    return (_jsxs("section", { className: "col g24", children: [_jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4", children: [_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", children: t('proposals.kicker') }), _jsx("h1", { className: "h1", children: _jsxs("span", { className: "w9", children: [t('proposals.title'), "."] }) })] }), _jsxs("button", { className: "btn btn-primary", onClick: create, children: ["+ ", t('proposals.new')] })] }), _jsx("div", { className: "grid grid-cols-2 gap-4 lg:grid-cols-4", children: STATUSES.map((s) => (_jsxs("button", { onClick: () => setFilter((f) => (f === s ? null : s)), className: "card card-tight col text-left", style: { gap: 6, cursor: 'pointer', ...(filter === s ? { borderColor: 'var(--azul)', boxShadow: '0 0 0 1px var(--azul)' } : {}) }, "aria-pressed": filter === s, children: [_jsx("span", { className: `chip ${STATUS_CHIP[s]}`, style: { alignSelf: 'flex-start' }, children: t(`proposals.status.${s}`) }), _jsx("span", { className: "d-lg w9", style: { fontSize: 40 }, children: list.filter((p) => p.status === s).length }), _jsx("span", { className: "t-sm t-mute", children: t(`proposals.statusHint.${s}`) })] }, s))) }), _jsxs("div", { className: "table overflow-x-auto", children: [_jsxs("div", { className: "trow head label min-w-[820px]", style: { gridTemplateColumns: COLS }, children: [_jsx("span", { children: t('proposals.col.proposal') }), _jsx("span", { children: t('proposals.col.prospect') }), _jsx("span", { children: t('proposals.col.status') }), _jsx("span", { children: t('proposals.col.activity') }), _jsx("span", {})] }), loading && _jsx("div", { className: "trow", children: _jsxs("span", { className: "t-mute", children: [t('common.loading'), "\u2026"] }) }), !loading && !shown.length && _jsx("div", { className: "trow", children: _jsx("span", { className: "t-mute", children: t('proposals.empty') }) }), shown.map((p) => (_jsxs("div", { className: "trow min-w-[820px]", style: { gridTemplateColumns: COLS, color: p.status === 'lost' ? 'var(--graphite)' : undefined }, children: [_jsx(Link, { to: `/admin/proposals/${p.id}`, className: "w7 truncate", style: { color: 'inherit', textDecoration: 'none' }, children: p.title }), _jsx("span", { className: "truncate", children: p.prospect?.company || p.prospect?.name || _jsx("span", { className: "t-mute", children: "\u2014" }) }), _jsx("span", { children: _jsx("span", { className: `chip ${STATUS_CHIP[p.status]}`, children: t(`proposals.status.${p.status}`) }) }), _jsx(ActivityLine, { activity: p.lastActivity }), p.status === 'won' && !p.convertedBrandId
                                ? _jsx(Link, { className: "btn btn-primary btn-sm", to: `/admin/proposals/${p.id}`, children: t('proposals.createClient') })
                                : _jsx(Link, { className: "btn btn-secondary btn-sm", to: `/admin/proposals/${p.id}`, children: t('common.open') })] }, p.id)))] })] }));
}
