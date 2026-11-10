import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { dateLabel } from '../lib/dates';
import { useRequests } from '../requests/useRequests';
import { findCategory, findSub } from '../requests/taxonomy';
import { useAuth } from '../auth/AuthProvider';
import { RequestsToolbar } from '../requests/RequestsToolbar';
import { RequestsBoard, COLUMNS } from '../requests/RequestsBoard';
import { RequestsList } from '../requests/RequestsList';
import { DueCalendar } from '../requests/DueCalendar';
import { DeliveryPace } from '../requests/DeliveryPace';
import { ActionStrip } from '../requests/ActionStrip';
import { AskPanel } from '../requests/ask/AskPanel';
import { downloadCsv, printPdf, rowOf } from '../requests/exportRequests';
import { NO_FILTERS, filtersFromParams, filtersToParams, inTab, isLate, narrow, sortRequests } from '../requests/requestFilters';
const VIEWS = ['list', 'board', 'calendar'];
export function brainState(r) {
    return r.status === 'to_approve' ? 'approval' : r.status === 'in_production' ? 'working' : 'idle';
}
/**
 * Requests: the title with the brand's pace and "New request" (a side panel); "Your turn" only when something waits;
 * one toolbar; then the list, board or calendar. Filters, view and the open panel live in the address.
 */
export function Requests() {
    const { current } = useBrands();
    const { t, lang } = useI18n();
    const { list, loading } = useRequests(current?.id);
    const isAdmin = useAuth().profile?.role === 'admin';
    const [params, setParams] = useSearchParams();
    const { hash } = useLocation();
    const [viewLocal, setViewLocal] = useState(null);
    // Old links to the ask box (/ask, /requests#ask) open the panel.
    useEffect(() => { if (hash === '#ask') {
        const p = new URLSearchParams(params);
        p.set('new', '1');
        setParams(p, { replace: true });
    } }, [hash]); // eslint-disable-line react-hooks/exhaustive-deps
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    const f = filtersFromParams(params);
    const view = VIEWS.includes(params.get('view')) ? params.get('view') : viewLocal ?? (isAdmin ? 'board' : 'list');
    const asking = params.get('new') === '1';
    const setParam = (k, v) => { const p = new URLSearchParams(params); if (v == null)
        p.delete(k);
    else
        p.set(k, v); setParams(p, { replace: k !== 'new' }); };
    const setFilters = (next) => setParams(filtersToParams(next, params), { replace: true });
    const setView = (v) => { setViewLocal(v); setParam('view', v); };
    const typeLabel = (r) => [findCategory(r.category)?.label[lang], findSub(r.category, r.subcategory)?.label[lang]].filter(Boolean).join(' · ');
    const toApprove = list.filter((r) => !r.archived && r.status === 'to_approve').length;
    const tags = [...new Set(list.flatMap((r) => r.tags ?? []))].sort((a, b) => a.localeCompare(b));
    const narrowed = narrow(list, f, typeLabel);
    const shown = sortRequests(narrowed.filter((r) => inTab(f.tab, r)), f.sort);
    const columns = COLUMNS.filter(({ status }) => f.tab === 'all' || (f.tab === 'late' ? status === 'in_production'
        : f.tab === 'active' ? status === 'in_production' || status === 'to_approve' : f.tab === 'done' ? status === 'approved' || status === 'published' : status === f.tab));
    const head = [t('req.col.request'), t('req.col.requested'), t('req.col.type'), t('req.col.due'), t('req.col.status'), t('rf.tag'), t('rf.versions')];
    const rows = () => shown.map((r) => rowOf(r, { requested: dateLabel(r.createdAt?.toDate(), lang), type: typeLabel(r), due: r.dueDate ? String(r.dueDate) : '', status: isLate(r) ? t('rf.tab.late') : t(`req.status.${r.status}`) }));
    const fileName = `${current.name} · ${t('nav.requests')} · ${new Date().toISOString().slice(0, 10)}`;
    return (_jsxs("div", { className: "col g24", children: [_jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4", children: [_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", children: current.name }), _jsx("h1", { className: "h1", children: _jsxs("span", { className: "w9", children: [t('nav.requests'), "."] }) }), !loading && _jsx(DeliveryPace, { list: list })] }), _jsxs("div", { className: "row g8 wrap", children: [toApprove > 1 && _jsx(Link, { className: "btn btn-secondary", to: "/requests/approve", children: t('req.batch', { n: toApprove }) }), _jsxs("button", { type: "button", className: "btn btn-primary", "data-tour": "ask-open", onClick: () => setParam('new', '1'), children: [_jsx(Icon, { name: "plus", size: 18 }), t('as.new')] })] })] }), !loading && _jsx(ActionStrip, { brandId: current.id, list: list, isAdmin: isAdmin }), !loading && list.length > 0 && (_jsx(RequestsToolbar, { brandId: current.id, all: list, narrowed: narrowed, shown: shown.length, f: f, set: setFilters, tags: tags, isAdmin: isAdmin, view: view, setView: setView, onCsv: () => downloadCsv(fileName, head, rows()), onPdf: () => printPdf(`${current.name} · ${t('nav.requests')}`, t('rf.count', { n: shown.length, total: list.length }), head, rows()) })), loading ? _jsx("div", { className: "grid gap-5 md:grid-cols-4", children: [0, 1, 2, 3].map((i) => _jsx("div", { className: "skel", style: { height: 300 } }, i)) })
                : list.length === 0 ? (_jsxs("div", { className: "card empty col g12", children: [_jsx("p", { className: "h3", children: t('req.empty') }), _jsxs("button", { type: "button", className: "btn btn-primary self-start", onClick: () => setParam('new', '1'), children: [_jsx(Icon, { name: "plus", size: 18 }), t('as.new')] })] })) : shown.length === 0 && view !== 'calendar' ? (_jsxs("div", { className: "card empty col g12", children: [_jsx("p", { className: "h3", children: t('rf.none') }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm self-start", onClick: () => setFilters(NO_FILTERS), children: t('rf.clear') })] })) : view === 'board' ? _jsx(RequestsBoard, { brandId: current.id, shown: shown, columns: columns, isAdmin: isAdmin })
                    : view === 'calendar' ? _jsx(DueCalendar, { shown: shown })
                        : _jsx(RequestsList, { brandId: current.id, shown: shown, isAdmin: isAdmin, archived: f.archived, tags: tags }), asking && _jsx(AskPanel, { brandId: current.id, list: list, initial: params.get('text') ? {
                    intent: '', answers: {}, text: params.get('text').slice(0, 2000), category: params.get('cat') ?? undefined, sub: params.get('sub') ?? undefined,
                    links: params.get('link') ? [params.get('link')] : [],
                } : null, onClose: () => { const p = new URLSearchParams(params); ['new', 'text', 'link', 'cat', 'sub'].forEach((k) => p.delete(k)); setParams(p); } })] }));
}
