import { useSearchParams } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { PageHeader } from '../components/PageHeader';
import { useBrands } from '../brands/BrandProvider';
import { FileExplorer } from '../assets/FileExplorer';
import { UploadButton } from '../assets/UploadButton';
import { useOpenFolder } from '../assets/openFolder';
import { canAddTo, UPLOADS } from '../assets/folderRules';
import { useBrandVersions } from '../brands/versions/useBrandVersions';
import { VersionBar } from '../brands/versions/VersionBar';
import { useVersionView } from '../brands/versions/versionView';
import { useI18n } from '../i18n/I18nProvider';
import { ShareLinks } from '../share/ShareLinks';
import { DeliveriesGallery } from '../assets/DeliveriesGallery';
import '../accesses/apps.css';

/** My brand › Library (photos, videos, documents, what the client uploads) or › Deliveries (what NickMark delivered and the client approved). */
export function MyAssets({ deliveries = false }: { deliveries?: boolean }) {
  const { current } = useBrands();
  const { t } = useI18n();
  const [params] = useSearchParams();
  const isAdmin = useAuth().profile?.role === 'admin';
  const versions = useBrandVersions(current?.id).list;
  const [ver, setVer] = useVersionView(current?.id, versions.map((v) => v.id));
  // Upload lands in the open folder when it may; otherwise in Uploads, which then opens so the files are in view.
  const [openPath, setOpenPath] = useOpenFolder(current?.id ?? '');
  const here = !!current && canAddTo(current, isAdmin)(openPath);
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;

  return (
    <div className="col g32">
      <PageHeader title={t(deliveries ? 'sub.deliveries' : 'sub.library')} sub={t(deliveries ? 'assets.deliveriesTagline' : 'assets.tagline')}
        actions={!deliveries && <>{isAdmin && <ShareLinks brandId={current.id} />}<UploadButton brandId={current.id} folder={here ? openPath : undefined} label={here ? t('files.uploadHere') : undefined}
          onDone={() => { if (!here) setOpenPath(UPLOADS); }} /></>} />
      <VersionBar brand={current} versions={versions} viewing={ver} onView={setVer} work />
      {deliveries
        ? <DeliveriesGallery brandId={current.id} brandName={current.name} startPath={params.get('folder') ?? undefined} />
        : <FileExplorer brandId={current.id} brandName={current.name} startPath={params.get('folder') ?? ''} hideApproved openId={params.get('file') ?? undefined} />}
    </div>
  );
}
