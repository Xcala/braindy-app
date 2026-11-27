import { useState } from 'react';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { useWishes, type Wish } from '../wishes/useWishes';
import { WishItem } from '../wishes/WishItem';
import { WishCompose } from '../wishes/WishCompose';
import '../accesses/apps.css';
import '../wishes/wishes.css';

type Filter = 'open' | 'done' | 'all';
const isOpen = (w: Wish) => w.status === 'new' || w.status === 'planned' || w.status === 'doing';

/**
 * Wishlist: clients ask for improvements or fixes to the Braindy app and follow how each one goes.
 * They see their brand's wishes plus the shared history (no client names); the admin sees every brand's and answers.
 * It opens on «Open» (decision 2026-11-27) so what is under way is not buried under what is done; «Done» and «All» are one tap away.
 * The same box and list also open from the «Ideas» button on every page (IdeasPanel).
 */
export function Wishlist() {
  const { t } = useI18n();
  const current = useBrands().current;
  const { list, loading, admin } = useWishes(current?.id);
  const [filter, setFilter] = useState<Filter>('open');
  const count: Record<Filter, number> = { open: list.filter(isOpen).length, done: list.filter((w) => w.status === 'done').length, all: list.length };
  const shown = filter === 'all' ? list : filter === 'open' ? list.filter(isOpen) : list.filter((w) => w.status === 'done');

  return (
    <div className="col g20" style={{ maxWidth: '50rem' }}>
      <div className="col g4">
        <h1 className="h1"><span className="w9">{t('wl.title')}.</span></h1>
        <p className="t-md t-mute" style={{ margin: 0 }}>{t('wl.sub')}</p>
      </div>

      <div className="card col g12"><WishCompose admin={admin} /></div>

      {list.length > 0 && (
        <div className="wl-filters" role="group" aria-label={t('wl.adm.status')}>
          {(['open', 'done', 'all'] as const).map((s) => (
            <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)} className={`btn btn-sm btn-secondary${filter === s ? ' is-picked' : ''}`}>
              {t(`wl.f.${s}`)} <span className="apps-n">{count[s]}</span>
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
