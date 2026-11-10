import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { formatBytes } from './fileApi';
import { APPROVED } from './folderRules';
import { extLabel, kindOf, thumbClass } from './fileKinds';
const date = (ms, lang = 'en') => ms ? new Date(ms).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
function Check({ sel, f, style }) {
    const { t } = useI18n();
    return (_jsx("label", { className: "fx-check", style: style, onClick: (e) => e.stopPropagation(), children: _jsx("input", { type: "checkbox", checked: sel.on(f.id), onChange: (e) => sel.toggle(f.id, e.nativeEvent.shiftKey), "aria-label": `${t('files.select')} ${f.title}` }) }));
}
function PinButton({ pin, f, style }) {
    const { t } = useI18n();
    const on = pin.on(f.id);
    return (_jsx("button", { type: "button", "aria-pressed": on, title: t(on ? 'bf.unpin' : 'bf.pin'), onClick: (e) => { e.stopPropagation(); pin.toggle(f); }, className: `fx-pin${on ? ' is-on' : ''}`, style: style, children: on ? `✓ ${t('bf.pinned')}` : `+ ${t('bf.pin')}` }));
}
export function FileGrid({ files, thumbs, onOpen, pin, menu, sel }) {
    const { t, lang } = useI18n();
    return (_jsx("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", children: files.map((f) => {
            const kind = kindOf(f);
            const thumb = thumbs[f.id];
            return (_jsxs("div", { className: `tile${sel?.on(f.id) ? ' is-picked' : ''}`, style: { padding: 0, position: 'relative' }, children: [_jsxs("button", { type: "button", className: "text-left", style: { cursor: 'pointer', padding: 0, border: 0, background: 'none', width: '100%' }, onClick: () => onOpen(f), children: [_jsxs("div", { className: `thumb ${thumb ? '' : thumbClass[kind]}`, style: { height: 180, overflow: 'hidden', width: '100%' }, children: [thumb ? (_jsx("img", { className: "cover h-full w-full object-cover", src: thumb, alt: "", loading: "lazy" })) : (_jsx(Icon, { name: kind === 'video' ? 'external' : kind === 'image' ? 'grid' : 'file', size: 40, className: "ico" })), _jsx("span", { className: "chip chip-plain c-type badge", style: { background: '#fff', zIndex: 1 }, children: extLabel(f) })] }), _jsxs("div", { className: "tile-meta w-full", children: [_jsx("span", { className: "tile-name", children: f.title }), f.why === 'ai' && _jsxs("span", { className: "t-xs fx-why", title: f.ai?.summary, children: [_jsx(Icon, { name: "spark", size: 12 }), t('ss.why')] }), _jsxs("span", { className: "t-sm t-mute", children: [formatBytes(f.size), f.mtimeMs ? ` · ${date(f.mtimeMs, lang)}` : ''] })] })] }), pin && _jsx(PinButton, { pin: pin, f: f, style: { position: 'absolute', top: 12, right: 12, zIndex: 2 } }), menu?.(f, { position: 'absolute', top: 136, right: 12, zIndex: 3 }), sel && _jsx(Check, { sel: sel, f: f, style: { position: 'absolute', top: 136, left: 12, zIndex: 2 } })] }, f.id));
        }) }));
}
/** `onFolder` (search across all folders) shows each file's folder under its name, as a link to open it. */
export function FileList({ files, onOpen, onDownload, pin, menu, sel, onFolder }) {
    const { t, lang } = useI18n();
    return (_jsxs("div", { className: "list overflow-x-auto", children: [_jsxs("div", { className: `lrow head label min-w-[640px]${pin ? ' has-pin' : ''}`, children: [_jsx("span", { children: t('files.name') }), _jsx("span", { children: t('files.type') }), _jsx("span", { children: t('files.size') }), _jsx("span", { children: t('files.modified') }), _jsx("span", {})] }), files.map((f) => (_jsxs("div", { className: `lrow min-w-[640px]${pin ? ' has-pin' : ''}${sel?.on(f.id) ? ' is-picked' : ''}`, children: [_jsxs("span", { className: "row g10", style: { minWidth: 0 }, children: [sel && _jsx(Check, { sel: sel, f: f }), _jsxs("span", { className: "col", style: { minWidth: 0 }, children: [_jsx("button", { type: "button", onClick: () => onOpen(f), className: "truncate text-left w7", style: { background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)' }, children: f.title }), f.why === 'ai' && _jsxs("span", { className: "t-xs fx-why", title: f.ai?.summary, children: [_jsx(Icon, { name: "spark", size: 12 }), t('ss.why')] }), onFolder && _jsxs("button", { type: "button", className: "t-xs t-mute truncate text-left", style: { background: 'none', border: 0, cursor: 'pointer', padding: 0 }, onClick: () => onFolder(f.folder ?? ''), children: [_jsx(Icon, { name: "folder", size: 12 }), " ", f.folder || t('files.rootFolder')] })] })] }), _jsx("span", { children: _jsx("span", { className: "chip chip-plain c-type", children: extLabel(f) }) }), _jsx("span", { className: "t-sm t-mute", children: formatBytes(f.size) }), _jsx("span", { className: "t-sm t-mute", children: date(f.mtimeMs, lang) }), _jsxs("span", { className: "row g4", style: { justifyContent: 'flex-end' }, children: [pin && _jsx(PinButton, { pin: pin, f: f }), _jsx("button", { type: "button", className: "fx-ibtn", onClick: () => onDownload(f), "aria-label": `${t('common.download')} ${f.title}`, children: _jsx(Icon, { name: "download", size: 16 }) }), menu?.(f)] })] }, f.id)))] }));
}
/** NickMark only: whether the client sees a folder. A small labelled switch, keyboard and screen-reader friendly. */
export function ShareSwitch({ on, label, onToggle }) {
    const { t } = useI18n();
    return (_jsxs("button", { type: "button", role: "switch", "aria-checked": on, "aria-label": t('fa.toggleLabel', { name: label }), title: t(on ? 'fa.onHint' : 'fa.offHint'), onClick: (e) => { e.stopPropagation(); onToggle(); }, className: "row g6 t-xs w7", style: { border: `1px solid ${on ? '#B9E5CC' : 'var(--line)'}`, background: on ? '#EAF7EF' : '#fff', color: on ? '#0E5A3A' : 'var(--mute, #6B7280)', borderRadius: 999, padding: '4px 8px 4px 4px', cursor: 'pointer', whiteSpace: 'nowrap' }, children: [_jsx("span", { "aria-hidden": "true", style: { width: 26, height: 16, borderRadius: 999, background: on ? '#1F9D5C' : '#CBD2DC', position: 'relative', transition: 'background .2s', flex: 'none' }, children: _jsx("span", { style: { position: 'absolute', top: 2, left: on ? 12 : 2, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left .2s' } }) }), t(on ? 'fa.on' : 'fa.off')] }));
}
export function FolderGrid({ folders, onOpen, menu }) {
    const { t } = useI18n();
    return (
    // As many columns as fit with room for the name, the ⋯ menu and the client switch.
    _jsx("div", { className: "grid gap-3", style: { gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 230px), 1fr))' }, children: folders.map((f) => (_jsxs("div", { className: `folder fcard${f.toggle ? " has-switch" : ""}`, style: { ...(f.highlight ? { borderColor: 'var(--azul)', background: '#F7F9FF' } : {}), ...(f.hidden ? { borderStyle: 'dashed' } : {}) }, children: [_jsxs("div", { className: "row", style: { gap: 4, minWidth: 0, flex: '1 1 auto' }, children: [_jsxs("button", { type: "button", className: "fopen", onClick: () => onOpen(f.path), style: f.hidden ? { opacity: 0.55 } : undefined, children: [_jsx("span", { className: "fi", style: f.highlight ? { background: 'var(--azul)', color: '#fff' } : undefined, children: _jsx(Icon, { name: f.highlight ? 'upload' : 'folder', size: 22 }) }), _jsxs("span", { className: "col grow", style: { minWidth: 0 }, children: [_jsx("span", { className: "w7 fname", children: f.highlight ? t('files.uploadsName') : f.path === APPROVED ? t('files.approvedName') : f.path.slice(f.path.lastIndexOf('/') + 1) }), _jsxs("span", { className: "t-sm t-mute truncate", children: [f.highlight ? t('files.uploadsHint') : `${formatBytes(f.bytes)}`, f.hidden && !f.toggle ? ` · ${t('fa.hiddenTag')}` : ''] })] })] }), menu && !f.highlight && menu(f.path)] }), f.toggle && _jsx(ShareSwitch, { on: !f.hidden, label: f.path, onToggle: f.toggle })] }, f.path))) }));
}
