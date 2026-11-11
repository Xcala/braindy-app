import { useBrands } from '../brands/BrandProvider';
import { useBrandVersions, versionAt } from '../brands/versions/useBrandVersions';
import { VersionBar } from '../brands/versions/VersionBar';
import { useVersionView } from '../brands/versions/versionView';
import { useI18n } from '../i18n/I18nProvider';
import { LinkGrid } from '../links/LinkGrid';
import { useBrandLinks } from '../links/useBrandLinks';

/** My apps: the brand's website and the web apps built for it. Each opens inside Braindy beside its own adjustments. */
export function MyApps() {
  const { current } = useBrands();
  const { t } = useI18n();
  const { links: all, loading } = useBrandLinks(current?.id, 'apps');
  const versions = useBrandVersions(current?.id).list;
  const [ver, setVer] = useVersionView(current?.id, versions.map((v) => v.id));
  // Rebranded brands: each app belongs to the version current when it was added.
  const links = versions.length ? all.filter((l) => (versionAt(versions, l.createdAt?.toMillis())?.id ?? null) === ver) : all;
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;
  return (
    <div className="col g32">
      <div className="col g8">
        <p className="label">{current.name}</p>
        <h1 className="h1"><span className="w9">{t('nav.apps')}.</span> {t('apps.tagline')}</h1>
      </div>
      <VersionBar brand={current} versions={versions} viewing={ver} onView={setVer} work />
      <LinkGrid brandId={current.id} section="apps" links={links} />
      {!loading && links.length === 0 && <div className="card t-mute">{t('apps.empty')}</div>}
    </div>
  );
}
