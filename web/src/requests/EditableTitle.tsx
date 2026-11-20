import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { renameRequest } from './api';

/**
 * The request's title, with a pencil for whoever may rename it (who asked, who approves, or the studio). The request
 * listens live, so after saving the new title shows up everywhere on its own.
 */
export function EditableTitle({ brandId, requestId, title, canEdit }: { brandId: string; requestId: string; title: string; canEdit: boolean }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const start = () => { setValue(title); setError(false); setEditing(true); };
  async function save() {
    const next = value.replace(/\s+/g, ' ').trim();
    if (!next || next === title) { setEditing(false); return; }
    setBusy(true); setError(false);
    try { await renameRequest(brandId, requestId, next); setEditing(false); } catch { setError(true); } finally { setBusy(false); }
  }

  if (!editing) {
    return (
      <span className="row g8" style={{ minWidth: 0, alignItems: 'center' }}>
        <h1 className="h2" style={{ overflowWrap: 'anywhere', minWidth: 0 }}>{title}</h1>
        {canEdit && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={start} aria-label={t('as.rename')} title={t('as.rename')}>
            <Icon name="pencil" size={16} />
          </button>
        )}
      </span>
    );
  }

  return (
    <form className="col g8" style={{ minWidth: 0, width: '100%', maxWidth: '40rem' }} onSubmit={(e) => { e.preventDefault(); void save(); }}>
      <div className="row g8 wrap">
        <input className="input grow" autoFocus maxLength={160} value={value} aria-label={t('as.titleLabel')} style={{ height: '2.75rem', fontSize: '1.125rem', fontWeight: 700, minWidth: '14rem' }}
          onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); }} />
        <button type="submit" className="btn btn-primary btn-sm" style={{ height: '2.75rem' }} disabled={busy || !value.trim()}>{t('as.renameSave')}</button>
        <button type="button" className="btn btn-ghost btn-sm" style={{ height: '2.75rem' }} onClick={() => setEditing(false)}>{t('as.renameCancel')}</button>
      </div>
      {error && <p className="t-sm" role="alert" style={{ color: 'var(--danger)', margin: 0 }}>{t('as.renameError')}</p>}
    </form>
  );
}
