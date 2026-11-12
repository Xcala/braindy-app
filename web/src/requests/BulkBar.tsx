import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { bulkUpdate, type BulkChange } from './bulkActions';
import type { RequestStatus } from './types';

const STATUSES: RequestStatus[] = ['in_production', 'to_approve', 'approved', 'published'];

/** NickMark only: the same bar as Files when requests are ticked. Move, set a due date, tag a campaign, archive. */
export function BulkBar({ brandId, ids, archived, tags, clear }: { brandId: string; ids: string[]; archived: boolean; tags: string[]; clear: () => void }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [due, setDue] = useState('');
  const [tag, setTag] = useState('');
  const run = async (c: BulkChange, done: string) => {
    setBusy(true); setMsg(null);
    try { await bulkUpdate(brandId, ids, c); setMsg({ ok: true, text: done }); if (c.kind === 'archive' || c.kind === 'status') clear(); }
    catch { setMsg({ ok: false, text: t('files.actionError') }); }
    finally { setBusy(false); }
  };
  const n = ids.length;
  const cleanTag = tag.trim().replace(/^#/, '').slice(0, 40);

  return (
    <div className="col g8">
      <div className="selbar" role="region" aria-label={t('files.selected', { n })}>
        <span className="fx-count">{t('files.selected', { n })}</span>
        <label className="fx-select is-sm">
          <span className="sr">{t('rb.move')}</span>
          <select value="" disabled={busy} aria-label={t('rb.move')} onChange={(e) => e.target.value && run({ kind: 'status', status: e.target.value as RequestStatus }, t('rb.moved', { n }))}>
            <option value="">{t('rb.move')}</option>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`req.status.${s}`)}</option>)}
          </select>
          <Icon name="chevronDown" size={14} />
        </label>
        <span className="row g4">
          <input type="date" className="input" style={{ height: '2.25rem', width: '9.375rem' }} value={due} onChange={(e) => setDue(e.target.value)} aria-label={t('rb.due')} />
          <button type="button" className="btn btn-secondary btn-sm" disabled={busy || !due} onClick={() => run({ kind: 'due', dueDate: due }, t('rb.dueSet', { n }))}>{t('rb.due')}</button>
        </span>
        <span className="row g4">
          <input className="input" list="rb-tags" style={{ height: '2.25rem', width: '10rem' }} placeholder={t('rb.tagPh')} value={tag} onChange={(e) => setTag(e.target.value)} aria-label={t('rb.tagPh')} />
          <datalist id="rb-tags">{tags.map((g) => <option key={g} value={g} />)}</datalist>
          <button type="button" className="btn btn-secondary btn-sm" disabled={busy || !cleanTag} onClick={() => run({ kind: 'tag', tag: cleanTag, add: true }, t('rb.tagged', { n, tag: cleanTag }))}>{t('rb.tagAdd')}</button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy || !cleanTag} onClick={() => run({ kind: 'tag', tag: cleanTag, add: false }, t('rb.untagged', { n, tag: cleanTag }))}>{t('rb.tagRemove')}</button>
        </span>
        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => run({ kind: 'archive', archived: !archived }, t(archived ? 'rb.unarchived' : 'rb.archived', { n }))}>
          <Icon name={archived ? 'restore' : 'archive'} size={16} />{t(archived ? 'rb.unarchive' : 'rb.archive')}
        </button>
        <button type="button" className="btn btn-ghost btn-sm fx-end" onClick={clear}>{t('files.clearSel')}</button>
      </div>
      {msg && <p className="t-sm" role="status" style={{ margin: 0, color: msg.ok ? 'var(--success)' : 'var(--danger)' }}>{msg.text}</p>}
    </div>
  );
}
