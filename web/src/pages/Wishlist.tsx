import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { useToast } from '../components/Toaster';
import { addPublicWish, addWish, useWishes, WISH_STATUSES, type WishKind, type WishStatus } from '../wishes/useWishes';
import { WishItem } from '../wishes/WishItem';
import { VoiceNote } from '../requests/ask/VoiceNote';
import { WishAudio } from '../wishes/WishAudio';
import type { Wish } from '../wishes/useWishes';
import '../accesses/apps.css';
import '../wishes/wishes.css';

type Filter = 'all' | WishStatus;

/**
 * Wishlist: clients ask for improvements or fixes to the Braindy app and follow how each one goes.
 * They see their brand's wishes plus the shared history (no client names); the admin sees every brand's and answers.
 */
export function Wishlist() {
  const { t } = useI18n();
  const { user, profile } = useAuth();
  const current = useBrands().current;
  const { list, loading, admin } = useWishes(current?.id);
  const toast = useToast();
  const [text, setText] = useState('');
  const [kind, setKind] = useState<WishKind>('improve');
  const [newStatus, setNewStatus] = useState<WishStatus>('done');
  const [busy, setBusy] = useState(false);
  const [audio, setAudio] = useState<Wish['audio']>();
  const [recBusy, setRecBusy] = useState(false);
  const ready = text.trim().length >= 3 || (!!audio && !admin);
  const [filter, setFilter] = useState<Filter>('all');

  const canSend = admin || !!current;
  async function send() {
    if (!ready || !user) return;
    setBusy(true);
    try {
      if (admin) await addPublicWish(text.trim(), kind, newStatus);
      else await addWish(current!.id, text.trim(), kind, user.uid, profile?.name || user.displayName || '', audio);
      setText(''); setAudio(undefined);
      toast({ text: t('wl.sent'), tone: 'ok' });
    } catch { toast({ text: t('wl.error'), tone: 'bad' }); }
    setBusy(false);
  }

  const present = WISH_STATUSES.filter((s) => list.some((w) => w.status === s));
  const shown = filter === 'all' ? list : list.filter((w) => w.status === filter);

  return (
    <div className="col g24" style={{ maxWidth: '50rem' }}>
      <div className="col g8">
        <h1 className="h1"><span className="w9">{t('wl.title')}.</span></h1>
        <p className="t-md t-mute">{t('wl.sub')}</p>
      </div>

      <div className="card col g12">
        {canSend ? <>
          <textarea className="input" rows={3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)}
            placeholder={t('wl.placeholder')} aria-label={t('wl.placeholder')}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }} />
          <div className="row g8 wrap" style={{ alignItems: 'center' }}>
            <div className="seg" role="radiogroup" aria-label={t('wl.title')}>
              {(['improve', 'fix'] as const).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={kind === k} className={kind === k ? 'is-on' : ''} onClick={() => setKind(k)}>{t(`wl.kind.${k}`)}</button>
              ))}
            </div>
            {admin && <select className="input wl-select" style={{ width: 'auto' }} value={newStatus} onChange={(e) => setNewStatus(e.target.value as WishStatus)} aria-label={t('wl.adm.status')}>
              {WISH_STATUSES.map((s) => <option key={s} value={s}>{t(`wl.st.${s}`)}</option>)}
            </select>}
            {!admin && current && !audio && <VoiceNote brandId={current.id} onAdd={(f) => setAudio(f)} onBusy={setRecBusy} />}
            <span className="grow" />
            <button type="button" className="btn btn-primary" disabled={busy || recBusy || !ready} onClick={send}>{t(busy ? 'wl.sending' : 'wl.send')}</button>
          </div>
          {audio && current && <div className="row g8" style={{ alignItems: 'center' }}>
            <WishAudio brandId={current.id} audio={audio} />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAudio(undefined)}>{t('wl.delete')}</button>
          </div>}
          {admin && <p className="t-xs t-mute" style={{ margin: 0 }}>{t('wl.adm.newPublic')}</p>}
        </> : <p className="t-sm t-mute" style={{ margin: 0 }}>{t('wl.needBrand')}</p>}
      </div>

      {present.length > 1 && (
        <div className="row g8 wrap" role="group" aria-label={t('wl.adm.status')}>
          {(['all', ...present] as const).map((s) => (
            <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}>
              {t(s === 'all' ? 'wl.all' : `wl.st.${s}`)} <span className="apps-n">{s === 'all' ? list.length : list.filter((w) => w.status === s).length}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? <div className="skel" style={{ height: '10rem' }} />
        : list.length === 0 ? <div className="card t-mute">{t('wl.empty')}</div>
        : shown.length === 0 ? <div className="card t-mute">{t('wl.noMatch')}</div>
        : <ul className="wl-list">{shown.map((w) => <WishItem key={w.ref.path} w={w} />)}</ul>}
    </div>
  );
}
