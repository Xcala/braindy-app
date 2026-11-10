import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { download, previewKind, signedUrl } from './fileApi';
export function Preview({ brandId, file, onClose }) {
    const { t } = useI18n();
    const [url, setUrl] = useState(null);
    const [error, setError] = useState(false);
    const kind = previewKind(file.contentType);
    useEffect(() => {
        let alive = true;
        signedUrl(brandId, file.id, true).then((u) => alive && setUrl(u)).catch(() => alive && setError(true));
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => { alive = false; window.removeEventListener('keydown', onKey); };
    }, [brandId, file.id, onClose]);
    return (_jsxs("div", { role: "dialog", "aria-modal": "true", "aria-label": file.title, className: "fixed inset-0 z-50 flex flex-col bg-black/85 p-4", onClick: onClose, children: [_jsxs("div", { className: "flex items-center justify-between gap-3 pb-3 text-white", onClick: (e) => e.stopPropagation(), children: [_jsx("span", { className: "truncate text-sm", children: file.title }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => download(brandId, file.id), className: "rounded-full bg-white px-3 py-1 text-sm text-ink", children: t('common.download') }), _jsx("button", { onClick: onClose, "aria-label": t('common.cancel'), className: "rounded-full border border-white/40 px-3 py-1 text-sm", children: "\u2715" })] })] }), _jsxs("div", { className: "flex min-h-0 flex-1 items-center justify-center", onClick: (e) => e.stopPropagation(), children: [error && _jsx("p", { className: "text-white/70", children: t('files.previewError') }), !url && !error && _jsxs("p", { className: "text-white/70", children: [t('common.loading'), "\u2026"] }), url && kind === 'image' && _jsx("img", { src: url, alt: file.title, className: "max-h-full max-w-full object-contain" }), url && kind === 'video' && _jsx("video", { src: url, controls: true, autoPlay: true, className: "max-h-full max-w-full" }), url && kind === 'pdf' && _jsx("iframe", { src: url, title: file.title, className: "h-full w-full rounded bg-white" })] })] }));
}
