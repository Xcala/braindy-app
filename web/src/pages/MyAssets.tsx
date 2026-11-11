import { useSearchParams } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { FileExplorer } from '../assets/FileExplorer';
import { UploadButton } from '../assets/UploadButton';
import { useBrandVersions } from '../brands/versions/useBrandVersions';
import { VersionBar } from '../brands/versions/VersionBar';
import { useVersionView } from '../brands/versions/versionView';
import { useI18n } from '../i18n/I18nProvider';
import { ShareLinks } from '../share/ShareLinks';

export function MyAssets() {
  const { current } = useBrands();
  const { t } = useI18n();
  const [params] = useSearchParams();
  const versions = useBrandVersions(current?.id).list;
  const [ver, setVer] = useVersionView(current?.id, versions.map((v) => v.id));
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;

  return (
    <div className="col g32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="col g8">
          <p className="label">{current.name}</p>
          <h1 className="h1"><span className="w9">{t('files.title')}.</span> {t('assets.tagline')}</h1>
        </div>
        <div className="row g8 wrap"><ShareLinks brandId={current.id} /><UploadButton brandId={current.id} /></div>
      </div>
      <VersionBar brand={current} versions={versions} viewing={ver} onView={setVer} work />
      <FileExplorer brandId={current.id} brandName={current.name} startPath={params.get('folder') ?? ''} openId={params.get('file') ?? undefined} />
    </div>
  );
}
