import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { createFolder } from './fileApi';

/** «New folder»: a name, Enter, and the new folder opens. It stays in Library even while empty. */
export function NewFolderButton({ brandId, parent, onMade }: { brandId: string; parent: string; onMade: (path: string) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const close = () => { setOpen(false); setName(''); setError(false); };

  async function make() {
    const n = name.replace(/[\/]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!n || busy) return;
    setBusy(true); setError(false);
    try { const path = await createFolder(brandId, parent, n); close(); onMade(path); }
    catch { setError(true); } finally { setBusy(false); }
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}>
        <Icon name="folder" size={14} />{t('files.newFolder')}
      </button>
    );
  }
  return (
    <form className="row g8 wrap" onSubmit={(e) => { e.preventDefault(); void make(); }}>
      <input className="input" autoFocus maxLength={120} value={name} placeholder={t('files.newFolderPh')} aria-label={t('files.newFolderPh')}
        style={{ height: '2.5rem', minWidth: '12rem' }} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') close(); }} />
      <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !name.trim()}>{t('files.newFolderCreate')}</button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={close}>{t('common.cancel')}</button>
      {error && <span role="alert" className="t-sm" style={{ color: 'var(--danger)' }}>{t('files.newFolderError')}</span>}
    </form>
  );
}
