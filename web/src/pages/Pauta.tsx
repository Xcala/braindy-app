import { useState } from 'react';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { CampaignCard } from '../pauta/CampaignCard';
import { PlatformBadge, platformOf } from '../pauta/platforms';
import { usePauta, usePautaMedia } from '../pauta/usePauta';
import '../pauta/pauta.css';

/**
 * Pauta (2026-11-25): the brand's paid campaigns on every platform, each with its ads and their real pieces. View only:
 * the platforms publish, Braindy shows. Only the platforms the brand actually uses appear.
 */
export function Pauta() {
  const { current } = useBrands();
  const { t } = useI18n();
  const { list, loading } = usePauta(current?.id);
  const urls = usePautaMedia(current?.id, list.map((c) => c.id + c.ads.length).join());
  const [plat, setPlat] = useState('');
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;

  const platforms = [...new Set(list.map((c) => c.platform))];
  const shown = plat ? list.filter((c) => c.platform === plat) : list;
  const live = list.filter((c) => c.state === 'live').length;

  return (
    <div className="col g24">
      <div className="col g8">
        <p className="label">{current.name}</p>
        <h1 className="h1"><span className="w9">{t('pa.title')}.</span> {t('pa.tagline')}</h1>
        {list.length > 0 && <p className="t-sm t-mute" style={{ margin: 0 }}>{t(live === 1 ? 'pa.liveOne' : 'pa.live', { n: live })}</p>}
      </div>
      {platforms.length > 1 && (
        <div className="row g8 wrap" role="group" aria-label={t('pa.platforms')}>
          <button type="button" className={`btn btn-sm btn-secondary${!plat ? ' is-picked' : ''}`} aria-pressed={!plat} onClick={() => setPlat('')}>{t('cal.all')}</button>
          {platforms.map((p) => (
            <button key={p} type="button" className={`btn btn-sm btn-secondary${plat === p ? ' is-picked' : ''}`} aria-pressed={plat === p} onClick={() => setPlat(plat === p ? '' : p)}>
              <PlatformBadge platform={p} /> {platformOf(p).label}
            </button>
          ))}
        </div>
      )}
      {!loading && list.length === 0 && <div className="card t-mute">{t('pa.empty')}</div>}
      {shown.map((c) => <CampaignCard key={c.id} brandId={current.id} c={c} urls={urls} results={!!current.resultsOn} />)}
      <p className="t-xs t-mute">{t('pa.note')}</p>
    </div>
  );
}
