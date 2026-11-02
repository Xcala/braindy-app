import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { accessesApi, type Access, type Subscription } from './useAccesses';
import { looksLikeSecret, splitSecretLines } from './secretNotes';

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
  const [isSub, setIsSub] = useState(!!editing?.subscription);
  const [sub, setSub] = useState<Subscription>(editing?.subscription ?? { plan: '', price: null, currency: 'USD', period: 'month' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<false | 'save' | 'vault'>(false);
  const [deleting, setDeleting] = useState(false);
  const first = useRef<HTMLInputElement>(null);
  const secretInNotes = looksLikeSecret(notes);
  // Notes are not encrypted: a key pasted there moves to the password field (added to what is already typed).
  const moveToPassword = () => {
    const { secret, rest } = splitSecretLines(notes);
    const oneLine = secret.replace(/\n+/g, ' ');
    setPassword((p) => (p ? `${p} ${oneLine}` : oneLine));
    setNotes(rest);
  };
  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !deleting && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, deleting]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(false);
    const body = { platform: platform.trim(), username: username.trim(), link: link.trim(), notes: notes.trim(), sharedWithBraindy: shared, subscription: isSub ? sub : null, ...(password ? { password } : {}) };
    try {
      if (editing) await accessesApi.update(brandId, editing.id, body);
      else await accessesApi.add(brandId, body);
      setPassword(''); onClose();
    } catch (err) { setError(String(err).includes('503') ? 'vault' : 'save'); } finally { setBusy(false); }
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
          {secretInNotes ? (
            <div className="row between g8 wrap" role="alert">
              <span className="help err">{t('acc.secretInNotes')}</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={moveToPassword}>{t('acc.moveToPassword')}</button>
            </div>
          ) : <span className="help">{t('acc.notesHelp')}</span>}
        </div>
        <label className="row g8 t-sm" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={isSub} onChange={(e) => setIsSub(e.target.checked)} /> {t('acc.isSub')}
        </label>
        {isSub && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="field"><label htmlFor="acc-plan">{t('acc.plan')}</label>
              <input id="acc-plan" className="input" value={sub.plan ?? ''} onChange={(e) => setSub((s) => ({ ...s, plan: e.target.value }))} maxLength={80} placeholder="Pro" /></div>
            <div className="field"><label htmlFor="acc-price">{t('acc.price')}</label>
              <input id="acc-price" className="input" type="number" min={0} step="0.01" inputMode="decimal" value={sub.price ?? ''}
                onChange={(e) => setSub((s) => ({ ...s, price: e.target.value === '' ? null : Number(e.target.value) }))} /></div>
            <div className="field"><label htmlFor="acc-cur">{t('acc.currency')}</label>
              <select id="acc-cur" className="input" value={sub.currency ?? 'USD'} onChange={(e) => setSub((s) => ({ ...s, currency: e.target.value as Subscription['currency'] }))}>
                <option>USD</option><option>COP</option><option>EUR</option></select></div>
            <div className="field"><label htmlFor="acc-per">{t('acc.period')}</label>
              <select id="acc-per" className="input" value={sub.period ?? 'month'} onChange={(e) => setSub((s) => ({ ...s, period: e.target.value as Subscription['period'] }))}>
                <option value="month">{t('acc.monthly')}</option><option value="year">{t('acc.yearly')}</option></select></div>
          </div>
        )}
        <label className="row g8 t-sm" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} /> {t('acc.sharedLabel')}
        </label>
        {error && <p className="help err" role="alert">{t(error === 'vault' ? 'acc.vaultOff' : 'acc.saveError')}</p>}
        <div className="row g12 wrap" style={{ justifyContent: 'space-between' }}>
          {editing ? <button type="button" className="btn btn-ghost" onClick={() => setDeleting(true)}>{t('acc.delete')}</button> : <span />}
          <span className="row g12">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={busy || !platform.trim() || secretInNotes}>{t('acc.save')}</button>
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
