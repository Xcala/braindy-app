import { useState } from 'react';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { useWishes, WISH_STATUSES, type WishStatus } from '../wishes/useWishes';
import { WishItem } from '../wishes/WishItem';
import { WishCompose } from '../wishes/WishCompose';
import '../accesses/apps.css';
import '../wishes/wishes.css';

type Filter = 'all' | WishStatus;

/**
 * Wishlist: clients ask for improvements or fixes to the Braindy app and follow how each one goes.
 * They see their brand's wishes plus the shared history (no client names); the admin sees every brand's and answers.
 * The same box and list also open from the «Ideas» button on every page (IdeasPanel).
 */
export function Wishlist() {
  const { t } = useI18n();
  const current = useBrands().current;
  const { list, loading, admin } = useWishes(current?.id);
  const [filter, setFilter] = useState<Filter>('all');
  const present = WISH_STATUSES.filter((s) => list.some((w) => w.status === s));
  const shown = filter === 'all' ? list : list.filter((w) => w.status === filter);

  return (
    <div className="col g24" style={{ maxWidth: '50rem' }}>
      <div className="col g8">
        <h1 className="h1"><span className="w9">{t('wl.title')}.</span></h1>
        <p className="t-md t-mute">{t('wl.sub')}</p>
      </div>

      <div className="card col g12"><WishCompose admin={admin} /></div>

      {present.length > 1 && (
        <div className="row g8 wrap" role="group" aria-label={t('wl.adm.status')}>
          {(['all', ...present] as const).map((s) => (
            <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)} className={`btn btn-sm btn-secondary${filter === s ? ' is-picked' : ''}`}>
              {t(s === 'all' ? 'wl.all' : `wl.st.${s}`)} <span className="apps-n">{s === 'all' ? list.length : list.filter((w) => w.status === s).length}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? <div className="skel" style={{ height: '10rem' }} />
        : list.length === 0 ? <div className="card t-mute">{t('wl.empty')}</div>
        : shown.length === 0 ? <div className="card t-mute">{t('wl.noMatch')}</div>
        : <ul className="wl-list card">{shown.map((w) => <WishItem key={w.ref.path} w={w} />)}</ul>}
    </div>
  );
}
