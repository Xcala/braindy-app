import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { contractsApi } from './api';
/** The signed contract PDF (both signatures + certificate). For admin, the signer and people who see billing. */
export function ContractDownload({ brandId, contract, compact }) {
    const { t, lang } = useI18n();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const open = async () => {
        setBusy(true);
        setError(false);
        try {
            window.open((await contractsApi.pdfUrl(brandId, contract.id)).url, '_blank', 'noopener');
        }
        catch {
            setError(true);
        }
        finally {
            setBusy(false);
        }
    };
    const when = contract.signatures?.contractor?.signedAt;
    return (_jsxs("div", { className: "card row between g16 wrap", style: { padding: compact ? 16 : 22 }, children: [_jsxs("div", { className: "row g12 min-w-0", children: [_jsx("span", { className: "ficon th-pdf", children: _jsx(Icon, { name: "file" }) }), _jsxs("div", { className: "col min-w-0", children: [_jsx("span", { className: "w7 truncate", children: contract.pdf?.fileName ?? t('ctr.pdfTitle') }), _jsxs("span", { className: "t-xs t-mute", children: [when ? t('ctr.signedOn', { date: new Date(when).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { dateStyle: 'long' }) }) : '', " \u00B7 SHA-256 ", contract.pdf?.sha256.slice(0, 12), "\u2026"] })] })] }), _jsxs("div", { className: "row g8", children: [error && _jsx("span", { className: "t-sm", role: "alert", style: { color: 'var(--danger)' }, children: t('ctr.err.error') }), _jsxs("button", { className: "btn btn-secondary btn-sm", disabled: busy, onClick: open, children: [_jsx(Icon, { name: "download" }), t('ctr.download')] })] })] }));
}
