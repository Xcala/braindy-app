import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { brainName, type BrainState } from '../components/BrainStack';
import { dateLabel, dayLabel } from '../lib/dates';
import { useRequests } from '../requests/useRequests';
import { findCategory, findSub } from '../requests/taxonomy';
import { STATUS_CHIP, type BrandRequest } from '../requests/types';
import { AskBox } from '../requests/AskBox';
import { useAuth } from '../auth/AuthProvider';
import { RequestsToolbar } from '../requests/RequestsToolbar';
import { RequestsBoard, COLUMNS } from '../requests/RequestsBoard';
import { RequestsList } from '../requests/RequestsList';
import { DueCalendar } from '../requests/DueCalendar';
import { DeliveryPace } from '../requests/DeliveryPace';
import { downloadCsv, printPdf, rowOf } from '../requests/exportRequests';
import { NO_FILTERS, filtersFromParams, filtersToParams, inTab, isLate, narrow, sortRequests, type ReqFilters } from '../requests/requestFilters';

type View = 'board' | 'list' | 'calendar';
const VIEWS: View[] = ['list', 'board', 'calendar'];

/** When the brand asked for it: always shown on every request. */
const asked = (r: BrandRequest, lang: 'es' | 'en') => dateLabel(r.createdAt?.toDate(), lang);

export function brainState(r: BrandRequest): BrainState {
  return r.status === 'to_approve' ? 'approval' : r.status === 'in_production' ? 'working' : 'idle';
}

export function Requests() {
  const { current } = useBrands();
  const { t, lang } = useI18n();
  const { list, loading } = useRequests(current?.id);
  const isAdmin = useAuth().profile?.role === 'admin';
  // Filters and view live in the address, so a filtered view can be shared as a link.
  const [params, setParams] = useSearchParams();
  const [viewLocal, setViewLocal] = useState<View>('board');
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;

  const f = filtersFromParams(params);
  const view = VIEWS.includes(params.get('view') as View) ? (params.get('view') as View) : viewLocal;
  const setFilters = (next: ReqFilters) => setParams(filtersToParams(next, params), { replace: true });
  const setView = (v: View) => { setViewLocal(v); const p = new URLSearchParams(params); if (v === 'board') p.delete('view'); else p.set('view', v); setParams(p, { replace: true }); };

  const typeLabel = (r: BrandRequest) => [findCategory(r.category)?.label[lang], findSub(r.category, r.subcategory)?.label[lang]].filter(Boolean).join(' · ');
  const active = list.filter((r) => !r.archived);
  const toApprove = active.filter((r) => r.status === 'to_approve').length;
  const tags = [...new Set(list.flatMap((r) => r.tags ?? []))].sort((a, b) => a.localeCompare(b));
  const narrowed = narrow(list, f, typeLabel);
  const shown = sortRequests(narrowed.filter((r) => inTab(f.tab, r)), f.sort);
  const columns = COLUMNS.filter(({ status }) => f.tab === 'all' || (f.tab === 'late' ? status === 'in_production' : status === f.tab));

  const head = [t('req.col.request'), t('req.col.requested'), t('req.col.type'), t('req.col.due'), t('req.col.status'), t('rf.tag'), t('rf.versions')];
  const rows = () => shown.map((r) => rowOf(r, { requested: asked(r, lang), type: typeLabel(r), due: r.dueDate ? String(r.dueDate) : '', status: isLate(r) ? t('rf.tab.late') : t(`req.status.${r.status}`) }));
  const fileName = `${current.name} · ${t('nav.requests')} · ${new Date().toISOString().slice(0, 10)}`;

  return (
    <div className="col g24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="col g8"><p className="label">{current.name}</p><h1 className="h1"><span className="w9">{t('nav.requests')}.</span> {t('req.tagline')}</h1></div>
        {toApprove > 1 && <Link className="btn btn-secondary" to="/requests/approve">{t('req.batch', { n: toApprove })}</Link>}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)]">
        <AskBox brandId={current.id} />
        <InMotion list={active} loading={loading} />
      </div>

      {!loading && <DeliveryPace list={list} />}

      <div className="row between g12 wrap">
        <h2 className="h3">{t('req.allRequests')}</h2>
        <div className="seg" role="group" aria-label={t('files.view')}>
          {VIEWS.map((v) => <button key={v} className={view === v ? 'is-on' : ''} aria-pressed={view === v} onClick={() => setView(v)}>{t(v === 'calendar' ? 'rv.calendar' : v === 'list' ? 'req.list' : 'req.board')}</button>)}
        </div>
      </div>

      {!loading && list.length > 0 && (
        <RequestsToolbar brandId={current.id} all={list} narrowed={narrowed} shown={shown.length} f={f} set={setFilters} tags={tags}
          onCsv={() => downloadCsv(fileName, head, rows())} onPdf={() => printPdf(`${current.name} · ${t('nav.requests')}`, t('rf.count', { n: shown.length, total: list.length }), head, rows())} />
      )}

      {loading ? <div className="grid gap-5 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skel" style={{ height: 300 }} />)}</div>
        : list.length === 0 ? (
          <div className="card empty"><p className="h3">{t('req.empty')}</p></div>
        ) : shown.length === 0 && view !== 'calendar' ? (
          <div className="card empty col g12"><p className="h3">{t('rf.none')}</p><button type="button" className="btn btn-secondary btn-sm self-start" onClick={() => setFilters(NO_FILTERS)}>{t('rf.clear')}</button></div>
        ) : view === 'board' ? <RequestsBoard brandId={current.id} shown={shown} columns={columns} isAdmin={isAdmin} />
        : view === 'calendar' ? <DueCalendar shown={shown} />
        : <RequestsList brandId={current.id} shown={shown} isAdmin={isAdmin} archived={f.archived} tags={tags} typeLabel={typeLabel} />}
    </div>
  );
}

/** Right of the ask box: what is moving now (waiting for the client first, then in production by due date). */
function InMotion({ list, loading }: { list: BrandRequest[]; loading: boolean }) {
  const { t, lang } = useI18n();
  const items = list.filter((r) => r.status === 'to_approve' || r.status === 'in_production')
    .sort((a, b) => (a.status === b.status ? String(a.dueDate ?? '9999').localeCompare(String(b.dueDate ?? '9999')) : a.status === 'to_approve' ? -1 : 1))
    .slice(0, 6);
  return (
    <section className="card col g12" aria-labelledby="h-motion">
      <h2 className="h3" id="h-motion">{t('req.inMotion')}</h2>
      {loading && <div className="skel" style={{ height: 120 }} />}
      {!loading && items.length === 0 && <p className="t-sm t-mute">{t('req.inMotionEmpty')}</p>}
      {items.map((r) => (
        <Link key={r.id} to={`/requests/${r.id}`} className="row g12" style={{ textDecoration: 'none', color: 'var(--ink)', padding: '8px 0', borderTop: '1px solid var(--line)' }}>
          {r.leadBrain && <img src={`/brand/brains/${r.leadBrain}.png`} alt="" className="h-8 w-8 flex-none rounded-full" style={{ background: 'var(--niebla)' }} />}
          <span className="col grow min-w-0">
            <span className="w7 truncate">{r.title}</span>
            <span className="t-xs t-mute truncate">{r.createdAt ? `${t('req.requestedOn', { day: asked(r, lang) })} · ` : ''}{r.status === 'in_production' ? t('req.onIt', { brain: brainName(r.leadBrain) }) : t('req.madeByReviewed')}{r.dueDate ? ` · ${dayLabel(r.dueDate, lang)}` : ''}</span>
          </span>
          <span className={`chip flex-none ${STATUS_CHIP[r.status]}`}>{t(`req.status.${r.status}`)}</span>
        </Link>
      ))}
    </section>
  );
}
