import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { brainName } from '../components/BrainStack';
import type { BrandRequest, RequestStatus } from './types';
import { moveRequest } from './moveRequest';
import { missingOf, pieceLabel, smartDate } from './requestBits';
import './board.css';

export const COLUMNS: Array<{ status: RequestStatus; bg: string }> = [
  { status: 'in_production', bg: 'var(--col)' }, { status: 'to_approve', bg: 'var(--col)' },
  { status: 'approved', bg: 'var(--col)' }, { status: 'published', bg: 'var(--col)' },
];
// Each column starts short; the rest opens on request so the page does not run for metres.
const COL_FIRST = 8;

export function TagChips({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null;
  return <span className="rb-tags">{tags.map((g) => `#${g}`).join(' ')}</span>;
}

/** NickMark only: what an open request still lacks ("Missing: date · where"). */
export function MissingChip({ r }: { r: BrandRequest }) {
  const { t } = useI18n();
  const m = missingOf(r);
  if (!m.length) return null;
  return <span className="rb-missing">{t('rr.missing', { what: m.map((k) => t(`rr.miss.${k}`)).join(' · ') })}</span>;
}

/**
 * Board by status. NickMark drags a card to another column to move it. Cards are compact (2026-11-12): title, kind · date on one
 * line, chips, then the Brain and «Review». On wide screens an empty column shrinks to a strip so the busy ones get the width.
 */
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
  const count = (s: RequestStatus) => shown.filter((r) => r.status === s).length;
  const anyFull = columns.some((c) => count(c.status) > 0);
  // While dragging every column is a full drop target.
  const cols = columns.map((c) => (!anyFull || dragId || count(c.status) ? 'minmax(0,1fr)' : '11rem')).join(' ');

  return (
    <div className="col g8">
      {isAdmin && <p className="t-xs t-mute">{t(moveError ? 'req.moveError' : 'req.dragHint')}</p>}
      <div className={`rb-grid grid grid-cols-1 items-start gap-4 md:grid-cols-2 ${columns.length > 2 ? 'xl:grid-cols-4' : ''}`} style={{ '--rb-cols': cols } as CSSProperties}>
        {columns.map(({ status, bg }) => {
          const all = shown.filter((r) => r.status === status);
          const items = openCols.includes(status) ? all : all.slice(0, COL_FIRST);
          const target = isAdmin ? {
            onDragOver: (e: React.DragEvent) => { if (dragId) { e.preventDefault(); setOverCol(status); } },
            onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null); },
            onDrop: (e: React.DragEvent) => { e.preventDefault(); drop(status); },
          } : {};
          return (
            <section key={status} {...target} className="col g8 rounded-[1.25rem] p-3" aria-label={t(`req.status.${status}`)}
              style={{ background: bg, minHeight: all.length || dragId ? '12rem' : undefined, outline: overCol === status ? '2px dashed var(--azul)' : undefined, outlineOffset: -2 }}>
              <div className="row between g8" style={{ padding: '0.125rem 0.25rem' }}><h3 className={`rb-head ${status === 'to_approve' ? 'is-act' : ''}`} style={{ margin: 0 }}>{t(`req.status.${status}`)} <span className="rb-n">· {all.length}</span></h3></div>
              {items.map((r) => {
                const d = smartDate(r, lang, t);
                const kind = pieceLabel(r, lang);
                return (
                  <Link key={r.id} to={`/requests/${r.id}`} className="card col rb-card" draggable={isAdmin}
                    onDragStart={isAdmin ? (e) => { setDragId(r.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', r.id); } : undefined}
                    onDragEnd={() => { setDragId(null); setOverCol(null); }}
                    style={{ cursor: isAdmin ? 'grab' : undefined, opacity: dragId === r.id ? 0.5 : 1 }}>
                    <span className="rb-title" title={r.title}>{r.title}</span>
                    <span className="t-xs t-mute">
                      {kind}{kind && d.text ? ' · ' : ''}{d.text && <span style={{ color: d.late ? 'var(--danger)' : undefined }}>{d.text}</span>}
                    </span>
                    <TagChips tags={r.tags} />
                    {isAdmin && <MissingChip r={r} />}
                    <div className="row between g8" style={{ alignItems: 'center' }}>
                      <span className="row g8" style={{ minWidth: 0, alignItems: 'center' }}>
                        {r.leadBrain && <img src={`/brand/brains/${r.leadBrain}.png`} alt={brainName(r.leadBrain)} title={brainName(r.leadBrain)} className="h-6 w-6 flex-none rounded-full" style={{ background: 'var(--niebla)' }} />}
                        {r.versionCount ? <span className="chip chip-plain c-type" style={{ height: '1.375rem', fontSize: '0.6875rem' }}>{t('home.version', { n: r.versionCount })}</span> : null}
                      </span>
                      {status === 'to_approve' && <span className="btn btn-primary btn-sm flex-none" style={{ height: '2rem' }}>{t('req.review')}</span>}
                    </div>
                  </Link>
                );
              })}
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
