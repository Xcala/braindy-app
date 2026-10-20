import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { download, formatBytes, previewKind } from './fileApi';
import { Preview, type FileItem } from './Preview';
import { UploadButton } from './UploadButton';

type Folder = { path: string; files: number; bytes: number };
const UPLOADS = 'Uploads';

const parentOf = (p: string) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
const nameOf = (p: string) => p.slice(p.lastIndexOf('/') + 1);

export function FileExplorer({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const [path, setPath] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [preview, setPreview] = useState<FileItem | null>(null);
  const index = useBrandDoc(brandId, 'context/fileIndex');
  const folders = (index.data?.folders as Folder[] | undefined) ?? [];

  useEffect(() => { setPath(''); }, [brandId]);
  useEffect(() => {
    const q = query(collection(db, 'brands', brandId, 'assets'), where('folder', '==', path));
    return onSnapshot(q, (s) => setFiles(
      s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FileItem, 'id'> & { status?: string }) }))
        .filter((f) => (f as { status?: string }).status !== 'uploading')
        .sort((a, b) => a.title.localeCompare(b.title)),
    ), () => setFiles([]));
  }, [brandId, path]);

  const subfolders = useMemo(() => {
    const list = folders.filter((f) => f.path && parentOf(f.path) === path);
    if (!path && !list.some((f) => f.path === UPLOADS)) list.push({ path: UPLOADS, files: 0, bytes: 0 });
    return list;
  }, [folders, path]);

  if (!folders.length && !files.length && !path) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-black/20 p-6 text-sm text-black/55">
        {t('files.none')}
        <UploadButton brandId={brandId} />
      </div>
    );
  }

  const crumbs = path ? path.split('/') : [];
  return (
    <div className="rounded-xl border border-black/10 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-4 py-3">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm">
          <button onClick={() => setPath('')} className="hover:underline">{t('files.root')}</button>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-black/30">/</span>
              <button onClick={() => setPath(crumbs.slice(0, i + 1).join('/'))} className="hover:underline">{c}</button>
            </span>
          ))}
        </nav>
        <UploadButton brandId={brandId} />
      </div>
      <ul className="divide-y divide-black/5">
        {subfolders.map((f) => (
          <li key={f.path}>
            <button onClick={() => setPath(f.path)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-black/[0.03]">
              <span className="flex items-center gap-2"><span aria-hidden>📁</span>{nameOf(f.path)}</span>
              {f.bytes > 0 && <span className="text-xs text-black/45">{formatBytes(f.bytes)}</span>}
            </button>
          </li>
        ))}
        {files.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <button
              onClick={() => (previewKind(f.contentType) ? setPreview(f) : download(brandId, f.id))}
              className="min-w-0 truncate text-left hover:underline"
            >
              {f.title}
            </button>
            <span className="flex shrink-0 items-center gap-3 text-xs text-black/45">
              {formatBytes(f.size)}
              <button onClick={() => download(brandId, f.id)} className="rounded-full border border-black/15 px-2.5 py-1 text-black/70 hover:bg-black/5">
                {t('common.download')}
              </button>
            </span>
          </li>
        ))}
        {!subfolders.length && !files.length && <li className="px-4 py-6 text-sm text-black/50">{t('assets.empty')}</li>}
      </ul>
      {preview && <Preview brandId={brandId} file={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
