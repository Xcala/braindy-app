import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { PageHeader } from '../components/PageHeader';
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
  const isAdmin = useAuth().profile?.role === 'admin';
  const [adding, setAdding] = useState(false);
  const { links: all, loading } = useBrandLinks(current?.id, 'apps');
  const versions = useBrandVersions(current?.id).list;
  const [ver, setVer] = useVersionView(current?.id, versions.map((v) => v.id));
  // Rebranded brands: each app belongs to the version current when it was added.
  const links = versions.length ? all.filter((l) => (versionAt(versions, l.createdAt?.toMillis())?.id ?? null) === ver) : all;
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;
  return (
    <div className="col g32">
      <PageHeader title={t('sub.sites')} sub={t('apps.tagline')}
        actions={isAdmin && <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>+ {t('links.add')}</button>} />
      <VersionBar brand={current} versions={versions} viewing={ver} onView={setVer} work />
      <LinkGrid brandId={current.id} section="apps" links={links} adding={adding} onAdding={setAdding} />
      {!loading && links.length === 0 && <div className="card t-mute">{t('apps.empty')}</div>}
    </div>
  );
}
