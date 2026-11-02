import { useSearchParams } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { FileExplorer } from '../assets/FileExplorer';
import { UploadButton } from '../assets/UploadButton';
import { useI18n } from '../i18n/I18nProvider';
import { SignedContract } from '../contracts/SignedContract';

export function MyAssets() {
  const { current } = useBrands();
  const { t, lang } = useI18n();
  const [params] = useSearchParams();
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
              {t('assets.synced', { date: updated.toLocaleString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) })}
            </p>
          )}
        </div>
        <UploadButton brandId={current.id} />
      </div>
      <SignedContract brandId={current.id} contractId={current.onboarding?.contractId} />
      <FileExplorer brandId={current.id} brandName={current.name} startPath={params.get('folder') ?? ''} openId={params.get('file') ?? undefined} />
    </div>
  );
}
