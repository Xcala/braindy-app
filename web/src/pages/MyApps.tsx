import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { LinkGrid } from '../links/LinkGrid';
import { useBrandLinks } from '../links/useBrandLinks';

/** My apps: the brand's website and the web apps built for it, each one a link that opens in a new tab. */
export function MyApps() {
  const { current } = useBrands();
  const { t } = useI18n();
  const { links, loading } = useBrandLinks(current?.id, 'apps');
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;
  return (
    <div className="col g32">
      <div className="col g8">
        <p className="label">{current.name}</p>
        <h1 className="h1"><span className="w9">{t('nav.apps')}.</span> {t('apps.tagline')}</h1>
      </div>
      <LinkGrid brandId={current.id} section="apps" links={links} />
      {!loading && links.length === 0 && <div className="card t-mute">{t('apps.empty')}</div>}
    </div>
  );
}
