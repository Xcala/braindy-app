import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { formatBytes, upload } from '../assets/fileApi';
/**
 * Drop zone for the ask box: any file type (previous deck, photos, PDFs, HTML, videos…), drag and drop or click.
 * Each file uploads right away to the brand's Uploads folder; the request keeps the reference.
 */
export function AskAttachments({ brandId, files, onChange, onBusy }) {
    const { t } = useI18n();
    const input = useRef(null);
    const [over, setOver] = useState(false);
    const [pending, setPending] = useState([]);
    async function add(list) {
        const picked = [...(list ?? [])].slice(0, Math.max(0, 20 - files.length));
        if (!picked.length)
            return;
        onBusy(true);
        const done = [];
        for (const f of picked) {
            const key = `${f.name}-${f.size}-${Date.now()}`;
            setPending((p) => [...p, { key, name: f.name, progress: 0 }]);
            try {
                const assetId = await upload(brandId, f, (progress) => setPending((p) => p.map((x) => (x.key === key ? { ...x, progress } : x))));
                done.push({ assetId, name: f.name, size: f.size, contentType: f.type || 'application/octet-stream' });
                setPending((p) => p.filter((x) => x.key !== key));
            }
            catch {
                setPending((p) => p.map((x) => (x.key === key ? { ...x, error: true } : x)));
            }
        }
        onChange([...files, ...done]);
        onBusy(false);
        if (input.current)
            input.current.value = '';
    }
    return (_jsxs("div", { className: "col g8", children: [_jsxs("div", { role: "button", tabIndex: 0, "aria-label": t('ask.attach'), onClick: () => input.current?.click(), onKeyDown: (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), input.current?.click()), onDragOver: (e) => { e.preventDefault(); setOver(true); }, onDragLeave: () => setOver(false), onDrop: (e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }, className: "row g12", style: { border: `1.5px dashed ${over ? 'var(--azul)' : 'var(--line-strong)'}`, background: over ? '#EEF3FF' : 'var(--niebla, #F6F7FB)', borderRadius: 14, padding: '14px 16px', cursor: 'pointer' }, children: [_jsx(Icon, { name: "upload" }), _jsxs("span", { className: "col", children: [_jsx("span", { className: "t-sm w7", children: t('ask.attach') }), _jsx("span", { className: "t-xs t-mute", children: t('ask.attachHint') })] })] }), _jsx("input", { ref: input, type: "file", multiple: true, className: "sr", tabIndex: -1, onChange: (e) => add(e.target.files) }), files.map((f) => (_jsxs("div", { className: "row g8 t-sm", children: [_jsx(Icon, { name: "file", size: 16 }), _jsx("span", { className: "grow truncate", children: f.name }), _jsx("span", { className: "t-xs t-mute", children: formatBytes(f.size) }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", "aria-label": `${t('ask.removeFile')} ${f.name}`, onClick: () => onChange(files.filter((x) => x.assetId !== f.assetId)), children: "\u2715" })] }, f.assetId))), pending.map((p) => (_jsxs("div", { className: "row g8 t-sm", "aria-live": "polite", children: [_jsx("span", { className: "grow truncate", children: p.name }), p.error ? _jsx("span", { className: "t-xs", style: { color: 'var(--danger)' }, children: t('files.uploadError') }) : (_jsx("span", { className: "block h-1.5 w-24 overflow-hidden rounded-full", style: { background: 'var(--line)' }, children: _jsx("span", { className: "block h-full", style: { width: `${Math.round(p.progress * 100)}%`, background: 'var(--azul)' } }) }))] }, p.key)))] }));
}
