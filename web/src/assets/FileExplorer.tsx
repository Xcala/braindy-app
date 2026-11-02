import { useCallback, useEffect, useMemo, useState, type CSSProperties, type DragEvent } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { normalizeSearch } from '../lib/text';
import { Icon } from '../components/Icon';
import { download, previewKind } from './fileApi';
import { kindOf, type FileItem } from './fileKinds';
import { FileGrid, FileList, FolderGrid, ShareSwitch } from './FileViews';
import { Preview } from './Preview';
import { useThumbs } from './useThumbs';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { folderVisible, UPLOADS } from './folderRules';
import { useFolderShare } from './useFolderShare';
import { pinBrandFile, unpinBrandFile, type BrandFile } from '../brands/identity/BrandFiles';
import { ExplorerToolbar, SORTS, type Filter, type Sort } from './ExplorerToolbar';
import { useFileActions } from './useFileActions';
import { FileMenu } from './FileMenu';
import { SelectionBar } from './SelectionBar';
import { FileDialogs } from './FileDialogs';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { TrashView } from './TrashView';
import { UploadButton, UploadStatus } from './UploadButton';
import { useUploader } from './useUploader';
import { useSearchAll } from './useSearchAll';
import './files.css';

type Folder = { path: string; files: number; bytes: number };
const SORT_KEY = 'braindy.files.sort';
const savedSort = (): Sort => { try { const s = localStorage.getItem(SORT_KEY) as Sort; return SORTS.includes(s) ? s : 'name'; } catch { return 'name'; } };
// Drive files keep their own date; files uploaded in Braindy use the upload (or import) time.
const ms = (v: unknown) => (v && typeof (v as { toMillis?: () => number }).toMillis === 'function' ? (v as { toMillis: () => number }).toMillis() : undefined);
const PAGE = 48;
// Many folders (Quimiolab has 39) start as three rows; the rest opens on request.
const FOLDERS_FIRST = 12;
const parentOf = (p: string) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');

/** Copies after the first (oldest) of each name + size pair: what "Select the copies" ticks. */
function repeatedCopies(files: FileItem[]) {
  const groups = new Map<string, FileItem[]>();
  for (const f of files) { const k = `${f.title}|${f.size}`; groups.set(k, [...(groups.get(k) ?? []), f]); }
  return [...groups.values()].filter((g) => g.length > 1)
    .flatMap((g) => g.sort((a, b) => (a.mtimeMs ?? Infinity) - (b.mtimeMs ?? Infinity)).slice(1).map((f) => f.id));
}

/** startPath/openId come from a search result: open that folder and show that file. */
export function FileExplorer({ brandId, brandName, startPath = '', openId }: { brandId: string; brandName: string; startPath?: string; openId?: string }) {
  const { t } = useI18n();
  const [path, setPath] = useState(startPath);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [q, setQ] = useState('');
  const [everywhere, setEverywhere] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sort, setSortState] = useState<Sort>(savedSort);
  const setSort = (s: Sort) => { setSortState(s); try { localStorage.setItem(SORT_KEY, s); } catch { /* private mode */ } };
  const [limit, setLimit] = useState(PAGE);
  const [preview, setPreview] = useState<FileItem | null>(null);
  const [allFolders, setAllFolders] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hideAsk, setHideAsk] = useState(false);
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
  const actions = useFileActions(brandId, brandName);
  const menu = isAdmin ? (f: FileItem, style?: CSSProperties) => <FileMenu f={f} actions={actions} style={style} /> : undefined;
  const dropUp = useUploader(brandId);
  const closeHide = useCallback(() => setHideAsk(false), []);
  const toggle = (top: string) => { setShareError(false); share.toggle(top).catch(() => setShareError(true)); };

  useEffect(() => { setPath(startPath); }, [brandId, startPath]);
  useEffect(() => { setLimit(PAGE); setAllFolders(false); actions.clear(); setTrashOpen(false); if (!everywhere) setQ(''); }, [brandId, path]); // eslint-disable-line react-hooks/exhaustive-deps
  const pathShared = visible(path);
  useEffect(() => {
    if (!pathShared) { setFiles([]); return; }
    const qy = query(collection(db, 'brands', brandId, 'assets'), where('folder', '==', path));
    return onSnapshot(qy, (s) => setFiles(
      s.docs.filter((d) => d.get('status') !== 'uploading')
        .map((d) => ({ id: d.id, ...(d.data() as Omit<FileItem, 'id'>), mtimeMs: (d.get('mtimeMs') as number | undefined) ?? ms(d.get('uploadedAt')) ?? ms(d.get('importedAt')) })),
    ), () => setFiles([]));
  }, [brandId, path, pathShared]);

  const subfolders = useMemo(() => {
    const list = folders.filter((f) => f.path && parentOf(f.path) === path && visible(f.path))
      .map((f) => ({ ...f, highlight: false, hidden: isAdmin && !forClient(f.path), toggle: isAdmin && !path ? () => toggle(f.path) : undefined }));
    if (!path) list.unshift({ path: UPLOADS, files: 0, bytes: 0, highlight: true, hidden: false, toggle: undefined });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folders, path, isAdmin, brand?.fileAccess, tops]);
  const moveTargets = useMemo(() => ['', UPLOADS, ...folders.map((f) => f.path).filter((p) => p && p !== path)].filter((p, i, a) => a.indexOf(p) === i), [folders, path]);

  const needle = normalizeSearch(q);
  const hits = useSearchAll(brandId, q.trim(), everywhere || !path, Number(actions.busy));
  const searchingAll = hits !== null;
  const source = searchingAll ? hits : files;
  const shown = source.filter((f) => (filter === 'all' || kindOf(f) === filter) && (searchingAll || !needle || normalizeSearch(f.title).includes(needle)))
    .sort(sort === 'name' ? (a, b) => a.title.localeCompare(b.title)
      : sort === 'big' ? (a, b) => b.size - a.size
      : (a, b) => ((a.mtimeMs ?? 0) - (b.mtimeMs ?? 0)) * (sort === 'new' ? -1 : 1));
  const page = shown.slice(0, limit);
  const sel = actions.selIn(page.map((f) => f.id));
  const copies = isAdmin && !searchingAll ? repeatedCopies(files) : [];
  const thumbs = useThumbs(brandId, view === 'grid' ? page.filter((f) => kindOf(f) === 'image' && previewKind(f.contentType)).map((f) => f.id) : []);
  useEffect(() => {
    const f = openId ? files.find((x) => x.id === openId) : undefined;
    if (f && previewKind(f.contentType)) setPreview(f);
  }, [openId, files]);
  const open = (f: FileItem) => (previewKind(f.contentType) ? setPreview(f) : download(brandId, f.id));
  const goFolder = (p: string) => { setEverywhere(false); setQ(''); setPath(p); };
  // NickMark drops files from the desktop straight into the open folder.
  const canDrop = isAdmin && !!path && path !== UPLOADS && !trashOpen;
  const dragProps = canDrop ? {
    onDragOver: (e: DragEvent) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDragging(true); } },
    onDragLeave: (e: DragEvent) => { if (e.currentTarget === e.target) setDragging(false); },
    onDrop: (e: DragEvent) => { e.preventDefault(); setDragging(false); void dropUp.run(e.dataTransfer.files, path); },
  } : {};

  return (
    <section className={`card fx${dragging ? ' is-drop' : ''}`} style={{ padding: 0, overflow: 'clip', position: 'relative' }} aria-labelledby="files-crumbs" {...dragProps}>
      <ExplorerToolbar brandName={brandName} path={path} setPath={goFolder} q={q} setQ={setQ} everywhere={everywhere} setEverywhere={setEverywhere}
        filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} view={view} setView={setView}
        actions={canDrop ? <UploadButton brandId={brandId} folder={path} label={t('files.uploadHere')} secondary /> : undefined} />
      {dragging && <div className="fdrop" aria-hidden="true"><Icon name="upload" size={28} />{t('files.dropHere', { name: path.split('/').pop() ?? '' })}</div>}
      <div className="col g24 p-4 sm:p-6">
        {trashOpen ? <TrashView brandId={brandId} onBack={() => setTrashOpen(false)} /> : <>
        {subfolders.length > 0 && !needle && (
          <div className="col g12">
            <div className="row between g8 wrap">
              <p className="label">{t('files.folders')} · {subfolders.length}</p>
              {isAdmin && !path && (
                <span className="t-xs t-mute row g8" role="status">
                  {tops.length > 0 && <>
                    {shareError ? <span style={{ color: 'var(--danger)' }}>{t('fa.error')}</span> : t('fa.clientSees', { n: String(share.count), m: String(tops.length) })}
                    {share.count < tops.length && <button type="button" className="t-xs w7" style={{ color: 'var(--azul)' }} onClick={() => share.showAll().catch(() => setShareError(true))}>{t('fa.showAll')}</button>}
                    {share.count > 0 && <button type="button" className="t-xs w7" style={{ color: 'var(--azul)' }} onClick={() => setHideAsk(true)}>{t('fa.hideAll')}</button>}
                  </>}
                  <button type="button" className="t-xs w7 row g4" style={{ color: 'var(--ink)' }} onClick={() => setTrashOpen(true)}><Icon name="trash" size={14} />{t('files.trash')}</button>
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
            <p className="label">{t('files.files')} · {shown.length}{searchingAll ? ` · ${t('files.everywhere')}` : ''}</p>
            <span className="row g12 wrap">
              <UploadStatus up={dropUp} />
              {isAdmin && !path && tops.includes('') && <ShareSwitch on={share.isShared('')} label={t('fa.root')} onToggle={() => toggle('')} />}
            </span>
          </div>
          {copies.length > 0 && (
            <div className="fnote" role="status">
              <span className="t-sm row g8"><Icon name="copy" size={16} />{t('files.dups', { n: String(copies.length) })}</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => actions.setPicked(new Set(copies))}>{t('files.dupsPick')}</button>
            </div>
          )}
          {(page.length > 0 || actions.picked.size > 0) && <SelectionBar actions={actions} pageIds={page.map((f) => f.id)} folders={moveTargets} admin={isAdmin} />}
          {index.loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skel" style={{ height: 230 }} />)}</div>
          ) : shown.length === 0 ? (
            <div className="empty"><Icon name="folder" size={32} /><p className="t-mute">{needle ? t('files.noMatch') : t('assets.empty')}</p></div>
          ) : view === 'grid' && !searchingAll ? (
            <FileGrid files={page} thumbs={thumbs} onOpen={open} pin={pin} menu={menu} sel={sel} />
          ) : (
            <FileList files={page} onOpen={open} onDownload={(f) => download(brandId, f.id)} pin={pin} menu={menu} sel={sel} onFolder={searchingAll ? goFolder : undefined} />
          )}
          {shown.length > limit && (
            <button className="btn btn-secondary self-start" onClick={() => setLimit((l) => l + PAGE)}>
              {t('files.showMore', { n: Math.min(PAGE, shown.length - limit) })}
            </button>
          )}
        </div>
        </>}
      </div>
      {preview && <Preview brandId={brandId} file={preview} onClose={() => setPreview(null)} />}
      <FileDialogs actions={actions} />
      {hideAsk && (
        <ConfirmDialog title={t('fa.hideAll')} confirmLabel={t('fa.hideAll')} onCancel={closeHide}
          onConfirm={() => { setHideAsk(false); share.hideAll().catch(() => setShareError(true)); }}>{t('fa.hideAllConfirm')}</ConfirmDialog>
      )}
    </section>
  );
}
