import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { upload } from './fileApi';
export function UploadButton({ brandId }) {
    const { t } = useI18n();
    const input = useRef(null);
    const [progress, setProgress] = useState(null);
    const [state, setState] = useState('idle');
    async function onFiles(list) {
        if (!list?.length)
            return;
        setState('idle');
        try {
            for (const [i, f] of [...list].entries()) {
                await upload(brandId, f, (p) => setProgress((i + p) / list.length));
            }
            setState('done');
        }
        catch {
            setState('error');
        }
        finally {
            setProgress(null);
            if (input.current)
                input.current.value = '';
        }
    }
    return (_jsxs("div", { className: "row g12 wrap", children: [state === 'error' && _jsx("span", { role: "alert", className: "t-sm", style: { color: 'var(--danger)' }, children: t('files.uploadError') }), state === 'done' && _jsx("span", { role: "status", className: "t-sm", style: { color: 'var(--success)' }, children: t('files.uploaded') }), progress !== null && (_jsxs("span", { className: "row g8 t-sm t-mute", "aria-live": "polite", children: [_jsx("span", { className: "block h-1.5 w-28 overflow-hidden rounded-full", style: { background: 'var(--line)' }, children: _jsx("span", { className: "block h-full", style: { width: `${Math.round(progress * 100)}%`, background: 'var(--azul)' } }) }), Math.round(progress * 100), "%"] })), _jsx("input", { ref: input, type: "file", multiple: true, className: "sr", onChange: (e) => onFiles(e.target.files), "aria-label": t('files.upload') }), _jsxs("button", { className: "btn btn-primary", onClick: () => input.current?.click(), disabled: progress !== null, children: [_jsx(Icon, { name: "upload" }), t('files.upload')] })] }));
}
