import { useState } from 'react';
import { Link } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { BrainStack, brainName, type BrainState } from '../components/BrainStack';
import { useRequests } from '../requests/useRequests';
import { findCategory, findSub } from '../requests/taxonomy';
import { STATUS_CHIP, type BrandRequest, type RequestStatus } from '../requests/types';

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
        <div className="row g12 wrap">
          {toApprove > 1 && <Link className="btn btn-secondary" to="/requests/approve">{t('req.batch', { n: toApprove })}</Link>}
          <div className="seg" role="group" aria-label={t('files.view')}>
            <button className={view === 'list' ? 'is-on' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')}>{t('req.list')}</button>
            <button className={view === 'board' ? 'is-on' : ''} aria-pressed={view === 'board'} onClick={() => setView('board')}>{t('req.board')}</button>
          </div>
          <Link className="btn btn-primary" to="/ask">+ {t('nav.ask')}</Link>
        </div>
      </div>

      {loading ? <div className="grid gap-5 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skel" style={{ height: 300 }} />)}</div>
        : list.length === 0 ? (
          <div className="card empty"><p className="h3">{t('req.empty')}</p><Link className="btn btn-primary" to="/ask">{t('nav.ask')}</Link></div>
        ) : view === 'board' ? (
          <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map(({ status, bg }) => {
              const items = list.filter((r) => r.status === status);
              return (
                <section key={status} className="col g12 rounded-[24px] p-4" style={{ background: bg, minHeight: 320 }} aria-label={t(`req.status.${status}`)}>
                  <div className="row between"><span className={`chip ${STATUS_CHIP[status]}`}>{t(`req.status.${status}`)}</span><span className="t-sm t-mute">{items.length}</span></div>
                  {items.map((r) => (
                    <Link key={r.id} to={`/requests/${r.id}`} className="card col" style={{ padding: 16, gap: 10, textDecoration: 'none', color: 'var(--ink)', borderColor: status === 'to_approve' ? '#F5D98A' : undefined }}>
                      <span className="t-xs t-mute">{typeLabel(r)}</span>
                      <span className="w7">{r.title}</span>
                      {r.versionCount ? <span className="row g8"><span className="chip chip-plain c-type" style={{ height: 22 }}>v{r.versionCount}</span>{r.approvalLevel === 'nicolas' && <span className="t-xs t-mute">{t('req.reviewedByNicolas')}</span>}</span> : null}
                      <div className="row between g8">
                        <BrainStack size="xs" lead={r.leadBrain} state={brainState(r)}
                          label={status === 'in_production' ? t('req.onIt', { brain: brainName(r.leadBrain) }) : status === 'to_approve' ? t('req.ready') : t('req.allFour')} />
                        {status === 'to_approve' ? <span className="btn btn-primary btn-sm" style={{ height: 32 }}>{t('req.review')}</span>
                          : r.dueDate ? <span className="t-xs t-mute whitespace-nowrap">{t("req.due", { date: r.dueDate })}</span> : null}
                      </div>
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
                <span>{r.dueDate ?? '—'}</span>
                <BrainStack lead={r.leadBrain} state={brainState(r)} />
                <span><span className={`chip ${STATUS_CHIP[r.status]}`}>{t(`req.status.${r.status}`)}</span></span>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
