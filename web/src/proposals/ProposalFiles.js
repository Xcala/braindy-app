import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { formatBytes } from '../assets/fileApi';
import { proposalFileUrl, uploadProposalFile } from './api';
import { useProposalFiles } from './useProposals';
export function ProposalFiles({ id }) {
    const { t } = useI18n();
    const files = useProposalFiles(id).filter((f) => f.status === 'ready');
    const input = useRef(null);
    const [progress, setProgress] = useState(null);
    const [error, setError] = useState(false);
    async function onFiles(list) {
        if (!list?.length)
            return;
        setError(false);
        try {
            for (const [i, f] of [...list].entries())
                await uploadProposalFile(id, f, (p) => setProgress((i + p) / list.length));
        }
        catch {
            setError(true);
        }
        finally {
            setProgress(null);
            if (input.current)
                input.current.value = '';
        }
    }
    return (_jsxs("section", { className: "card col g16", "aria-labelledby": "pfiles", children: [_jsxs("div", { className: "row between", children: [_jsx("h2", { className: "h3", id: "pfiles", children: t('proposals.files') }), _jsxs("div", { className: "row g8", children: [progress !== null && _jsxs("span", { className: "t-sm t-mute", children: [Math.round(progress * 100), "%"] }), error && _jsx("span", { className: "t-sm", role: "alert", style: { color: 'var(--danger)' }, children: t('files.uploadError') }), _jsx("input", { ref: input, type: "file", multiple: true, className: "sr", onChange: (e) => onFiles(e.target.files), "aria-label": t('proposals.addFile') }), _jsxs("button", { className: "btn btn-ghost btn-sm", onClick: () => input.current?.click(), disabled: progress !== null, children: [_jsx(Icon, { name: "upload" }), t('proposals.addFile')] })] })] }), files.length === 0 ? _jsx("p", { className: "t-sm t-mute", children: t('proposals.noFiles') }) : (_jsx("div", { className: "list", style: { borderRadius: 16 }, children: files.map((f) => (_jsxs("div", { className: "lrow", style: { gridTemplateColumns: 'minmax(0,1fr) 100px 96px' }, children: [_jsxs("span", { className: "row g12 min-w-0", children: [_jsx("span", { className: "ficon th-pdf", children: _jsx(Icon, { name: "file" }) }), _jsx("span", { className: "w7 truncate", children: f.title })] }), _jsx("span", { className: "t-sm t-mute", children: formatBytes(f.size) }), _jsx("button", { className: "btn btn-ghost btn-sm", onClick: async () => window.open(await proposalFileUrl(id, f.id), '_blank', 'noopener'), children: t('common.open') })] }, f.id))) })), _jsx("p", { className: "t-xs t-mute", children: t('proposals.filesHint') })] }));
}
