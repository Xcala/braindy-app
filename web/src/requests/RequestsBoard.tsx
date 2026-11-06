import { useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { brainName } from '../components/BrainStack';
import { dateLabel } from '../lib/dates';
import { STATUS_CHIP, type BrandRequest, type RequestStatus } from './types';
import { moveRequest } from './moveRequest';
import { missingOf, pieceLabel, smartDate } from './requestBits';

export const COLUMNS: Array<{ status: RequestStatus; bg: string }> = [
  { status: 'in_production', bg: '#EEF1F7' }, { status: 'to_approve', bg: '#FFF7E3' },
  { status: 'approved', bg: '#EEF1F7' }, { status: 'published', bg: '#EEF1F7' },
];
// Each column starts short; the rest opens on request so the page does not run for metres.
const COL_FIRST = 6;

export function TagChips({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null;
  return <span className="row g4 wrap">{tags.map((g) => <span key={g} className="chip chip-plain" style={{ height: 22, fontSize: 11, background: '#F2F5FF', color: 'var(--azul)' }}>#{g}</span>)}</span>;
}

/** NickMark only: what an open request still lacks ("Missing: date · where"). */
export function MissingChip({ r }: { r: BrandRequest }) {
  const { t } = useI18n();
  const m = missingOf(r);
  if (!m.length) return null;
  return <span className="chip chip-plain" style={{ height: 22, fontSize: 11, background: '#FFF4E5', color: '#8A4B00' }}>{t('rr.missing', { what: m.map((k) => t(`rr.miss.${k}`)).join(' · ') })}</span>;
}

/** Board by status. NickMark drags a card to another column to move it. */
export function RequestsBoard({ brandId, shown, columns, isAdmin }: { brandId: string; shown: BrandRequest[]; columns: typeof COLUMNS; isAdmin: boolean }) {
  const { t, lang } = useI18n();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<RequestStatus | null>(null);
  const [moveError, setMoveError] = useState(false);
  const [openCols, setOpenCols] = useState<RequestStatus[]>([]);
  const drop = (status: RequestStatus) => {
    const r = shown.find((x) => x.id === dragId);
    setDragId(null); setOverCol(null); setMoveError(false);
    if (r && r.status !== status) moveRequest(brandId, r.id, status).catch(() => setMoveError(true));
  };

  return (
    <div className="col g8">
      {isAdmin && <p className="t-xs t-mute">{t(moveError ? 'req.moveError' : 'req.dragHint')}</p>}
      <div className={`grid grid-cols-1 items-start gap-5 md:grid-cols-2 ${columns.length > 2 ? 'xl:grid-cols-4' : ''}`}>
        {columns.map(({ status, bg }) => {
          const all = shown.filter((r) => r.status === status);
          const items = openCols.includes(status) ? all : all.slice(0, COL_FIRST);
          const target = isAdmin ? {
            onDragOver: (e: React.DragEvent) => { if (dragId) { e.preventDefault(); setOverCol(status); } },
            onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null); },
            onDrop: (e: React.DragEvent) => { e.preventDefault(); drop(status); },
          } : {};
          return (
            <section key={status} {...target} className="col g12 rounded-[24px] p-4" aria-label={t(`req.status.${status}`)}
              style={{ background: bg, minHeight: 320, outline: overCol === status ? '2px dashed var(--azul)' : undefined, outlineOffset: -2 }}>
              <div className="row between"><span className={`chip ${STATUS_CHIP[status]}`}>{t(`req.status.${status}`)}</span><span className="t-sm t-mute">{all.length}</span></div>
              {items.map((r) => (
                <Link key={r.id} to={`/requests/${r.id}`} className="card col" draggable={isAdmin}
                  onDragStart={isAdmin ? (e) => { setDragId(r.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', r.id); } : undefined}
                  onDragEnd={() => { setDragId(null); setOverCol(null); }}
                  style={{ padding: 16, gap: 10, textDecoration: 'none', color: 'var(--ink)', borderColor: status === 'to_approve' ? '#F5D98A' : undefined, cursor: isAdmin ? 'grab' : undefined, opacity: dragId === r.id ? 0.5 : 1 }}>
                  <span className="w7" style={{ overflowWrap: 'anywhere' }}>{r.title}</span>
                  {r.createdAt && <span className="t-xs t-mute">{t('req.requestedOn', { day: dateLabel(r.createdAt.toDate(), lang) })}</span>}
                  {pieceLabel(r, lang) && <span className="t-xs t-mute">{pieceLabel(r, lang)}</span>}
                  <TagChips tags={r.tags} />
                  {isAdmin && <MissingChip r={r} />}
                  {r.versionCount ? <span className="row g8"><span className="chip chip-plain c-type" style={{ height: 22 }}>{t('home.version', { n: r.versionCount })}</span>{r.approvalLevel === 'nicolas' && <span className="t-xs t-mute">{t('req.reviewedByNicolas')}</span>}</span> : null}
                  <div className="row between g8">
                    <span className="row g8" style={{ minWidth: 0 }}>
                      {r.leadBrain && <img src={`/brand/brains/${r.leadBrain}.png`} alt="" className="h-6 w-6 flex-none rounded-full" style={{ background: 'var(--niebla)' }} />}
                      <span className="t-xs t-mute truncate">{status === 'in_production' ? t('req.onIt', { brain: brainName(r.leadBrain) }) : t('req.madeByReviewed')}</span>
                    </span>
                    {status === 'to_approve' && <span className="btn btn-primary btn-sm flex-none" style={{ height: 32 }}>{t('req.review')}</span>}
                  </div>
                  {(() => { const d = smartDate(r, lang, t); return d.text && <span className="t-xs" style={{ color: d.late ? '#C0362C' : 'var(--graphite)' }}>{d.text}</span>; })()}
                </Link>
              ))}
              {all.length > COL_FIRST && (
                <button type="button" className="btn btn-ghost btn-sm self-start" onClick={() => setOpenCols((c) => (c.includes(status) ? c.filter((x) => x !== status) : [...c, status]))}>
                  {openCols.includes(status) ? t('common.showLess') : t('req.moreN', { n: all.length - COL_FIRST })}
                </button>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
