import { useBrands } from '../../brands/BrandProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { Scene } from '../../studio/Scene';
import { SEATS } from '../../studio/geometry';
import { SEAT_NAME } from '../../studio/FocusCard';
import { useStudio } from '../../studio/useStudio';

const time = (ms: number) => new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ms));

/** Admin · The Studio: NickMark and his Brains working in San Francisco, connected to the real requests. */
export function AdminStudio() {
  const { t } = useI18n();
  const { brands } = useBrands();
  const { seats, feed, items, toSignCount } = useStudio();
  const brand = (id?: string) => brands.find((b) => b.id === id)?.name ?? '';

  return (
    <div className="col g24">
      <div className="col g8">
        <p className="label">Braindy · San Francisco, California</p>
        <h1 className="h1"><span className="w9">{t('st.title')}.</span></h1>
        <p className="t-mute">{t('st.sub')}</p>
      </div>
      <Scene seats={seats} items={items} toSignCount={toSignCount} />
      <section className="card col g12" aria-labelledby="h-live">
        <h2 className="h3" id="h-live">{t('st.live')}</h2>
        {feed.length === 0 && <p className="t-sm t-mute">{t('st.feedEmpty')}</p>}
        {feed.map((e) => (
          <div key={e.id} className="row g12 t-sm" style={{ alignItems: 'flex-start' }}>
            <i style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 6, flex: 'none', background: SEATS[e.brain]?.c ?? '#888', border: '1px solid var(--line)' }} />
            <div className="col min-w-0">
              <span><b>{SEAT_NAME[e.brain] ?? e.brain}</b> · {e.kind === 'note' ? `NicoMarca: ${e.text}` : e.text}</span>
              <span className="t-xs t-mute">{brand(e.brandId)}{e.brandId ? ' · ' : ''}{e.at ? `${time(e.at)} SF` : ''}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
