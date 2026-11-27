import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { brainName } from '../components/BrainStack';
import { dateLabel, daysFrom } from '../lib/dates';
import { STATUS_CHIP, type BrandRequest } from './types';
import { MissingChip, TagChips } from './RequestsBoard';
import { BulkBar } from './BulkBar';
import { pieceLabel, smartDate } from './requestBits';
import { RowTitle } from './RowTitle';
import { useCanApprove } from './useCanApprove';
import { useAuth } from '../auth/AuthProvider';
import './requests.css';

const LIST_FIRST = 20;

type Props = { brandId: string; shown: BrandRequest[]; isAdmin: boolean; archived: boolean; tags: string[] };

/**
 * Table of requests: the request (with who works on it, when it was asked, its campaign), the piece in a few words,
 * the one date that matters now and the status. NickMark ticks rows (Shift for a range) to change many at once.
 * When the list is narrow (a phone, or the Asistente open) each request turns into rows instead of columns: the name
 * with the whole width, then the status, piece and date on one line (audit P1/P3, 2026-11-26; requests.css).
 */
export function RequestsList({ brandId, shown, isAdmin, archived, tags }: Props) {
  const { t, lang } = useI18n();
  const [max, setMax] = useState(LIST_FIRST);
  const { user } = useAuth();
  const canApprove = useCanApprove(brandId);
  const [picked, setPicked] = useState<string[]>([]);
  const [anchor, setAnchor] = useState<number | null>(null);
  const rows = shown.slice(0, max);
  const ids = picked.filter((id) => shown.some((r) => r.id === id));
  const cols = `${isAdmin ? '36px ' : ''}minmax(16rem,1fr) minmax(7rem,11rem) 9.5rem 9rem`;
const narrowCols = isAdmin ? '36px minmax(0,1fr)' : 'minmax(0,1fr)';
  const pick = (i: number, shift: boolean) => {
    const id = rows[i].id;
    if (shift && anchor != null) setPicked((p) => [...new Set([...p, ...rows.slice(Math.min(anchor, i), Math.max(anchor, i) + 1).map((r) => r.id)])]);
    else setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    setAnchor(i);
  };
  const allOn = rows.length > 0 && rows.every((r) => ids.includes(r.id));
  const check = { width: 28, height: 28, border: 0, background: 'transparent' };

  return (
    <div className="col g12">
      {isAdmin && ids.length > 0 && <BulkBar brandId={brandId} ids={ids} archived={archived} tags={tags} clear={() => setPicked([])} />}
      <div className="table rq-table" style={{ '--cols': cols, '--cols-n': narrowCols } as React.CSSProperties}>
        <div className="trow head label">
          {isAdmin && <label className="fx-check" style={check}><input type="checkbox" checked={allOn} aria-label={t('files.selectAll')} onChange={() => setPicked(allOn ? [] : rows.map((r) => r.id))} /></label>}
          <span>{t('req.col.request')}</span><span className="rq-c">{t('rr.piece')}</span><span className="rq-c">{t('rr.date')}</span><span className="rq-c">{t('req.col.status')}</span>
        </div>
        {rows.map((r, i) => {
          const d = smartDate(r, lang, t);
          const asked = r.createdAt?.toDate();
          const near = asked && [0, -1].includes(daysFrom(asked) ?? 9);
          const chip = r.cancelled ? <span className="chip c-type">{t('rc.chip')}</span> : <span className={`chip ${STATUS_CHIP[r.status]}`}>{t(`req.status.${r.status}`)}</span>;
          return (
            <div key={r.id} className="trow" style={{ background: ids.includes(r.id) ? '#F5F8FF' : r.status === 'to_approve' ? '#FFFBF0' : undefined }}>
              {isAdmin && <label className="fx-check" style={check}><input type="checkbox" checked={ids.includes(r.id)} aria-label={r.title}
                onClick={(e) => { e.preventDefault(); pick(i, e.shiftKey); }} onChange={() => undefined} /></label>}
              <span className="row g12 min-w-0">
                {r.leadBrain && <img src={`/brand/brains/${r.leadBrain}.png`} alt={brainName(r.leadBrain)} title={t('req.onIt', { brain: brainName(r.leadBrain) })} className="h-7 w-7 flex-none rounded-full" style={{ background: 'var(--niebla)' }} />}
                <span className="col min-w-0" style={{ gap: '0.1875rem' }}>
                  <RowTitle brandId={brandId} id={r.id} title={r.title} canEdit={isAdmin || canApprove || (!!user && r.createdBy === user.uid)} />
                  <span className="row g8 wrap t-xs t-mute rq-meta"><span className="rq-n">{chip}</span><span className="rq-n">{pieceLabel(r, lang)}</span>{asked && <span>{t(near ? 'rr.askedNear' : 'rr.askedOn', { day: dateLabel(asked, lang) })}</span>}<span className="rq-n" style={{ color: d.late ? 'var(--danger)' : undefined }}>{d.text}</span><TagChips tags={r.tags} />{isAdmin && <MissingChip r={r} />}</span>
                </span>
              </span>
              <span className="t-sm truncate rq-c">{pieceLabel(r, lang)}</span>
              <span className="t-sm rq-c" style={{ color: d.late ? 'var(--danger)' : undefined }}>{d.text}</span>
              <span className="rq-c">{chip}</span>
            </div>
          );
        })}
      </div>
      {isAdmin && <p className="t-xs t-mute fx-hint" style={{ margin: 0 }}>{t('files.rangeHint')}</p>}
      {shown.length > max && <button type="button" className="btn btn-secondary btn-sm self-start" onClick={() => setMax((m) => m + LIST_FIRST)}>{t('files.showMore', { n: LIST_FIRST })}</button>}
    </div>
  );
}
