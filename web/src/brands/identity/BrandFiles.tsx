import { arrayRemove, arrayUnion, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n/I18nProvider';
import { Icon } from '../../components/Icon';
import { formatBytes, signedUrl } from '../../assets/fileApi';
import { extLabel, kindOf, thumbClass, type FileItem } from '../../assets/fileKinds';

/** A file NickMark pinned to My brand: the brand book (PDF, HTML), its .md and anything else made around the brand. */
export type BrandFile = Pick<FileItem, 'id' | 'title' | 'contentType' | 'size' | 'ext'>;

const ref = (brandId: string) => doc(db, 'brands', brandId, 'context', 'identity');
const entry = (f: BrandFile): BrandFile => ({ id: f.id, title: f.title, contentType: f.contentType, size: f.size, ...(f.ext ? { ext: f.ext } : {}) });

export const pinBrandFile = (brandId: string, f: BrandFile) => setDoc(ref(brandId), { documents: arrayUnion(entry(f)) }, { merge: true });
export const unpinBrandFile = (brandId: string, f: BrandFile) => updateDoc(ref(brandId), { documents: arrayRemove(entry(f)) });

// HTML, Markdown and PDF open in a new tab; the rest downloads. The tab opens first so the browser does not block it.
async function openFile(brandId: string, f: BrandFile) {
  const inline = /^(text\/|application\/pdf)/.test(f.contentType);
  const tab = inline ? window.open('', '_blank') : null;
  const url = await signedUrl(brandId, f.id, inline);
  if (tab) tab.location.href = url; else window.location.assign(url);
}

export function BrandFiles({ brandId, files, isAdmin }: { brandId: string; files: BrandFile[]; isAdmin: boolean }) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {files.map((f) => (
        <div key={f.id} className="tile" style={{ padding: 0, position: 'relative' }}>
          <button type="button" className="text-left" style={{ cursor: 'pointer', padding: 0, border: 0, background: 'none', width: '100%' }} onClick={() => openFile(brandId, f)}>
            <div className={`thumb ${thumbClass[kindOf(f)]}`} style={{ height: 140, width: '100%' }}>
              <Icon name="file" size={36} className="ico" />
              <span className="chip chip-plain c-type badge" style={{ background: '#fff', zIndex: 1 }}>{extLabel(f)}</span>
            </div>
            <div className="tile-meta w-full">
              <span className="tile-name">{f.title}</span>
              <span className="t-sm t-mute">{formatBytes(f.size)} · {t('common.open')} ↗</span>
            </div>
          </button>
          {isAdmin && (
            <button type="button" className="btn btn-ghost btn-sm" style={{ position: 'absolute', top: 8, right: 8, background: '#fff' }}
              aria-label={`${t('bf.unpin')}: ${f.title}`} title={t('bf.unpin')} onClick={() => window.confirm(t('bf.unpinConfirm')) && unpinBrandFile(brandId, f)}>
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
