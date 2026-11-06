import { useSearchParams } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { FileExplorer } from '../assets/FileExplorer';
import { UploadButton } from '../assets/UploadButton';
import { useI18n } from '../i18n/I18nProvider';

export function MyAssets() {
  const { current } = useBrands();
  const { t } = useI18n();
  const [params] = useSearchParams();
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;

  return (
    <div className="col g32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="col g8">
          <p className="label">{current.name}</p>
          <h1 className="h1"><span className="w9">{t('files.title')}.</span> {t('assets.tagline')}</h1>
        </div>
        <UploadButton brandId={current.id} />
      </div>
      <FileExplorer brandId={current.id} brandName={current.name} startPath={params.get('folder') ?? ''} openId={params.get('file') ?? undefined} />
    </div>
  );
}
