import { arrayRemove, arrayUnion, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n/I18nProvider';
import { Icon } from '../../components/Icon';
import { formatBytes } from '../../assets/fileApi';
import { extLabel, kindOf, thumbClass, type FileItem } from '../../assets/fileKinds';

/** A file NickMark pinned to My brand: the brand book (PDF, HTML), its .md and anything else made around the brand. */
export type BrandFile = Pick<FileItem, 'id' | 'title' | 'contentType' | 'size' | 'ext'>;

const ref = (brandId: string) => doc(db, 'brands', brandId, 'context', 'identity');
const entry = (f: BrandFile): BrandFile => ({ id: f.id, title: f.title, contentType: f.contentType, size: f.size, ...(f.ext ? { ext: f.ext } : {}) });

export const pinBrandFile = (brandId: string, f: BrandFile) => setDoc(ref(brandId), { documents: arrayUnion(entry(f)) }, { merge: true });
export const unpinBrandFile = (brandId: string, f: BrandFile) => updateDoc(ref(brandId), { documents: arrayRemove(entry(f)) });

export function BrandFiles({ brandId, files, isAdmin }: { brandId: string; files: BrandFile[]; isAdmin: boolean }) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {files.map((f) => (
        <div key={f.id} className="tile" style={{ padding: 0, position: 'relative' }}>
          {/* A real link to a new tab: the browser never blocks it. */}
          <a href={`/open/${brandId}/${f.id}`} target="_blank" rel="noopener" className="text-left" style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
            <div className={`thumb ${thumbClass[kindOf(f)]}`} style={{ height: '8.75rem', width: '100%' }}>
              <Icon name="file" size={36} className="ico" />
              <span className="chip chip-plain c-type badge" style={{ background: '#fff', zIndex: 1 }}>{extLabel(f)}</span>
            </div>
            <div className="tile-meta w-full">
              <span className="tile-name">{f.title}</span>
              <span className="t-sm t-mute">{formatBytes(f.size)} · {t('common.open')} ↗</span>
            </div>
          </a>
          {isAdmin && (
            <button type="button" className="btn btn-ghost btn-sm" style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#fff' }}
              aria-label={`${t('bf.unpin')}: ${f.title}`} title={t('bf.unpin')} onClick={() => window.confirm(t('bf.unpinConfirm')) && unpinBrandFile(brandId, f)}>
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
