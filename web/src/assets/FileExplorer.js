import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { normalizeSearch } from '../lib/text';
import { Icon } from '../components/Icon';
import { download, previewKind } from './fileApi';
import { kindOf } from './fileKinds';
import { FileGrid, FileList, FolderGrid } from './FileViews';
import { Preview } from './Preview';
import { useThumbs } from './useThumbs';
const UPLOADS = 'Uploads';
const PAGE = 48;
const parentOf = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
export function FileExplorer({ brandId, brandName }) {
    const { t } = useI18n();
    const [path, setPath] = useState('');
    const [files, setFiles] = useState([]);
    const [q, setQ] = useState('');
    const [filter, setFilter] = useState('all');
    const [view, setView] = useState('grid');
    const [limit, setLimit] = useState(PAGE);
    const [preview, setPreview] = useState(null);
    const index = useBrandDoc(brandId, 'context/fileIndex');
    const folders = index.data?.folders ?? [];
    useEffect(() => { setPath(''); }, [brandId]);
    useEffect(() => { setLimit(PAGE); setQ(''); }, [brandId, path]);
    useEffect(() => {
        const qy = query(collection(db, 'brands', brandId, 'assets'), where('folder', '==', path));
        return onSnapshot(qy, (s) => setFiles(s.docs.filter((d) => d.get('status') !== 'uploading')
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => a.title.localeCompare(b.title))), () => setFiles([]));
    }, [brandId, path]);
    const subfolders = useMemo(() => {
        const list = folders.filter((f) => f.path && parentOf(f.path) === path).map((f) => ({ ...f, highlight: false }));
        if (!path)
            list.unshift({ path: UPLOADS, files: 0, bytes: 0, highlight: true });
        return list;
    }, [folders, path]);
    const needle = normalizeSearch(q);
    const shown = files.filter((f) => (filter === 'all' || kindOf(f) === filter) && (!needle || normalizeSearch(f.title).includes(needle)));
    const page = shown.slice(0, limit);
    const thumbs = useThumbs(brandId, view === 'grid' ? page.filter((f) => kindOf(f) === 'image' && previewKind(f.contentType)).map((f) => f.id) : []);
    const open = (f) => (previewKind(f.contentType) ? setPreview(f) : download(brandId, f.id));
    const crumbs = path ? path.split('/') : [];
    return (_jsxs("section", { className: "card", style: { padding: 0, overflow: 'hidden' }, "aria-labelledby": "files-crumbs", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-4 border-b px-4 py-4 sm:px-6", style: { borderColor: 'var(--line)' }, children: [_jsxs("nav", { className: "crumbs grow", "aria-label": "Breadcrumb", id: "files-crumbs", children: [_jsx("a", { href: "#", onClick: (e) => { e.preventDefault(); setPath(''); }, className: crumbs.length ? '' : 'cur', children: brandName }), crumbs.map((c, i) => (_jsxs(Fragment, { children: [_jsx(Icon, { name: "chevronRight", size: 14 }), i === crumbs.length - 1 ? _jsx("span", { className: "cur", children: c })
                                        : _jsx("a", { href: "#", onClick: (e) => { e.preventDefault(); setPath(crumbs.slice(0, i + 1).join('/')); }, children: c })] }, i)))] }), _jsxs("div", { className: "search w-full sm:w-[260px]", children: [_jsx(Icon, { name: "search" }), _jsx("input", { className: "input", value: q, onChange: (e) => setQ(e.target.value), "aria-label": t('files.search'), placeholder: t('files.searchIn', { name: crumbs[crumbs.length - 1] ?? brandName }) })] }), _jsx("div", { className: "seg overflow-x-auto", role: "group", "aria-label": t('files.filter'), children: ['all', 'image', 'video', 'pdf', 'design'].map((k) => (_jsx("button", { className: filter === k ? 'is-on' : '', "aria-pressed": filter === k, onClick: () => setFilter(k), children: t(`files.kind.${k}`) }, k))) }), _jsxs("div", { className: "seg", role: "group", "aria-label": t('files.view'), children: [_jsx("button", { className: view === 'grid' ? 'is-on' : '', "aria-pressed": view === 'grid', "aria-label": t('files.grid'), onClick: () => setView('grid'), children: _jsx(Icon, { name: "grid" }) }), _jsx("button", { className: view === 'list' ? 'is-on' : '', "aria-pressed": view === 'list', "aria-label": t('files.listView'), onClick: () => setView('list'), children: _jsx(Icon, { name: "list" }) })] })] }), _jsxs("div", { className: "col g24 p-4 sm:p-6", children: [subfolders.length > 0 && !needle && (_jsxs("div", { className: "col g12", children: [_jsxs("p", { className: "label", children: [t('files.folders'), " \u00B7 ", subfolders.length] }), _jsx(FolderGrid, { folders: subfolders, onOpen: setPath })] })), _jsxs("div", { className: "col g12", children: [_jsxs("p", { className: "label", children: [t('files.files'), " \u00B7 ", shown.length] }), index.loading ? (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [0, 1, 2, 3].map((i) => _jsx("div", { className: "skel", style: { height: 230 } }, i)) })) : shown.length === 0 ? (_jsxs("div", { className: "empty", children: [_jsx(Icon, { name: "folder", size: 32 }), _jsx("p", { className: "t-mute", children: needle ? t('files.noMatch') : t('assets.empty') })] })) : view === 'grid' ? (_jsx(FileGrid, { files: page, thumbs: thumbs, onOpen: open })) : (_jsx(FileList, { files: page, onOpen: open, onDownload: (f) => download(brandId, f.id) })), shown.length > limit && (_jsx("button", { className: "btn btn-secondary self-start", onClick: () => setLimit((l) => l + PAGE), children: t('files.showMore', { n: Math.min(PAGE, shown.length - limit) }) }))] })] }), preview && _jsx(Preview, { brandId: brandId, file: preview, onClose: () => setPreview(null) })] }));
}
