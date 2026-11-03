import { useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { brainName } from '../components/BrainStack';
import { dateLabel, dayLabel } from '../lib/dates';
import { STATUS_CHIP, type BrandRequest } from './types';
import { TagChips } from './RequestsBoard';
import { BulkBar } from './BulkBar';

const LIST_FIRST = 20;

type Props = { brandId: string; shown: BrandRequest[]; isAdmin: boolean; archived: boolean; tags: string[]; typeLabel: (r: BrandRequest) => string };

/** Table of requests. NickMark ticks rows (Shift for a range) to change many at once. */
export function RequestsList({ brandId, shown, isAdmin, archived, tags, typeLabel }: Props) {
  const { t, lang } = useI18n();
  const [max, setMax] = useState(LIST_FIRST);
  const [picked, setPicked] = useState<string[]>([]);
  const [anchor, setAnchor] = useState<number | null>(null);
  const rows = shown.slice(0, max);
  const ids = picked.filter((id) => shown.some((r) => r.id === id));
  const cols = `${isAdmin ? '36px ' : ''}minmax(0,1fr) 120px 180px 110px 180px 140px`;
  const pick = (i: number, shift: boolean) => {
    const id = rows[i].id;
    if (shift && anchor != null) {
      const range = rows.slice(Math.min(anchor, i), Math.max(anchor, i) + 1).map((r) => r.id);
      setPicked((p) => [...new Set([...p, ...range])]);
    } else setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    setAnchor(i);
  };
  const allOn = rows.length > 0 && rows.every((r) => ids.includes(r.id));

  return (
    <div className="col g12">
      {isAdmin && ids.length > 0 && <BulkBar brandId={brandId} ids={ids} archived={archived} tags={tags} clear={() => setPicked([])} />}
      <div className="table overflow-x-auto">
        <div className="trow head label min-w-[880px]" style={{ gridTemplateColumns: cols }}>
          {isAdmin && <label className="fx-check" style={{ width: 28, height: 28, border: 0, background: 'transparent' }}><input type="checkbox" checked={allOn} aria-label={t('files.selectAll')}
            onChange={() => setPicked(allOn ? [] : rows.map((r) => r.id))} /></label>}
          <span>{t('req.col.request')}</span><span>{t('req.col.requested')}</span><span>{t('req.col.type')}</span><span>{t('req.col.due')}</span><span>{t('req.col.brains')}</span><span>{t('req.col.status')}</span>
        </div>
        {rows.map((r, i) => (
          <div key={r.id} className="trow min-w-[880px]" style={{ gridTemplateColumns: cols, background: ids.includes(r.id) ? '#F5F8FF' : r.status === 'to_approve' ? '#FFFBF0' : undefined }}>
            {isAdmin && <label className="fx-check" style={{ width: 28, height: 28, border: 0, background: 'transparent' }}><input type="checkbox" checked={ids.includes(r.id)} aria-label={r.title}
              onClick={(e) => { e.preventDefault(); pick(i, e.shiftKey); }} onChange={() => undefined} /></label>}
            <span className="col min-w-0" style={{ gap: 2 }}>
              <Link to={`/requests/${r.id}`} className="w7 truncate" style={{ color: 'var(--ink)', textDecoration: 'none' }}>{r.title}</Link>
              <TagChips tags={r.tags} />
            </span>
            <span className="t-sm">{dateLabel(r.createdAt?.toDate(), lang) || '—'}</span>
            <span className="t-sm truncate">{typeLabel(r)}</span>
            <span className="t-sm">{r.dueDate ? dayLabel(r.dueDate, lang) : '—'}</span>
            <span className="t-sm truncate">{t('req.onIt', { brain: brainName(r.leadBrain) })}</span>
            <span><span className={`chip ${STATUS_CHIP[r.status]}`}>{t(`req.status.${r.status}`)}</span></span>
          </div>
        ))}
      </div>
      {isAdmin && <p className="t-xs t-mute fx-hint" style={{ margin: 0 }}>{t('files.rangeHint')}</p>}
      {shown.length > max && <button type="button" className="btn btn-secondary btn-sm self-start" onClick={() => setMax((m) => m + LIST_FIRST)}>{t('files.showMore', { n: LIST_FIRST })}</button>}
    </div>
  );
}
