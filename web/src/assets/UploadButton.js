import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useUploader } from './useUploader';
/** Upload button with its progress. Without `folder` files go to Uploads; NickMark can pass the open folder. */
export function UploadButton({ brandId, folder, label, secondary }) {
    const { t } = useI18n();
    const input = useRef(null);
    const up = useUploader(brandId);
    const onFiles = async (list) => {
        await up.run(list, folder);
        if (input.current)
            input.current.value = '';
    };
    return (_jsxs("div", { className: "row g12 wrap", children: [_jsx(UploadStatus, { up: up }), _jsx("input", { ref: input, type: "file", multiple: true, className: "sr", onChange: (e) => onFiles(e.target.files), "aria-label": label ?? t('files.upload') }), _jsxs("button", { className: `btn ${secondary ? 'btn-secondary btn-sm' : 'btn-primary'}`, onClick: () => input.current?.click(), disabled: up.progress !== null, children: [_jsx(Icon, { name: "upload", size: secondary ? 14 : 18 }), label ?? t('files.upload')] })] }));
}
export function UploadStatus({ up }) {
    const { t } = useI18n();
    return (_jsxs(_Fragment, { children: [up.state === 'error' && _jsx("span", { role: "alert", className: "t-sm", style: { color: 'var(--danger)' }, children: t('files.uploadError') }), up.state === 'done' && _jsx("span", { role: "status", className: "t-sm", style: { color: 'var(--success)' }, children: t('files.uploaded') }), up.progress !== null && (_jsxs("span", { className: "row g8 t-sm t-mute", "aria-live": "polite", children: [_jsx("span", { className: "block h-1.5 w-28 overflow-hidden rounded-full", style: { background: 'var(--line)' }, children: _jsx("span", { className: "block h-full", style: { width: `${Math.round(up.progress * 100)}%`, background: 'var(--azul)' } }) }), Math.round(up.progress * 100), "%"] }))] }));
}
