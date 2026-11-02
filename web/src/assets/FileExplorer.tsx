import { Fragment, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { normalizeSearch } from '../lib/text';
import { Icon } from '../components/Icon';
import { download, previewKind, removeFile } from './fileApi';
import { kindOf, type FileItem, type FileKind } from './fileKinds';
import { FileGrid, FileList, FolderGrid, ShareSwitch } from './FileViews';
import { Preview } from './Preview';
import { useThumbs } from './useThumbs';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { folderVisible, UPLOADS } from './folderRules';
import { useFolderShare } from './useFolderShare';
import { pinBrandFile, unpinBrandFile, type BrandFile } from '../brands/identity/BrandFiles';

type Folder = { path: string; files: number; bytes: number };
type Filter = 'all' | FileKind;
const PAGE = 48;
// Many folders (Quimiolab has 39) start as three rows; the rest opens on request.
const FOLDERS_FIRST = 12;
const parentOf = (p: string) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');

/** startPath/openId come from a search result: open that folder and show that file. */
export function FileExplorer({ brandId, brandName, startPath = '', openId }: { brandId: string; brandName: string; startPath?: string; openId?: string }) {
  const { t } = useI18n();
  const [path, setPath] = useState(startPath);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [limit, setLimit] = useState(PAGE);
  const [preview, setPreview] = useState<FileItem | null>(null);
  const [allFolders, setAllFolders] = useState(false);
  const index = useBrandDoc(brandId, 'context/fileIndex');
  const folders = (index.data?.folders as Folder[] | undefined) ?? [];
  const isAdmin = useAuth().profile?.role === 'admin';
  const brand = useBrands().brands.find((b) => b.id === brandId);
  const forClient = folderVisible(brand ?? { fileAccess: null }, false);
  const visible = isAdmin ? () => true : forClient;
  // Top-level folders NickMark can share; '' is the loose files at the root (only when there are any).
  const tops = useMemo(() => [...folders.filter((f) => f.path && !f.path.includes('/')).map((f) => f.path), ...(folders.some((f) => f.path === '' && f.files > 0) ? [''] : [])], [folders]);
  const share = useFolderShare(brand, tops);
  const [shareError, setShareError] = useState(false);
  // NickMark pins brand documents (brand book, .md, HTML) to My brand from here.
  const identity = useBrandDoc(isAdmin ? brandId : undefined, 'context/identity');
  const pinned = ((identity.data?.documents as BrandFile[] | undefined) ?? []);
  const pin = isAdmin ? {
    on: (id: string) => pinned.some((d) => d.id === id),
    toggle: (f: FileItem) => { const old = pinned.find((d) => d.id === f.id); (old ? unpinBrandFile(brandId, old) : pinBrandFile(brandId, f)).catch(() => setShareError(true)); },
  } : undefined;
  const [deleteError, setDeleteError] = useState(false);
  const del = isAdmin ? (f: FileItem) => { setDeleteError(false); removeFile(brandId, f.id).catch(() => setDeleteError(true)); } : undefined;
  // Bulk delete: tick files, then one click (and one confirm) deletes them all.
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const sel = isAdmin ? { on: (id: string) => picked.has(id), toggle: (id: string) => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; }) } : undefined;
  const delPicked = async () => {
    if (!window.confirm(t('files.deleteSelConfirm', { n: String(picked.size) }))) return;
    setBusy(true); setDeleteError(false);
    const ids = [...picked];
    // A few at a time: each delete also updates the folder counts, which must not race too hard.
    for (let i = 0; i < ids.length; i += 4) {
      const r = await Promise.allSettled(ids.slice(i, i + 4).map((id) => removeFile(brandId, id)));
      if (r.some((x) => x.status === 'rejected')) setDeleteError(true);
    }
    setPicked(new Set()); setBusy(false);
  };
  const toggle = (top: string) => { setShareError(false); share.toggle(top).catch(() => setShareError(true)); };

  useEffect(() => { setPath(startPath); }, [brandId, startPath]);
  useEffect(() => { setLimit(PAGE); setQ(''); setAllFolders(false); setPicked(new Set()); }, [brandId, path]);
  const pathShared = visible(path);
  useEffect(() => {
    if (!pathShared) { setFiles([]); return; }
    const qy = query(collection(db, 'brands', brandId, 'assets'), where('folder', '==', path));
    return onSnapshot(qy, (s) => setFiles(
      s.docs.filter((d) => d.get('status') !== 'uploading')
        .map((d) => ({ id: d.id, ...(d.data() as Omit<FileItem, 'id'>) }))
        .sort((a, b) => a.title.localeCompare(b.title)),
    ), () => setFiles([]));
  }, [brandId, path, pathShared]);

  const subfolders = useMemo(() => {
    const list = folders.filter((f) => f.path && parentOf(f.path) === path && visible(f.path))
      .map((f) => ({ ...f, highlight: false, hidden: isAdmin && !forClient(f.path), toggle: isAdmin && !path ? () => toggle(f.path) : undefined }));
    if (!path) list.unshift({ path: UPLOADS, files: 0, bytes: 0, highlight: true, hidden: false, toggle: undefined });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folders, path, isAdmin, brand?.fileAccess, tops]);

  const needle = normalizeSearch(q);
  const shown = files.filter((f) => (filter === 'all' || kindOf(f) === filter) && (!needle || normalizeSearch(f.title).includes(needle)));
  const page = shown.slice(0, limit);
  const thumbs = useThumbs(brandId, view === 'grid' ? page.filter((f) => kindOf(f) === 'image' && previewKind(f.contentType)).map((f) => f.id) : []);
  useEffect(() => {
    const f = openId ? files.find((x) => x.id === openId) : undefined;
    if (f && previewKind(f.contentType)) setPreview(f);
  }, [openId, files]);
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
        <div className="seg seg-scroll fseg" role="group" aria-label={t('files.filter')}>
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
            <div className="row between g8 wrap">
              <p className="label">{t('files.folders')} · {subfolders.length}</p>
              {isAdmin && !path && tops.length > 0 && (
                <span className="t-xs t-mute row g8" role="status">
                  {shareError ? <span style={{ color: 'var(--danger)' }}>{t('fa.error')}</span> : t('fa.clientSees', { n: String(share.count), m: String(tops.length) })}
                  {share.count < tops.length && <button type="button" className="t-xs w7" style={{ color: 'var(--azul)' }} onClick={() => share.showAll().catch(() => setShareError(true))}>{t('fa.showAll')}</button>}
                  {share.count > 0 && <button type="button" className="t-xs w7" style={{ color: 'var(--azul)' }} onClick={() => window.confirm(t('fa.hideAllConfirm')) && share.hideAll().catch(() => setShareError(true))}>{t('fa.hideAll')}</button>}
                </span>
              )}
            </div>
            <FolderGrid folders={allFolders ? subfolders : subfolders.slice(0, FOLDERS_FIRST)} onOpen={setPath} />
            {subfolders.length > FOLDERS_FIRST && (
              <button type="button" className="btn btn-secondary btn-sm self-start" onClick={() => setAllFolders((a) => !a)}>
                {allFolders ? t('common.showLess') : t('common.showAll', { n: String(subfolders.length) })}
              </button>
            )}
          </div>
        )}
        <div className="col g12">
          <div className="row between g8 wrap">
            <p className="label">{t('files.files')} · {shown.length}{deleteError && <span className="t-xs" role="alert" style={{ color: 'var(--danger)', marginLeft: 8, textTransform: 'none' }}>{t('files.deleteError')}</span>}</p>
            {sel && page.length > 0 && (
              <span className="row g8 t-xs" role="status">
                {picked.size > 0 ? <>
                  <span className="w7">{t('files.selected', { n: String(picked.size) })}</span>
                  <button type="button" className="btn btn-sm" disabled={busy} onClick={delPicked} style={{ background: 'var(--danger)', color: '#fff' }}><Icon name="trash" size={14} /> {t('files.deleteSel', { n: String(picked.size) })}</button>
                  <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setPicked(new Set())}>{t('files.clearSel')}</button>
                </> : <button type="button" className="t-xs w7" style={{ color: 'var(--azul)' }} onClick={() => setPicked(new Set(page.map((f) => f.id)))}>{t('files.selectAll')}</button>}
              </span>
            )}
            {isAdmin && !path && tops.includes('') && <ShareSwitch on={share.isShared('')} label={t('fa.root')} onToggle={() => toggle('')} />}
          </div>
          {index.loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skel" style={{ height: 230 }} />)}</div>
          ) : shown.length === 0 ? (
            <div className="empty"><Icon name="folder" size={32} /><p className="t-mute">{needle ? t('files.noMatch') : t('assets.empty')}</p></div>
          ) : view === 'grid' ? (
            <FileGrid files={page} thumbs={thumbs} onOpen={open} pin={pin} onDelete={del} sel={sel} />
          ) : (
            <FileList files={page} onOpen={open} onDownload={(f) => download(brandId, f.id)} pin={pin} onDelete={del} sel={sel} />
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
