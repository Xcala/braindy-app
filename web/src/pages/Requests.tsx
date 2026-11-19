import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import type { BrainState } from '../components/BrainStack';
import { dateLabel } from '../lib/dates';
import { useRequests } from '../requests/useRequests';
import { findCategory, findSub } from '../requests/taxonomy';
import type { BrandRequest } from '../requests/types';
import { useAuth } from '../auth/AuthProvider';
import { RequestsToolbar, type View } from '../requests/RequestsToolbar';
import { RequestsBoard, COLUMNS } from '../requests/RequestsBoard';
import { RequestsList } from '../requests/RequestsList';
import { DueCalendar } from '../requests/DueCalendar';
import { DeliveryPace } from '../requests/DeliveryPace';
import { AskPanel } from '../requests/ask/AskPanel';
import { downloadCsv, printPdf, rowOf } from '../requests/exportRequests';
import { NO_FILTERS, filtersFromParams, filtersToParams, inTab, isLate, narrow, sortRequests, type ReqFilters } from '../requests/requestFilters';

const VIEWS: View[] = ['list', 'board', 'calendar'];

export function brainState(r: BrandRequest): BrainState {
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
  const [viewLocal, setViewLocal] = useState<View | null>(null);
  // Old links to the ask box (/ask, /requests#ask) open the panel.
  useEffect(() => { if (hash === '#ask') { const p = new URLSearchParams(params); p.set('new', '1'); setParams(p, { replace: true }); } }, [hash]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;

  const f = filtersFromParams(params);
  const view: View = VIEWS.includes(params.get('view') as View) ? (params.get('view') as View) : viewLocal ?? (isAdmin ? 'board' : 'list');
  const asking = params.get('new') === '1';
  const setParam = (k: string, v: string | null) => { const p = new URLSearchParams(params); if (v == null) p.delete(k); else p.set(k, v); setParams(p, { replace: k !== 'new' }); };
  const setFilters = (next: ReqFilters) => setParams(filtersToParams(next, params), { replace: true });
  const setView = (v: View) => { setViewLocal(v); setParam('view', v); };

  const typeLabel = (r: BrandRequest) => [findCategory(r.category)?.label[lang], findSub(r.category, r.subcategory)?.label[lang]].filter(Boolean).join(' · ');
  const toApprove = list.filter((r) => !r.archived && r.status === 'to_approve').length;
  const tags = [...new Set(list.flatMap((r) => r.tags ?? []))].sort((a, b) => a.localeCompare(b));
  const narrowed = narrow(list, f, typeLabel);
  const shown = sortRequests(narrowed.filter((r) => inTab(f.tab, r)), f.sort);
  const columns = COLUMNS.filter(({ status }) => f.tab === 'all' || (f.tab === 'late' ? status === 'in_production'
    : f.tab === 'active' ? status === 'in_production' || status === 'to_approve' : f.tab === 'done' ? status === 'approved' || status === 'published' : status === f.tab));

  const head = [t('req.col.request'), t('req.col.requested'), t('req.col.type'), t('req.col.due'), t('req.col.status'), t('rf.tag'), t('rf.versions')];
  const rows = () => shown.map((r) => rowOf(r, { requested: dateLabel(r.createdAt?.toDate(), lang), type: typeLabel(r), due: r.dueDate ? String(r.dueDate) : '', status: isLate(r) ? t('rf.tab.late') : t(`req.status.${r.status}`) }));
  const fileName = `${current.name} · ${t('nav.requests')} · ${new Date().toISOString().slice(0, 10)}`;

  return (
    <div className="col g24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="col g8">
          <p className="label">{current.name}</p>
          <h1 className="h1"><span className="w9">{t('nav.requests')}.</span></h1>
          {!loading && <DeliveryPace list={list} />}
        </div>
        <div className="row g8 wrap">
          {toApprove > 1 && <Link className="btn btn-secondary" to="/requests/approve">{t('req.batch', { n: toApprove })}</Link>}
          <button type="button" className="btn btn-primary" data-tour="ask-open" onClick={() => setParam('new', '1')}><Icon name="plus" size={18} />{t('as.new')}</button>
        </div>
      </div>

      {!loading && list.length > 0 && (
        <RequestsToolbar brandId={current.id} all={list} narrowed={narrowed} shown={shown.length} f={f} set={setFilters} tags={tags} isAdmin={isAdmin} view={view} setView={setView}
          onCsv={() => downloadCsv(fileName, head, rows())} onPdf={() => printPdf(`${current.name} · ${t('nav.requests')}`, t('rf.count', { n: shown.length, total: list.length }), head, rows())} />
      )}

      {loading ? <div className="grid gap-5 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skel" style={{ height: '18.75rem' }} />)}</div>
        : list.length === 0 ? (
          <div className="card empty col g12"><p className="h3">{t('req.empty')}</p><button type="button" className="btn btn-primary self-start" onClick={() => setParam('new', '1')}><Icon name="plus" size={18} />{t('as.new')}</button></div>
        ) : shown.length === 0 && view !== 'calendar' ? (
          <div className="card empty col g12"><p className="h3">{t('rf.none')}</p><button type="button" className="btn btn-secondary btn-sm self-start" onClick={() => setFilters(NO_FILTERS)}>{t('rf.clear')}</button></div>
        ) : view === 'board' ? <RequestsBoard brandId={current.id} shown={shown} columns={columns} isAdmin={isAdmin} />
        : view === 'calendar' ? <DueCalendar shown={shown} />
        : <RequestsList brandId={current.id} shown={shown} isAdmin={isAdmin} archived={f.archived} tags={tags} />}

      {asking && <AskPanel brandId={current.id} list={list} initial={params.get('text') ? {
        intent: '', answers: {}, text: params.get('text')!.slice(0, 2000), category: params.get('cat') ?? undefined, sub: params.get('sub') ?? undefined,
        links: params.get('link') ? [params.get('link')!] : [],
      } : null} onClose={() => { const p = new URLSearchParams(params); ['new', 'text', 'link', 'cat', 'sub'].forEach((k) => p.delete(k)); setParams(p); }} />}
    </div>
  );
}
