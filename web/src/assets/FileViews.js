import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { formatBytes } from './fileApi';
import { extLabel, kindOf, thumbClass } from './fileKinds';
const date = (ms, lang = 'en') => ms ? new Date(ms).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
export function FileGrid({ files, thumbs, onOpen }) {
    const { lang } = useI18n();
    return (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: files.map((f) => {
            const kind = kindOf(f);
            const thumb = thumbs[f.id];
            return (_jsxs("button", { type: "button", className: "tile text-left", style: { cursor: 'pointer', padding: 0 }, onClick: () => onOpen(f), children: [_jsxs("div", { className: `thumb ${thumb ? '' : thumbClass[kind]}`, style: { height: 180, overflow: 'hidden', width: '100%' }, children: [thumb ? (_jsx("img", { className: "cover h-full w-full object-cover", src: thumb, alt: "", loading: "lazy" })) : (_jsx(Icon, { name: kind === 'video' ? 'external' : kind === 'image' ? 'grid' : 'file', size: 40, className: "ico" })), _jsx("span", { className: "chip chip-plain c-type badge", style: { background: '#fff', zIndex: 1 }, children: extLabel(f) })] }), _jsxs("div", { className: "tile-meta w-full", children: [_jsx("span", { className: "tile-name", children: f.title }), _jsxs("span", { className: "t-sm t-mute", children: [formatBytes(f.size), f.mtimeMs ? ` · ${date(f.mtimeMs, lang)}` : ''] })] })] }, f.id));
        }) }));
}
export function FileList({ files, onOpen, onDownload }) {
    const { t, lang } = useI18n();
    return (_jsxs("div", { className: "list overflow-x-auto", children: [_jsxs("div", { className: "lrow head label min-w-[640px]", children: [_jsx("span", { children: t('files.name') }), _jsx("span", { children: t('files.type') }), _jsx("span", { children: t('files.size') }), _jsx("span", { children: t('files.modified') }), _jsx("span", {})] }), files.map((f) => (_jsxs("div", { className: "lrow min-w-[640px]", children: [_jsx("button", { type: "button", onClick: () => onOpen(f), className: "truncate text-left w7", style: { background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)' }, children: f.title }), _jsx("span", { children: _jsx("span", { className: "chip chip-plain c-type", children: extLabel(f) }) }), _jsx("span", { className: "t-sm t-mute", children: formatBytes(f.size) }), _jsx("span", { className: "t-sm t-mute", children: date(f.mtimeMs, lang) }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => onDownload(f), "aria-label": `${t('common.download')} ${f.title}`, children: _jsx(Icon, { name: "download", size: 16 }) })] }, f.id)))] }));
}
export function FolderGrid({ folders, onOpen }) {
    const { t } = useI18n();
    return (_jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4", children: folders.map((f) => (_jsxs("button", { type: "button", className: "folder text-left", onClick: () => onOpen(f.path), style: { cursor: 'pointer', ...(f.highlight ? { borderColor: 'var(--azul)', background: '#F7F9FF' } : {}) }, children: [_jsx("span", { className: "fi", style: f.highlight ? { background: 'var(--azul)', color: '#fff' } : undefined, children: _jsx(Icon, { name: f.highlight ? 'upload' : 'folder', size: 22 }) }), _jsxs("span", { className: "col grow", style: { minWidth: 0 }, children: [_jsx("span", { className: "w7 truncate", children: f.path.slice(f.path.lastIndexOf('/') + 1) }), _jsx("span", { className: "t-sm t-mute", children: f.highlight ? t('files.uploadsHint') : `${formatBytes(f.bytes)}` })] })] }, f.path))) }));
}
