import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { normalizeSearch } from '../lib/text';
import { Icon } from '../components/Icon';
import { download, previewKind } from './fileApi';
import { kindOf } from './fileKinds';
import { FileGrid, FileList, FolderGrid, ShareSwitch } from './FileViews';
import { Preview } from './Preview';
import { useThumbs } from './useThumbs';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { APPROVED, folderVisible, UPLOADS } from './folderRules';
import { useFolderShare } from './useFolderShare';
import { pinBrandFile, unpinBrandFile } from '../brands/identity/BrandFiles';
import { ExplorerToolbar, SORTS } from './ExplorerToolbar';
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
const SORT_KEY = 'braindy.files.sort';
const savedSort = () => { try {
    const s = localStorage.getItem(SORT_KEY);
    return SORTS.includes(s) ? s : 'name';
}
catch {
    return 'name';
} };
// Drive files keep their own date; files uploaded in Braindy use the upload (or import) time.
const ms = (v) => (v && typeof v.toMillis === 'function' ? v.toMillis() : undefined);
const PAGE = 48;
// Off since brand documents left My brand (2026-11-02); set true to bring the pin buttons back.
const PIN_TO_BRAND = false;
// Many folders (Quimiolab has 39) start as three rows; the rest opens on request.
const FOLDERS_FIRST = 12;
const parentOf = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
/** Copies after the first (oldest) of each name + size pair: what "Select the copies" ticks. */
function repeatedCopies(files) {
    const groups = new Map();
    for (const f of files) {
        const k = `${f.title}|${f.size}`;
        groups.set(k, [...(groups.get(k) ?? []), f]);
    }
    return [...groups.values()].filter((g) => g.length > 1)
        .flatMap((g) => g.sort((a, b) => (a.mtimeMs ?? Infinity) - (b.mtimeMs ?? Infinity)).slice(1).map((f) => f.id));
}
/** startPath/openId come from a search result: open that folder and show that file. */
export function FileExplorer({ brandId, brandName, startPath = '', openId }) {
    const { t } = useI18n();
    const [path, setPath] = useState(startPath);
    const [files, setFiles] = useState([]);
    const [q, setQ] = useState('');
    const [everywhere, setEverywhere] = useState(false);
    const [filter, setFilter] = useState('all');
    // Rebranded brands: files by the version they belong to, by when they entered Braindy ('current' = after the last rebrand).
    const versions = useBrandVersions(brandId).list;
    const [era] = useVersionView(brandId, versions.map((v) => v.id));
    const [view, setView] = useState('grid');
    const [sort, setSortState] = useState(savedSort);
    const setSort = (s) => { setSortState(s); try {
        localStorage.setItem(SORT_KEY, s);
    }
    catch { /* private mode */ } };
    const [limit, setLimit] = useState(PAGE);
    const [preview, setPreview] = useState(null);
    const [allFolders, setAllFolders] = useState(false);
    const [trashOpen, setTrashOpen] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [hideAsk, setHideAsk] = useState(false);
    const index = useBrandDoc(brandId, 'context/fileIndex');
    const folders = index.data?.folders ?? [];
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
    const pinned = (identity.data?.documents ?? []);
    const pin = PIN_TO_BRAND && isAdmin ? {
        on: (id) => pinned.some((d) => d.id === id),
        toggle: (f) => { const old = pinned.find((d) => d.id === f.id); (old ? unpinBrandFile(brandId, old) : pinBrandFile(brandId, f)).catch(() => setShareError(true)); },
    } : undefined;
    const actions = useFileActions(brandId, brandName);
    const menu = (f, style) => _jsx(FileMenu, { f: f, actions: actions, style: style, admin: isAdmin });
    const dropUp = useUploader(brandId);
    const closeHide = useCallback(() => setHideAsk(false), []);
    const toggle = (top) => { setShareError(false); share.toggle(top).catch(() => setShareError(true)); };
    useEffect(() => { setPath(startPath); }, [brandId, startPath]);
    useEffect(() => { setLimit(PAGE); setAllFolders(false); actions.clear(); setTrashOpen(false); if (!everywhere)
        setQ(''); }, [brandId, path]); // eslint-disable-line react-hooks/exhaustive-deps
    const pathShared = visible(path);
    useEffect(() => {
        if (!pathShared) {
            setFiles([]);
            return;
        }
        const qy = query(collection(db, 'brands', brandId, 'assets'), where('folder', '==', path));
        return onSnapshot(qy, (s) => setFiles(s.docs.filter((d) => d.get('status') !== 'uploading')
            .map((d) => ({ id: d.id, ...d.data(), mtimeMs: d.get('mtimeMs') ?? ms(d.get('uploadedAt')) ?? ms(d.get('importedAt')),
            addedMs: ms(d.get('uploadedAt')) ?? ms(d.get('importedAt')) ?? ms(d.get('migratedAt')) }))), () => setFiles([]));
    }, [brandId, path, pathShared]);
    const subfolders = useMemo(() => {
        const list = folders.filter((f) => f.path && parentOf(f.path) === path && visible(f.path))
            .map((f) => ({ ...f, highlight: false, hidden: isAdmin && !forClient(f.path), toggle: isAdmin && !path ? () => toggle(f.path) : undefined }));
        if (!path)
            list.unshift({ path: UPLOADS, files: 0, bytes: 0, highlight: true, hidden: false, toggle: undefined });
        return list;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [folders, path, isAdmin, brand?.fileAccess, tops]);
    const moveTargets = useMemo(() => ['', UPLOADS, ...folders.map((f) => f.path).filter((p) => p && p !== path)].filter((p, i, a) => a.indexOf(p) === i), [folders, path]);
    const needle = normalizeSearch(q);
    const hits = useSearchAll(brandId, q.trim(), everywhere || !path, Number(actions.busy));
    const searchingAll = hits !== null;
    const source = searchingAll ? hits : files;
    // In a folder the name is matched here, and what the AI saw in the file too (the server does both across folders).
    const seen = (f) => normalizeSearch([f.ai?.summary, ...(f.ai?.tags ?? []), f.ai?.text].filter(Boolean).join(' '));
    const local = (f) => (!needle || normalizeSearch(f.title).includes(needle) ? f : needle.split(/s+/).every((w) => seen(f).includes(w)) ? { ...f, why: 'ai' } : null);
    const shown = (searchingAll ? source : source.map(local).filter((f) => !!f)).filter((f) => filter === 'all' || kindOf(f) === filter)
        .filter((f) => !versions.length || (versionAt(versions, f.addedMs ?? f.mtimeMs)?.id ?? null) === era)
        .sort(sort === 'name' ? (a, b) => a.title.localeCompare(b.title)
        : sort === 'big' ? (a, b) => b.size - a.size
            : (a, b) => ((a.mtimeMs ?? 0) - (b.mtimeMs ?? 0)) * (sort === 'new' ? -1 : 1));
    const page = shown.slice(0, limit);
    const sel = actions.selIn(page.map((f) => f.id));
    const copies = isAdmin && !searchingAll ? repeatedCopies(files) : [];
    const thumbs = useThumbs(brandId, view === 'grid' ? page.filter((f) => kindOf(f) === 'image' && previewKind(f.contentType)).map((f) => f.id) : []);
    useEffect(() => {
        const f = openId ? files.find((x) => x.id === openId) : undefined;
        if (f && previewKind(f.contentType))
            setPreview(f);
    }, [openId, files]);
    const open = (f) => (previewKind(f.contentType) ? setPreview(f) : download(brandId, f.id));
    const goFolder = (p) => { setEverywhere(false); setQ(''); setPath(p); };
    // NickMark drops files from the desktop straight into the open folder.
    const canDrop = isAdmin && !!path && path !== UPLOADS && !trashOpen;
    const dragProps = canDrop ? {
        onDragOver: (e) => { if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            setDragging(true);
        } },
        onDragLeave: (e) => { if (e.currentTarget === e.target)
            setDragging(false); },
        onDrop: (e) => { e.preventDefault(); setDragging(false); void dropUp.run(e.dataTransfer.files, path); },
    } : {};
    return (_jsxs("section", { className: `card fx${dragging ? ' is-drop' : ''}`, style: { padding: 0, overflow: 'clip', position: 'relative' }, "aria-labelledby": "files-crumbs", ...dragProps, children: [_jsx(ExplorerToolbar, { path: path, setPath: goFolder, q: q, setQ: setQ, everywhere: everywhere, setEverywhere: setEverywhere, filter: filter, setFilter: setFilter, sort: sort, setSort: setSort, view: view, setView: setView, actions: canDrop ? _jsx(UploadButton, { brandId: brandId, folder: path, label: t('files.uploadHere'), secondary: true }) : undefined }), dragging && _jsxs("div", { className: "fdrop", "aria-hidden": "true", children: [_jsx(Icon, { name: "upload", size: 28 }), t('files.dropHere', { name: path.split('/').pop() ?? '' })] }), _jsxs("div", { className: "col g24 p-4 sm:p-6", children: [asClient && (_jsxs("div", { className: "fnote", role: "status", children: [_jsx("span", { className: "t-sm", children: t('fa.asClientOn') }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => setAsClient(false), children: t('fa.exitClient') })] })), trashOpen ? _jsx(TrashView, { brandId: brandId, onBack: () => setTrashOpen(false) }) : _jsxs(_Fragment, { children: [subfolders.length > 0 && !needle && (_jsxs("div", { className: "col g12", children: [_jsxs("div", { className: "row between g8 wrap", children: [_jsxs("p", { className: "label", children: [t('files.folders'), " \u00B7 ", subfolders.length] }), isAdmin && !path && (_jsxs("span", { className: "t-xs t-mute row g8", role: "status", children: [tops.length > 0 && _jsxs(_Fragment, { children: [shareError ? _jsx("span", { style: { color: 'var(--danger)' }, children: t('fa.error') }) : t('fa.clientSees', { n: String(share.count), m: String(tops.length) }), share.count < tops.length && _jsx("button", { type: "button", className: "t-xs w7", style: { color: 'var(--azul)' }, onClick: () => share.showAll().catch(() => setShareError(true)), children: t('fa.showAll') }), share.count > 0 && _jsx("button", { type: "button", className: "t-xs w7", style: { color: 'var(--azul)' }, onClick: () => setHideAsk(true), children: t('fa.hideAll') })] }), _jsxs("button", { type: "button", className: "t-xs w7 row g4", style: { color: 'var(--ink)' }, onClick: () => setTrashOpen(true), children: [_jsx(Icon, { name: "trash", size: 14 }), t('files.trash')] }), _jsx("button", { type: "button", className: "t-xs w7", style: { color: 'var(--azul)' }, onClick: () => setAsClient(true), children: t('fa.asClient') })] }))] }), isAdmin && !path && tops.length > 0 && share.count === 0 && (_jsxs("div", { className: "fnote", role: "status", children: [_jsx("span", { className: "t-sm", children: t('fa.none') }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => share.showAll().catch(() => setShareError(true)), children: t('fa.showAll') })] })), _jsx(FolderGrid, { folders: allFolders ? subfolders : subfolders.slice(0, FOLDERS_FIRST), onOpen: setPath, menu: isAdmin ? (p) => _jsx(FolderMenu, { path: p, actions: actions, canRename: p !== APPROVED }) : undefined }), subfolders.length > FOLDERS_FIRST && (_jsx("button", { type: "button", className: "btn btn-secondary btn-sm self-start", onClick: () => setAllFolders((a) => !a), children: allFolders ? t('common.showLess') : t('common.showAll', { n: String(subfolders.length) }) }))] })), _jsxs("div", { className: "col g12", children: [_jsxs("div", { className: "row between g8 wrap", children: [_jsxs("p", { className: "label", children: [t('files.files'), " \u00B7 ", shown.length, searchingAll ? ` · ${t('files.everywhere')}` : ''] }), _jsxs("span", { className: "row g12 wrap", children: [_jsx(UploadStatus, { up: dropUp }), isAdmin && !path && tops.includes('') && _jsx(ShareSwitch, { on: share.isShared(''), label: t('fa.root'), onToggle: () => toggle('') })] })] }), copies.length > 0 && (_jsxs("div", { className: "fnote", role: "status", children: [_jsxs("span", { className: "t-sm row g8", children: [_jsx(Icon, { name: "copy", size: 16 }), t('files.dups', { n: String(copies.length) })] }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => actions.setPicked(new Set(copies)), children: t('files.dupsPick') })] })), (page.length > 0 || actions.picked.size > 0) && _jsx(SelectionBar, { actions: actions, pageIds: page.map((f) => f.id), folders: moveTargets, admin: isAdmin }), index.loading ? (_jsx("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [0, 1, 2, 3].map((i) => _jsx("div", { className: "skel", style: { height: 230 } }, i)) })) : shown.length === 0 ? (_jsxs("div", { className: "empty", children: [_jsx(Icon, { name: "folder", size: 32 }), _jsx("p", { className: "t-mute", children: needle ? t('files.noMatch') : t('assets.empty') })] })) : view === 'grid' && !searchingAll ? (_jsx(FileGrid, { files: page, thumbs: thumbs, onOpen: open, pin: pin, menu: menu, sel: sel })) : (_jsx(FileList, { files: page, onOpen: open, onDownload: (f) => download(brandId, f.id), pin: pin, menu: menu, sel: sel, onFolder: searchingAll ? goFolder : undefined })), shown.length > limit && (_jsx("button", { className: "btn btn-secondary self-start", onClick: () => setLimit((l) => l + PAGE), children: t('files.showMore', { n: Math.min(PAGE, shown.length - limit) }) }))] })] })] }), preview && _jsx(Preview, { brandId: brandId, file: preview, onClose: () => setPreview(null) }), _jsx(FileDialogs, { actions: actions }), hideAsk && (_jsx(ConfirmDialog, { title: t('fa.hideAll'), confirmLabel: t('fa.hideAll'), onCancel: closeHide, onConfirm: () => { setHideAsk(false); share.hideAll().catch(() => setShareError(true)); }, children: t('fa.hideAllConfirm') }))] }));
}
