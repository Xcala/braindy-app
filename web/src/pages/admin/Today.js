import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { collectionGroup, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useBrands } from '../../brands/BrandProvider';
import { BrandMark } from '../../brands/BrandMark';
import { useI18n } from '../../i18n/I18nProvider';
import { useOpenWork } from '../../team/useWork';
import { dayLabel, daysFrom } from '../../lib/dates';
const daysSince = (ms) => (ms ? Math.floor((Date.now() - ms) / 864e5) : 0);
/** Admin · Today: what needs NickMark across every brand, most urgent first. Replaces "where do I start?". */
export function AdminToday() {
    const { t, lang } = useI18n();
    const { brands, select } = useBrands();
    const { items, loading } = useOpenWork();
    const [pays, setPays] = useState([]);
    useEffect(() => {
        Promise.all([
            getDocs(query(collectionGroup(db, 'transfers'), where('status', '==', 'review'))),
            getDocs(collectionGroup(db, 'billing')),
        ]).then(([tr, bi]) => setPays([
            ...tr.docs.map((d) => ({ brandId: d.ref.parent.parent.id, kind: 'transfer' })),
            ...bi.docs.filter((d) => d.id === 'plan' && d.get('status') === 'past_due').map((d) => ({ brandId: d.ref.parent.parent.id, kind: 'past_due' })),
        ])).catch(() => setPays([]));
    }, []);
    const byId = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);
    const prod = items.filter((i) => i.status === 'in_production');
    const late = prod.filter((i) => i.dueDate && (daysFrom(i.dueDate) ?? 0) < 0);
    const soon = prod.filter((i) => i.dueDate && (daysFrom(i.dueDate) ?? 99) >= 0 && (daysFrom(i.dueDate) ?? 99) <= 3);
    const review = items.filter((i) => i.stage === 'plan' || (i.approvalLevel === 'nicolas' && i.stage === 'work' && (i.versionCount ?? 0) > 0));
    const waiting = items.filter((i) => i.status === 'to_approve' && daysSince(i.updatedAt?.toMillis()) >= 3);
    const byDue = (a, b) => String(a.dueDate).localeCompare(String(b.dueDate));
    const row = (i, note, tone) => (_jsxs(Link, { to: `/requests/${i.id}`, onClick: () => select(i.brandId), className: "trow", style: { gridTemplateColumns: '32px minmax(0,1fr) auto', textDecoration: 'none', color: 'var(--ink)' }, children: [byId.get(i.brandId) ? _jsx(BrandMark, { brand: byId.get(i.brandId) }) : _jsx("span", {}), _jsxs("span", { className: "col", style: { minWidth: 0 }, children: [_jsx("span", { className: "w7 truncate", children: i.title }), _jsx("span", { className: "t-xs t-mute truncate", children: byId.get(i.brandId)?.name ?? i.brandId })] }), _jsx("span", { className: "t-xs whitespace-nowrap", style: { color: tone === 'danger' ? '#C0362C' : 'var(--graphite)', fontWeight: tone ? 700 : 400 }, children: note })] }, `${i.brandId}/${i.id}`));
    const blocks = [
        { key: 'today.late', n: late.length, tone: '#FDECEA', body: late.sort(byDue).map((i) => row(i, t('home.late', { day: dayLabel(i.dueDate, lang) }), 'danger')) },
        { key: 'today.toReview', n: review.length, tone: '#FFF7E3', body: review.map((i) => row(i, i.stage === 'plan' ? t('req.plan') : t('req.review'))) },
        { key: 'today.dueSoon', n: soon.length, body: soon.sort(byDue).map((i) => row(i, t('home.dueDay', { day: dayLabel(i.dueDate, lang) }))) },
        { key: 'today.waitingClient', n: waiting.length, body: waiting.map((i) => row(i, t('today.daysWaiting', { n: daysSince(i.updatedAt?.toMillis()) }))) },
        { key: 'today.billing', n: pays.length, body: pays.map((p) => (_jsxs(Link, { to: "/admin/billing", className: "trow", style: { gridTemplateColumns: '32px minmax(0,1fr) auto', textDecoration: 'none', color: 'var(--ink)' }, children: [byId.get(p.brandId) ? _jsx(BrandMark, { brand: byId.get(p.brandId) }) : _jsx("span", {}), _jsx("span", { className: "w7 truncate", children: byId.get(p.brandId)?.name ?? p.brandId }), _jsx("span", { className: "t-xs t-mute", children: p.kind === 'transfer' ? t('bill.a.toConfirm') : t('bill.a.overdue') })] }, `${p.brandId}-${p.kind}`))) },
    ];
    return (_jsxs("div", { className: "col g24", children: [_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", children: new Date().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }) }), _jsxs("h1", { className: "h1", children: [_jsxs("span", { className: "w9", children: [t('today.title'), "."] }), " ", t('today.sub')] })] }), loading ? _jsx("div", { className: "skel", style: { height: 240 } }) : (_jsx("div", { className: "grid grid-cols-1 items-start gap-5 lg:grid-cols-2", children: blocks.map((b) => (_jsxs("section", { className: "card col g8", style: b.n && b.tone ? { background: b.tone, border: 0 } : undefined, "aria-label": t(b.key), children: [_jsxs("div", { className: "row between", children: [_jsx("h2", { className: "h3", children: t(b.key) }), _jsx("span", { className: "h3", children: b.n })] }), b.n === 0 ? _jsx("p", { className: "t-sm t-mute", children: t('today.clear') }) : _jsx("div", { className: "col", children: b.body })] }, b.key))) }))] }));
}
