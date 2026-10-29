import { useBrands } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { FileExplorer } from '../assets/FileExplorer';
import { BrandDocs } from '../assets/BrandDocs';
import { useLegacyAssets } from '../assets/useLegacyAssets';
import { UploadButton } from '../assets/UploadButton';
import { useI18n } from '../i18n/I18nProvider';

export function MyAssets() {
  const { current } = useBrands();
  const { t, lang } = useI18n();
  const legacy = useLegacyAssets(current?.id);
  const index = useBrandDoc(current?.id, 'context/fileIndex');
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;

  const updated = (index.data?.updatedAt as { toDate?: () => Date } | undefined)?.toDate?.();
  return (
    <div className="col g32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="col g8">
          <p className="label">{current.name}</p>
          <h1 className="h1"><span className="w9">{t('nav.assets')}.</span> {t('assets.tagline')}</h1>
          {updated && (
            <p className="t-mute">
              {t('assets.synced', { date: updated.toLocaleString(lang === 'es' ? 'es-CO' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }) })}
            </p>
          )}
        </div>
        <UploadButton brandId={current.id} />
      </div>
      {/* LogoDecks live in My brand and MarketMaps in My research; only other carried-over documents stay here. */}
      <BrandDocs assets={legacy.filter((a) => a.type !== 'logodeck' && a.type !== 'marketmap')} />
      <FileExplorer brandId={current.id} brandName={current.name} />
    </div>
  );
}
