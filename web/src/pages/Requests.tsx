import { useState } from 'react';
import { Link } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { brainName, type BrainState } from '../components/BrainStack';
import { dayLabel, isOverdue } from '../lib/dates';
import { useRequests } from '../requests/useRequests';
import { findCategory, findSub } from '../requests/taxonomy';
import { STATUS_CHIP, type BrandRequest, type RequestStatus } from '../requests/types';
import { AskBox } from '../requests/AskBox';

const COLUMNS: Array<{ status: RequestStatus; bg: string }> = [
  { status: 'in_production', bg: '#EEF1F7' }, { status: 'to_approve', bg: '#FFF7E3' },
  { status: 'approved', bg: '#EEF1F7' }, { status: 'published', bg: '#EEF1F7' },
];

export function brainState(r: BrandRequest): BrainState {
  return r.status === 'to_approve' ? 'approval' : r.status === 'in_production' ? 'working' : 'idle';
}

export function Requests() {
  const { current } = useBrands();
  const { t, lang } = useI18n();
  const { list, loading } = useRequests(current?.id);
  const [view, setView] = useState<'board' | 'list'>('board');
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;

  const typeLabel = (r: BrandRequest) => [findCategory(r.category)?.label[lang], findSub(r.category, r.subcategory)?.label[lang]].filter(Boolean).join(' · ');
  const toApprove = list.filter((r) => r.status === 'to_approve').length;

  return (
    <div className="col g24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="col g8"><p className="label">{current.name}</p><h1 className="h1"><span className="w9">{t('nav.requests')}.</span> {t('req.tagline')}</h1></div>
        {toApprove > 1 && <Link className="btn btn-secondary" to="/requests/approve">{t('req.batch', { n: toApprove })}</Link>}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)]">
        <AskBox brandId={current.id} />
        <InMotion list={list} loading={loading} />
      </div>

      <div className="row between g12 wrap">
        <h2 className="h3">{t('req.allRequests')}</h2>
        <div className="seg" role="group" aria-label={t('files.view')}>
          <button className={view === 'list' ? 'is-on' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')}>{t('req.list')}</button>
          <button className={view === 'board' ? 'is-on' : ''} aria-pressed={view === 'board'} onClick={() => setView('board')}>{t('req.board')}</button>
        </div>
      </div>

      {loading ? <div className="grid gap-5 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skel" style={{ height: 300 }} />)}</div>
        : list.length === 0 ? (
          <div className="card empty"><p className="h3">{t('req.empty')}</p></div>
        ) : view === 'board' ? (
          <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map(({ status, bg }) => {
              const items = list.filter((r) => r.status === status);
              return (
                <section key={status} className="col g12 rounded-[24px] p-4" style={{ background: bg, minHeight: 320 }} aria-label={t(`req.status.${status}`)}>
                  <div className="row between"><span className={`chip ${STATUS_CHIP[status]}`}>{t(`req.status.${status}`)}</span><span className="t-sm t-mute">{items.length}</span></div>
                  {items.map((r) => (
                    <Link key={r.id} to={`/requests/${r.id}`} className="card col" style={{ padding: 16, gap: 10, textDecoration: 'none', color: 'var(--ink)', borderColor: status === 'to_approve' ? '#F5D98A' : undefined }}>
                      <span className="w7">{r.title}</span>
                      {r.formatType && r.formatType !== r.title && <span className="t-xs t-mute">{r.formatType}</span>}
                      {r.versionCount ? <span className="row g8"><span className="chip chip-plain c-type" style={{ height: 22 }}>{t("home.version", { n: r.versionCount })}</span>{r.approvalLevel === 'nicolas' && <span className="t-xs t-mute">{t('req.reviewedByNicolas')}</span>}</span> : null}
                      <div className="row between g8">
                        <span className="row g8" style={{ minWidth: 0 }}>
                          {r.leadBrain && <img src={`/brand/brains/${r.leadBrain}.png`} alt="" className="h-6 w-6 flex-none rounded-full" style={{ background: 'var(--niebla)' }} />}
                          <span className="t-xs t-mute truncate">{status === 'in_production' ? t('req.onIt', { brain: brainName(r.leadBrain) }) : t('req.madeByReviewed')}</span>
                        </span>
                        {status === 'to_approve' && <span className="btn btn-primary btn-sm flex-none" style={{ height: 32 }}>{t('req.review')}</span>}
                      </div>
                      {status === 'in_production' && r.dueDate && <span className="t-xs" style={{ color: isOverdue(r.dueDate) ? '#C0362C' : 'var(--graphite)' }}>{t(isOverdue(r.dueDate) ? 'home.late' : 'home.dueDay', { day: dayLabel(r.dueDate, lang) })}</span>}
                    </Link>
                  ))}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="table overflow-x-auto">
            <div className="trow head label min-w-[760px]" style={{ gridTemplateColumns: 'minmax(0,1fr) 200px 110px 200px 140px' }}>
              <span>{t('req.col.request')}</span><span>{t('req.col.type')}</span><span>{t('req.col.due')}</span><span>{t('req.col.brains')}</span><span>{t('req.col.status')}</span>
            </div>
            {list.map((r) => (
              <div key={r.id} className="trow min-w-[760px]" style={{ gridTemplateColumns: 'minmax(0,1fr) 200px 110px 200px 140px', background: r.status === 'to_approve' ? '#FFFBF0' : undefined }}>
                <Link to={`/requests/${r.id}`} className="w7 truncate" style={{ color: 'var(--ink)', textDecoration: 'none' }}>{r.title}</Link>
                <span className="t-sm truncate">{typeLabel(r)}</span>
                <span className="t-sm">{r.dueDate ? dayLabel(r.dueDate, lang) : '—'}</span>
                <span className="t-sm truncate">{t('req.onIt', { brain: brainName(r.leadBrain) })}</span>
                <span><span className={`chip ${STATUS_CHIP[r.status]}`}>{t(`req.status.${r.status}`)}</span></span>
              </div>
            ))}
          </div>
        )}
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
            <span className="t-xs t-mute truncate">{r.status === 'in_production' ? t('req.onIt', { brain: brainName(r.leadBrain) }) : t('req.madeByReviewed')}{r.dueDate ? ` · ${dayLabel(r.dueDate, lang)}` : ''}</span>
          </span>
          <span className={`chip flex-none ${STATUS_CHIP[r.status]}`}>{t(`req.status.${r.status}`)}</span>
        </Link>
      ))}
    </section>
  );
}
