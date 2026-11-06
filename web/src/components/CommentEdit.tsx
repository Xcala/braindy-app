import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';

const link = { background: 'none', border: 0, cursor: 'pointer', padding: 0 } as const;

/**
 * Edit and delete for a comment its author (or NickMark) may change: «Edit · Delete» links; Edit opens the text in a box
 * with Save/Cancel, Delete asks once inline. Without onSave only Delete shows (NickMark on someone else's comment).
 * The caller hides its own text while `editing` is on.
 */
export function CommentEdit({ text, max, onSave, onDelete, editing, setEditing }: {
  text: string; max: number; onSave?: (text: string) => Promise<unknown>; onDelete: () => Promise<unknown>;
  editing: boolean; setEditing: (v: boolean) => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(text);
  const [sure, setSure] = useState(false);
  const [state, setState] = useState<'idle' | 'busy' | 'error'>('idle');

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    const v = draft.trim();
    if (!onSave || !v || v === text) { setEditing(false); return; }
    setState('busy');
    try { await onSave(v.slice(0, max)); setState('idle'); setEditing(false); } catch { setState('error'); }
  }
  if (editing) return (
    <form className="col g6" onSubmit={save}>
      <textarea className="input" rows={3} value={draft} maxLength={max} aria-label={t('ce.label')} autoFocus
        onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save(); }}
        style={{ height: 'auto', paddingTop: 8, fontSize: 14 }} />
      <div className="row g8">
        <button type="submit" className="btn btn-primary btn-sm" disabled={!draft.trim() || state === 'busy'}>{t('ce.save')}</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setDraft(text); setEditing(false); }}>{t('ce.cancel')}</button>
      </div>
      {state === 'error' && <span className="t-xs" role="alert" style={{ color: 'var(--danger)' }}>{t('ce.failed')}</span>}
    </form>
  );
  if (sure) return (
    <span className="row g8 t-xs" role="group" aria-label={t('ce.sure')}>
      <span className="w7">{t('ce.sure')}</span>
      <button type="button" className="w7" style={{ ...link, color: 'var(--danger)' }} onClick={() => onDelete().catch(() => setSure(false))}>{t('ce.yes')}</button>
      <button type="button" style={{ ...link, color: 'var(--graphite)' }} onClick={() => setSure(false)}>{t('ce.cancel')}</button>
    </span>
  );
  return (
    <span className="row g8 t-xs">
      {onSave && <button type="button" className="w7" style={{ ...link, color: 'var(--graphite)' }} onClick={() => { setDraft(text); setEditing(true); }}>{t('ce.edit')}</button>}
      <button type="button" className="w7" style={{ ...link, color: 'var(--graphite)' }} onClick={() => setSure(true)}>{t('ce.delete')}</button>
    </span>
  );
}
