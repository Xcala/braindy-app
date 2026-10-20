import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useBrands } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { FileExplorer } from '../assets/FileExplorer';
import { BrandDocs, type LegacyAsset } from '../assets/BrandDocs';
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
      <BrandDocs assets={legacy} />
      <FileExplorer brandId={current.id} brandName={current.name} />
    </div>
  );
}

/** Assets carried over from the old apps (LogoDecks, MarketMaps, orbit documents). */
function useLegacyAssets(brandId: string | undefined) {
  const [docs, setDocs] = useState<LegacyAsset[]>([]);
  useEffect(() => {
    if (!brandId) return;
    const q = query(collection(db, 'brands', brandId, 'assets'), where('source', '==', 'legacy'));
    return onSnapshot(q, (snap) => setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as LegacyAsset)), () => setDocs([]));
  }, [brandId]);
  return docs;
}
