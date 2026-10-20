import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { accessesApi, type Access } from './useAccesses';

const PLATFORMS = ['Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'YouTube', 'X', 'Google', 'Gmail', 'Webflow', 'WordPress', 'Shopify', 'Metricool', 'Meta Business', 'Hosting', 'Domain'];

/** Add or edit an access (design 17). The password is sent once to the backend, encrypted before saving. */
export function AccessForm({ brandId, editing, onClose }: { brandId: string; editing: Access | null; onClose: () => void }) {
  const { t } = useI18n();
  const [platform, setPlatform] = useState(editing?.platform ?? '');
  const [username, setUsername] = useState(editing?.username ?? '');
  const [password, setPassword] = useState('');
  const [link, setLink] = useState(editing?.link ?? '');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [shared, setShared] = useState(!!editing?.sharedWithBraindy);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !deleting && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, deleting]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(false);
    const body = { platform: platform.trim(), username: username.trim(), link: link.trim(), notes: notes.trim(), sharedWithBraindy: shared, ...(password ? { password } : {}) };
    try {
      if (editing) await accessesApi.update(brandId, editing.id, body);
      else await accessesApi.add(brandId, body);
      setPassword(''); onClose();
    } catch { setError(true); } finally { setBusy(false); }
  }

  return (
    <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal w-full max-w-[520px]" role="dialog" aria-modal="true" aria-labelledby="acc-form-title" onSubmit={save} autoComplete="off">
        <div className="row between g12">
          <h2 className="h2" id="acc-form-title">{editing ? t('acc.editTitle') : t('acc.addTitle')}</h2>
          <span className="chip c-active">{t('acc.encryptedBefore')}</span>
        </div>
        <div className="field">
          <label htmlFor="acc-platform">{t('acc.platform')}</label>
          <input ref={first} id="acc-platform" className="input" list="acc-platforms" value={platform} onChange={(e) => setPlatform(e.target.value)} required maxLength={80} />
          <datalist id="acc-platforms">{PLATFORMS.map((p) => <option key={p} value={p} />)}</datalist>
        </div>
        <div className="field">
          <label htmlFor="acc-user">{t('acc.userOrEmail')}</label>
          <input id="acc-user" className="input" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={200} autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="acc-pass">{t('acc.password')}</label>
          <input id="acc-pass" className="input mono" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder={editing?.hasSecret ? t('acc.keepPassword') : ''} autoComplete="new-password" />
          <span className="help">{t('acc.passwordHelp')}</span>
        </div>
        <div className="field">
          <label htmlFor="acc-link">{t('acc.link')}</label>
          <input id="acc-link" className="input" value={link} onChange={(e) => setLink(e.target.value)} maxLength={500} placeholder="https://" />
        </div>
        <div className="field">
          <label htmlFor="acc-notes">{t('acc.notes')}</label>
          <textarea id="acc-notes" className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} style={{ height: 'auto', paddingTop: 10 }} />
          <span className="help">{t('acc.notesHelp')}</span>
        </div>
        <label className="row g8 t-sm" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} /> {t('acc.sharedLabel')}
        </label>
        {error && <p className="help err" role="alert">{t('acc.saveError')}</p>}
        <div className="row g12 wrap" style={{ justifyContent: 'space-between' }}>
          {editing ? <button type="button" className="btn btn-ghost" onClick={() => setDeleting(true)}>{t('acc.delete')}</button> : <span />}
          <span className="row g12">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={busy || !platform.trim()}>{t('acc.save')}</button>
          </span>
        </div>
      </form>
      {deleting && editing && (
        <ConfirmDialog title={t('acc.deleteTitle', { platform: editing.platform })} confirmLabel={t('acc.delete')} danger
          onConfirm={async () => { await accessesApi.remove(brandId, editing.id); setDeleting(false); onClose(); }} onCancel={() => setDeleting(false)}>
          {t('acc.deleteBody')}
        </ConfirmDialog>
      )}
    </div>
  );
}
