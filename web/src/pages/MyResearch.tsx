import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { BrandDocs } from '../assets/BrandDocs';
import { useLegacyAssets } from '../assets/useLegacyAssets';
import { LinkGrid } from '../links/LinkGrid';
import { useBrandLinks } from '../links/useBrandLinks';

/** My research: market maps carried over from the old apps plus studies NickMark publishes as links. */
export function MyResearch() {
  const { current } = useBrands();
  const { t } = useI18n();
  const { links, loading } = useBrandLinks(current?.id, 'research');
  const maps = useLegacyAssets(current?.id).filter((a) => a.type === 'marketmap')
    .map((a) => ({ ...a, url: a.url ?? a.data?.htmlFiles?.find((f) => f.isMain)?.downloadUrl ?? a.data?.htmlFiles?.[0]?.downloadUrl ?? null }));
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;
  return (
    <div className="col g32">
      <div className="col g8">
        <p className="label">{current.name}</p>
        <h1 className="h1"><span className="w9">{t('nav.research')}.</span> {t('research.tagline')}</h1>
      </div>
      {!loading && links.length === 0 && maps.length === 0 && <div className="card t-mute">{t('research.empty')}</div>}
      <BrandDocs assets={maps} title={t('research.marketmaps')} />
      <section className="col g16">
        {(links.length > 0 || maps.length > 0) && <h2 className="h3">{t('research.studies')}</h2>}
        <LinkGrid brandId={current.id} section="research" links={links} />
      </section>
    </div>
  );
}
