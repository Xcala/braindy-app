import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { formatBytes, signedUrl } from '../assets/fileApi';
/** Files the client attached to a request (previous deck, photos, PDFs…). Each opens through a short-lived link. */
export function AttachedFiles({ brandId, files }) {
    const { t } = useI18n();
    const [failed, setFailed] = useState(null);
    if (!files?.length)
        return null;
    const open = async (f) => {
        setFailed(null);
        try {
            window.open(await signedUrl(brandId, f.assetId, true), '_blank', 'noopener,noreferrer');
        }
        catch {
            setFailed(f.assetId);
        }
    };
    return (_jsxs("div", { className: "col g4", children: [_jsx("span", { className: "label", children: t('req.attached', { n: files.length }) }), files.map((f) => (_jsxs("button", { type: "button", className: "row g8 t-sm text-left", onClick: () => open(f), style: { background: 'none', border: 0, padding: '4px 0', cursor: 'pointer', color: 'var(--azul)' }, children: [_jsx(Icon, { name: "file", size: 16 }), _jsx("span", { className: "grow truncate", children: f.name }), _jsx("span", { className: "t-xs t-mute", children: failed === f.assetId ? t('files.uploadError') : formatBytes(f.size) })] }, f.assetId)))] }));
}
