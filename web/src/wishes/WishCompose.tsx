import { useState, type RefObject } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { useToast } from '../components/Toaster';
import { VoiceNote } from '../requests/ask/VoiceNote';
import { WishAudio } from './WishAudio';
import { addPublicWish, addWish, WISH_STATUSES, type Wish, type WishKind, type WishStatus } from './useWishes';

/**
 * The box to ask for a wish. Closed it is one line and «Ask»; on focus (or with text) it grows and shows
 * Improvement / Fix and the voice note. Used by the Wishlist page and the «Ideas» side panel.
 * A client's wish goes to their brand; the admin's goes straight to the shared history with the status he picks (New by default).
 */
export function WishCompose({ admin, inputRef }: { admin: boolean; inputRef?: RefObject<HTMLTextAreaElement | null> }) {
  const { t } = useI18n();
  const { user, profile } = useAuth();
  const current = useBrands().current;
  const toast = useToast();
  const [text, setText] = useState('');
  const [kind, setKind] = useState<WishKind>('improve');
  const [newStatus, setNewStatus] = useState<WishStatus>('new');
  const [busy, setBusy] = useState(false);
  const [audio, setAudio] = useState<Wish['audio']>();
  const [recBusy, setRecBusy] = useState(false);
  const [focused, setFocused] = useState(false);
  const ready = text.trim().length >= 3 || (!!audio && !admin);
  const open = focused || !!text || !!audio || recBusy;

  async function send() {
    if (!ready || !user) return;
    setBusy(true);
    try {
      if (admin) await addPublicWish(text.trim(), kind, newStatus);
      else await addWish(current!.id, text.trim(), kind, user.uid, profile?.name || user.displayName || '', audio);
      setText(''); setAudio(undefined); setFocused(false);
      toast({ text: t('wl.sent'), tone: 'ok' });
    } catch { toast({ text: t('wl.error'), tone: 'bad' }); }
    setBusy(false);
  }

  if (!admin && !current) return <p className="t-sm t-mute" style={{ margin: 0 }}>{t('wl.needBrand')}</p>;
  const sendBtn = <button type="button" className="btn btn-primary" disabled={busy || recBusy || !ready} onClick={send}>{t(busy ? 'wl.sending' : 'wl.send')}</button>;
  return (
    <div className="col g12" onFocus={() => setFocused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false); }}>
      {admin && <p className="t-xs t-mute" style={{ margin: 0 }}>{t('wl.adm.newPublic')}</p>}
      <div className="wl-compose">
        <textarea ref={inputRef} className="input wl-input" rows={open ? 3 : 1} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)}
          placeholder={t('wl.placeholder')} aria-label={t('wl.placeholder')}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }} />
        {!open && sendBtn}
      </div>
      {open && (
        <div className="row g8 wrap" style={{ alignItems: 'center' }}>
          <div className="seg" role="radiogroup" aria-label={t('wl.title')}>
            {(['improve', 'fix'] as const).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={kind === k} className={kind === k ? 'is-on' : ''} onClick={() => setKind(k)}>{t(`wl.kind.${k}`)}</button>
            ))}
          </div>
          {admin && (
            <label className="row g8 t-sm" style={{ alignItems: 'center' }}>
              <span className="t-mute">{t('wl.adm.publishAs')}</span>
              <select className="input wl-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value as WishStatus)}>
                {WISH_STATUSES.map((s) => <option key={s} value={s}>{t(`wl.st.${s}`)}</option>)}
              </select>
            </label>
          )}
          {!admin && current && !audio && <VoiceNote brandId={current.id} onAdd={(f) => setAudio(f)} onBusy={setRecBusy} />}
          <span className="grow" />
          {sendBtn}
        </div>
      )}
      {audio && current && <div className="row g8" style={{ alignItems: 'center' }}>
        <WishAudio brandId={current.id} audio={audio} />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAudio(undefined)}>{t('wl.delete')}</button>
      </div>}
    </div>
  );
}
