import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';

export type LegacyAsset = {
  id: string; type?: string; title?: string; url?: string | null; status?: string; publicSlug?: string | null;
  data?: { coverImageUrl?: string; description?: string; heroTitle?: string; heroSubtitle?: string;
    sections?: Array<{ id: string; type?: string; title?: string; imageUrl?: string; visible?: boolean }>;
    htmlFiles?: Array<{ downloadUrl?: string; isMain?: boolean }> };
};

const COVERS: Record<string, string> = {
  logodeck: 'radial-gradient(120% 90% at 85% 0%, rgba(42,127,255,.9), transparent 55%), radial-gradient(90% 80% at 0% 100%, rgba(167,139,250,.75), transparent 60%), #1F3596',
  marketmap: 'radial-gradient(100% 90% at 100% 0%, rgba(245,179,1,.35), transparent 55%), #060D1E',
  file: 'linear-gradient(60deg, #0B1220, #1F3596)',
};

/** "Brand documents" from the design: LogoDecks, MarketMaps and documents carried over from the old apps. */
export function BrandDocs({ assets, title }: { assets: LegacyAsset[]; title?: string }) {
  const { t } = useI18n();
  if (!assets.length) return null;
  const order = ['logodeck', 'marketmap', 'file'];
  const list = [...assets].sort((a, b) => order.indexOf(a.type ?? '') - order.indexOf(b.type ?? '') || String(a.title).localeCompare(String(b.title)));

  return (
    <section className="col g16" aria-labelledby="docs">
      <div className="row between wrap g8">
        <h2 className="h3" id="docs">{title ?? t('assets.docs')}</h2>
        {!title && <span className="t-sm t-mute">{t('assets.docsSub')}</span>}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((a) => {
          const kind = a.type === 'logodeck' ? 'LogoDeck' : a.type === 'marketmap' ? 'MarketMap' : t('assets.document');
          const Tag = a.url ? 'a' : 'div';
          return (
            <Tag key={a.id} className="deck" {...(a.url ? { href: a.url, target: '_blank', rel: 'noreferrer' } : {})}>
              <div className="cover" style={{ background: COVERS[a.type ?? 'file'] ?? COVERS.file, color: '#fff' }}>
                {a.data?.coverImageUrl ? <img className="bg" src={a.data.coverImageUrl} alt="" loading="lazy" /> : <Icon name="file" size={34} />}
              </div>
              <div className="body">
                <div className="row between g8">
                  <span className={`kind ${a.type === 'marketmap' ? 'kind-marketmap' : a.type === 'logodeck' ? 'kind-logodeck' : 'kind-manual'}`}>{kind}</span>
                  <span className={`chip ${a.status === 'published' ? 'c-approved' : 'c-draft'}`}>{a.status === 'published' ? t('assets.published') : t('assets.draft')}</span>
                </div>
                <span className="h3">{a.title}</span>
                {a.data?.description && <p className="t-sm t-mute line-clamp-2">{a.data.description}</p>}
                {a.url && <span className="t-sm w7" style={{ color: 'var(--azul)' }}>{t('common.open')} ↗</span>}
              </div>
            </Tag>
          );
        })}
      </div>
    </section>
  );
}
