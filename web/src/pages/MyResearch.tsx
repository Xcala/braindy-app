import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { PageHeader } from '../components/PageHeader';
import { useI18n } from '../i18n/I18nProvider';
import { BrandDocs } from '../assets/BrandDocs';
import { useLegacyAssets } from '../assets/useLegacyAssets';
import { LinkGrid } from '../links/LinkGrid';
import { useBrandLinks } from '../links/useBrandLinks';

/** My research: market maps carried over from the old apps plus studies NickMark publishes as links. */
export function MyResearch() {
  const { current } = useBrands();
  const { t } = useI18n();
  const isAdmin = useAuth().profile?.role === 'admin';
  const [adding, setAdding] = useState(false);
  const { links, loading } = useBrandLinks(current?.id, 'research');
  const maps = useLegacyAssets(current?.id).filter((a) => a.type === 'marketmap')
    .map((a) => ({ ...a, url: a.url ?? a.data?.htmlFiles?.find((f) => f.isMain)?.downloadUrl ?? a.data?.htmlFiles?.[0]?.downloadUrl ?? null }));
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;
  return (
    <div className="col g32">
      <PageHeader title={t('sub.research')} sub={t('research.tagline')}
        actions={isAdmin && <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>+ {t('links.add')}</button>} />
      {!loading && links.length === 0 && maps.length === 0 && <div className="card t-mute">{t('research.empty')}</div>}
      <BrandDocs assets={maps} title={t('research.marketmaps')} />
      <section className="col g16">
        {(links.length > 0 || maps.length > 0) && <h2 className="h3">{t('research.studies')}</h2>}
        <LinkGrid brandId={current.id} section="research" links={links} adding={adding} onAdding={setAdding} />
      </section>
    </div>
  );
}
