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
import { APPROVED, folderVisible, UPLOADS } from './folderRules';

import { useFolderShare } from './useFolderShare';
import { pinBrandFile, unpinBrandFile, type BrandFile } from '../brands/identity/BrandFiles';
import { ExplorerToolbar, SORTS, type Filter, type Sort } from './ExplorerToolbar';
import { useFileActions } from './useFileActions';
import { useBrandVersions, versionAt } from '../brands/versions/useBrandVersions';
import { useVersionView } from '../brands/versions/versionView';
import { FileMenu, FolderMenu } from './FileMenu';
import { SelectionBar } from './SelectionBar';
import { FileDialogs } from './FileDialogs';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { TrashView } from './TrashView';
import { UploadButton, UploadStatus } from './UploadButton';
import { useUploader } from './useUploader';
import { useSearchAll } from './useSearchAll';
import './files.css';

/** Top folders every brand version shares (server/src/brandVersions.ts SHARED). */
const SHARED_TOPS = new Set([APPROVED, 'Interno Braindy']);

type Folder = { path: string; files: number; bytes: number };
const SORT_KEY = 'braindy.files.sort';
const savedSort = (): Sort => { try { const s = localStorage.getItem(SORT_KEY) as Sort; return SORTS.includes(s) ? s : 'name'; } catch { return 'name'; } };
// Drive files keep their own date; files uploaded in Braindy use the upload (or import) time.
const ms = (v: unknown) => (v && typeof (v as { toMillis?: () => number }).toMillis === 'function' ? (v as { toMillis: () => number }).toMillis() : undefined);
const PAGE = 48;
// Off since brand documents left My brand (2026-11-02); set true to bring the pin buttons back.
const PIN_TO_BRAND = false as boolean;
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
/** hideApproved: Library leaves out the approved-deliveries folder at the root (it has its own tab, Deliveries). */
export function FileExplorer({ brandId, brandName, startPath = '', openId, hideApproved = false }: { brandId: string; brandName: string; startPath?: string; openId?: string; hideApproved?: boolean }) {
  const { t } = useI18n();
  const [path, setPath] = useState(startPath);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [q, setQ] = useState('');
  const [everywhere, setEverywhere] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  // Rebranded brands: files by the version they belong to, by when they entered Braindy ('current' = after the last rebrand).
  const versions = useBrandVersions(brandId).list;
  const [era] = useVersionView(brandId, versions.map((v) => v.id));
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
  const realAdmin = useAuth().profile?.role === 'admin';
  // "View as client": NickMark sees exactly the client's page, without his controls.
  const [asClient, setAsClient] = useState(false);
  const isAdmin = realAdmin && !asClient;
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
  const pin = PIN_TO_BRAND && isAdmin ? {
    on: (id: string) => pinned.some((d) => d.id === id),
    toggle: (f: FileItem) => { const old = pinned.find((d) => d.id === f.id); (old ? unpinBrandFile(brandId, old) : pinBrandFile(brandId, f)).catch(() => setShareError(true)); },
  } : undefined;
  const actions = useFileActions(brandId, brandName);
  const menu = (f: FileItem, style?: CSSProperties) => <FileMenu f={f} actions={actions} style={style} admin={isAdmin} />;
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
        .map((d) => ({ id: d.id, ...(d.data() as Omit<FileItem, 'id'>), mtimeMs: (d.get('mtimeMs') as number | undefined) ?? ms(d.get('uploadedAt')) ?? ms(d.get('importedAt')),
          addedMs: ms(d.get('uploadedAt')) ?? ms(d.get('importedAt')) ?? ms(d.get('migratedAt')) })),
    ), () => setFiles([]));
  }, [brandId, path, pathShared]);

  const subfolders = useMemo(() => {
    // Rebranded brands: at the root, each version shows its own folders (the current one, those of no earlier version).
    const old = versions.find((v) => v.id === era);
    const ofEra = (p: string) => path || !versions.length || (old ? old.folders.includes(p) : !versions.some((v) => v.folders.includes(p)));
    const list = folders.filter((f) => f.path && parentOf(f.path) === path && visible(f.path) && ofEra(f.path) && !(hideApproved && f.path === APPROVED))
      .map((f) => ({ ...f, highlight: false, hidden: isAdmin && !forClient(f.path), toggle: isAdmin && !path ? () => toggle(f.path) : undefined }));
    if (!path) list.unshift({ path: UPLOADS, files: 0, bytes: 0, highlight: true, hidden: false, toggle: undefined });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folders, path, isAdmin, brand?.fileAccess, tops, versions, era, hideApproved]);
  const moveTargets = useMemo(() => ['', UPLOADS, ...folders.map((f) => f.path).filter((p) => p && p !== path)].filter((p, i, a) => a.indexOf(p) === i), [folders, path]);

  const needle = normalizeSearch(q);
  const hits = useSearchAll(brandId, q.trim(), everywhere || !path, Number(actions.busy));
  const searchingAll = hits !== null;
  const source = searchingAll ? hits : files;
  // In a folder the name is matched here, and what the AI saw in the file too (the server does both across folders).
  const seen = (f: FileItem) => normalizeSearch([f.ai?.summary, ...(f.ai?.tags ?? []), f.ai?.text].filter(Boolean).join(' '));
  const local = (f: FileItem): FileItem | null => (!needle || normalizeSearch(f.title).includes(needle) ? f : needle.split(/s+/).every((w) => seen(f).includes(w)) ? { ...f, why: 'ai' } : null);
  // A file belongs to the version of its top folder; in shared ones (Uploads, approved, internal) to when it came in.
  const eraOf = (f: FileItem) => { const top = (f.folder ?? '').split('/')[0]!; return !top || top === UPLOADS || SHARED_TOPS.has(top) ? versionAt(versions, f.addedMs ?? f.mtimeMs)?.id ?? null : versions.find((v) => v.folders.includes(top))?.id ?? null; };
  const shown = (searchingAll ? source : source.map(local).filter((f): f is FileItem => !!f)).filter((f) => filter === 'all' || kindOf(f) === filter)
    .filter((f) => !versions.length || eraOf(f) === era)
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
      <ExplorerToolbar path={path} setPath={goFolder} q={q} setQ={setQ} everywhere={everywhere} setEverywhere={setEverywhere}
        filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} view={view} setView={setView}
        actions={canDrop ? <UploadButton brandId={brandId} folder={path} label={t('files.uploadHere')} secondary /> : undefined} />
      {dragging && <div className="fdrop" aria-hidden="true"><Icon name="upload" size={28} />{t('files.dropHere', { name: path.split('/').pop() ?? '' })}</div>}
      <div className="col g24 p-4 sm:p-6">
        {asClient && (
          <div className="fnote" role="status">
            <span className="t-sm">{t('fa.asClientOn')}</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAsClient(false)}>{t('fa.exitClient')}</button>
          </div>
        )}
        {trashOpen ? <TrashView brandId={brandId} onBack={() => setTrashOpen(false)} /> : <>
        {subfolders.length > 0 && !needle && (
          <div className="col g12">
            <p className="label">{t('files.folders')} · {subfolders.length}</p>
            {isAdmin && !path && (
              <div className="fbar">
                {tops.length > 0 && (
                  <span className="fbar-stat t-sm" role="status">
                    <Icon name="eye" size={16} />
                    {shareError ? <span style={{ color: 'var(--danger)' }}>{t('fa.error')}</span> : t('fa.clientSees', { n: String(share.count), m: String(tops.length) })}
                  </span>
                )}
                <div className="fbar-actions">
                  {tops.length > 0 && share.count < tops.length && <button type="button" className="btn btn-secondary btn-sm" onClick={() => share.showAll().catch(() => setShareError(true))}>{t('fa.showAll')}</button>}
                  {tops.length > 0 && share.count > 0 && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setHideAsk(true)}>{t('fa.hideAll')}</button>}
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAsClient(true)}><Icon name="eye" size={16} />{t('fa.asClient')}</button>
                  <button type="button" className="btn btn-secondary btn-sm btn-icon fbar-trash" aria-label={t('files.trash')} title={t('files.trash')} onClick={() => setTrashOpen(true)}><Icon name="trash" size={16} /></button>
                </div>
              </div>
            )}
            {isAdmin && !path && tops.length > 0 && share.count === 0 && (
              <div className="fnote" role="status">
                <span className="t-sm">{t('fa.none')}</span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => share.showAll().catch(() => setShareError(true))}>{t('fa.showAll')}</button>
              </div>
            )}
            <FolderGrid folders={allFolders ? subfolders : subfolders.slice(0, FOLDERS_FIRST)} onOpen={setPath}
              menu={isAdmin ? (p) => <FolderMenu path={p} actions={actions} canRename={p !== APPROVED} /> : undefined} />
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skel" style={{ height: '14.375rem' }} />)}</div>
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
