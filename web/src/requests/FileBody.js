import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { versionFileText } from './api';
/** A file of a version that is not an image or a video: the PDF in a frame, text to read and copy, or a download card. */
export function FileBody({ brandId, requestId, versionId, index, file, kind, url, onDownload }) {
    const { t } = useI18n();
    if (kind === 'pdf')
        return _jsx("iframe", { className: "vw-pdf", src: url, title: file.name });
    if (kind === 'text' && !file.url)
        return _jsx(TextCard, { brandId: brandId, requestId: requestId, versionId: versionId, index: index });
    return (_jsxs("div", { className: "vw-other", children: [_jsx(Icon, { name: "file", size: 36 }), _jsx("span", { className: "w7", style: { overflowWrap: 'anywhere' }, children: file.name }), _jsx("p", { className: "t-sm t-mute", style: { margin: 0 }, children: t('vw.noPreview') }), _jsxs("button", { className: "btn btn-primary btn-sm", onClick: onDownload, children: [_jsx(Icon, { name: "download" }), t('common.download')] })] }));
}
function TextCard({ brandId, requestId, versionId, index }) {
    const { t } = useI18n();
    const [text, setText] = useState(null);
    const [error, setError] = useState(false);
    const [copied, setCopied] = useState(false);
    useEffect(() => {
        let alive = true;
        setText(null);
        setError(false);
        versionFileText(brandId, requestId, versionId, index).then((x) => alive && setText(x)).catch(() => alive && setError(true));
        return () => { alive = false; };
    }, [brandId, requestId, versionId, index]);
    const copy = async () => {
        if (!text)
            return;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };
    return (_jsxs("div", { className: "vw-text", children: [error ? _jsx("p", { className: "t-sm t-mute", style: { margin: 0 }, children: t('vw.textError') })
                : text === null ? _jsx("div", { className: "skel", style: { height: 160 } }) : _jsx("pre", { children: text }), text && _jsxs("button", { className: "btn btn-secondary btn-sm self-start", onClick: copy, children: [_jsx(Icon, { name: copied ? 'check' : 'copy' }), t(copied ? 'vw.copied' : 'vw.copy')] })] }));
}
