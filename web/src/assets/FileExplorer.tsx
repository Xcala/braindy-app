import { Fragment, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { normalizeSearch } from '../lib/text';
import { Icon } from '../components/Icon';
import { download, previewKind } from './fileApi';
import { kindOf, type FileItem, type FileKind } from './fileKinds';
import { FileGrid, FileList, FolderGrid } from './FileViews';
import { Preview } from './Preview';
import { useThumbs } from './useThumbs';

type Folder = { path: string; files: number; bytes: number };
type Filter = 'all' | FileKind;
const UPLOADS = 'Uploads';
const PAGE = 48;
const parentOf = (p: string) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');

export function FileExplorer({ brandId, brandName }: { brandId: string; brandName: string }) {
  const { t } = useI18n();
  const [path, setPath] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [limit, setLimit] = useState(PAGE);
  const [preview, setPreview] = useState<FileItem | null>(null);
  const index = useBrandDoc(brandId, 'context/fileIndex');
  const folders = (index.data?.folders as Folder[] | undefined) ?? [];

  useEffect(() => { setPath(''); }, [brandId]);
  useEffect(() => { setLimit(PAGE); setQ(''); }, [brandId, path]);
  useEffect(() => {
    const qy = query(collection(db, 'brands', brandId, 'assets'), where('folder', '==', path));
    return onSnapshot(qy, (s) => setFiles(
      s.docs.filter((d) => d.get('status') !== 'uploading')
        .map((d) => ({ id: d.id, ...(d.data() as Omit<FileItem, 'id'>) }))
        .sort((a, b) => a.title.localeCompare(b.title)),
    ), () => setFiles([]));
  }, [brandId, path]);

  const subfolders = useMemo(() => {
    const list = folders.filter((f) => f.path && parentOf(f.path) === path).map((f) => ({ ...f, highlight: false }));
    if (!path) list.unshift({ path: UPLOADS, files: 0, bytes: 0, highlight: true });
    return list;
  }, [folders, path]);

  const needle = normalizeSearch(q);
  const shown = files.filter((f) => (filter === 'all' || kindOf(f) === filter) && (!needle || normalizeSearch(f.title).includes(needle)));
  const page = shown.slice(0, limit);
  const thumbs = useThumbs(brandId, view === 'grid' ? page.filter((f) => kindOf(f) === 'image' && previewKind(f.contentType)).map((f) => f.id) : []);
  const open = (f: FileItem) => (previewKind(f.contentType) ? setPreview(f) : download(brandId, f.id));
  const crumbs = path ? path.split('/') : [];

  return (
    <section className="card" style={{ padding: 0, overflow: 'hidden' }} aria-labelledby="files-crumbs">
      <div className="flex flex-wrap items-center gap-4 border-b px-4 py-4 sm:px-6" style={{ borderColor: 'var(--line)' }}>
        <nav className="crumbs grow" aria-label="Breadcrumb" id="files-crumbs">
          <a href="#" onClick={(e) => { e.preventDefault(); setPath(''); }} className={crumbs.length ? '' : 'cur'}>{brandName}</a>
          {crumbs.map((c, i) => (
            <Fragment key={i}>
              <Icon name="chevronRight" size={14} />
              {i === crumbs.length - 1 ? <span className="cur">{c}</span>
                : <a href="#" onClick={(e) => { e.preventDefault(); setPath(crumbs.slice(0, i + 1).join('/')); }}>{c}</a>}
            </Fragment>
          ))}
        </nav>
        <div className="search w-full sm:w-[260px]">
          <Icon name="search" />
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('files.search')}
            placeholder={t('files.searchIn', { name: crumbs[crumbs.length - 1] ?? brandName })} />
        </div>
        <div className="seg overflow-x-auto" role="group" aria-label={t('files.filter')}>
          {(['all', 'image', 'video', 'pdf', 'design'] as Filter[]).map((k) => (
            <button key={k} className={filter === k ? 'is-on' : ''} aria-pressed={filter === k} onClick={() => setFilter(k)}>{t(`files.kind.${k}`)}</button>
          ))}
        </div>
        <div className="seg" role="group" aria-label={t('files.view')}>
          <button className={view === 'grid' ? 'is-on' : ''} aria-pressed={view === 'grid'} aria-label={t('files.grid')} onClick={() => setView('grid')}><Icon name="grid" /></button>
          <button className={view === 'list' ? 'is-on' : ''} aria-pressed={view === 'list'} aria-label={t('files.listView')} onClick={() => setView('list')}><Icon name="list" /></button>
        </div>
      </div>
      <div className="col g24 p-4 sm:p-6">
        {subfolders.length > 0 && !needle && (
          <div className="col g12">
            <p className="label">{t('files.folders')} · {subfolders.length}</p>
            <FolderGrid folders={subfolders} onOpen={setPath} />
          </div>
        )}
        <div className="col g12">
          <p className="label">{t('files.files')} · {shown.length}</p>
          {index.loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skel" style={{ height: 230 }} />)}</div>
          ) : shown.length === 0 ? (
            <div className="empty"><Icon name="folder" size={32} /><p className="t-mute">{needle ? t('files.noMatch') : t('assets.empty')}</p></div>
          ) : view === 'grid' ? (
            <FileGrid files={page} thumbs={thumbs} onOpen={open} />
          ) : (
            <FileList files={page} onOpen={open} onDownload={(f) => download(brandId, f.id)} />
          )}
          {shown.length > limit && (
            <button className="btn btn-secondary self-start" onClick={() => setLimit((l) => l + PAGE)}>
              {t('files.showMore', { n: Math.min(PAGE, shown.length - limit) })}
            </button>
          )}
        </div>
      </div>
      {preview && <Preview brandId={brandId} file={preview} onClose={() => setPreview(null)} />}
    </section>
  );
}
