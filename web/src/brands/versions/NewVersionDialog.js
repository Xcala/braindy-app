import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { api } from '../../lib/api';
/** Admin: opens a new version of the brand (rebranding). The server freezes Mi marca as it is and renames the brand. */
export function NewVersionDialog({ brand, onClose }) {
    const { t } = useI18n();
    const [name, setName] = useState('');
    const [restart, setRestart] = useState({ voice: true, strategy: false, primal: false });
    const [busy, setBusy] = useState(false);
    const [failed, setFailed] = useState(false);
    async function go() {
        if (!name.trim())
            return;
        setBusy(true);
        setFailed(false);
        try {
            await api(`/v1/admin/brands/${brand.id}/versions`, { method: 'POST', body: JSON.stringify({ name: name.trim(), restart }) });
            onClose();
        }
        catch {
            setFailed(true);
            setBusy(false);
        }
    }
    const box = (k, label) => (_jsxs("label", { className: "row g8 t-sm", style: { alignItems: 'center' }, children: [_jsx("input", { type: "checkbox", checked: restart[k], onChange: (e) => setRestart({ ...restart, [k]: e.target.checked }) }), label] }));
    return (_jsx(ConfirmDialog, { title: t('ver.newTitle'), confirmLabel: t('ver.create'), busy: busy || !name.trim(), onCancel: onClose, onConfirm: go, children: _jsxs("form", { className: "col g12", style: { marginTop: 4 }, onSubmit: (e) => { e.preventDefault(); void go(); }, children: [_jsx("p", { className: "t-sm t-mute", children: t('ver.newIntro', { name: brand.name }) }), _jsx("label", { className: "t-sm w7", htmlFor: "ver-name", style: { color: 'var(--ink)' }, children: t('ver.name') }), _jsx("input", { id: "ver-name", className: "input", value: name, onChange: (e) => setName(e.target.value), maxLength: 80, "data-autofocus": true }), _jsxs("fieldset", { className: "col g8", style: { border: 0, padding: 0, margin: 0 }, children: [_jsx("legend", { className: "t-sm w7", style: { color: 'var(--ink)', marginBottom: 8 }, children: t('ver.restart') }), box('voice', t('ver.restartVoice')), box('strategy', t('ver.restartStrategy')), box('primal', t('ver.restartPrimal')), _jsx("span", { className: "t-xs t-mute", children: t('ver.restartHint') })] }), failed && _jsx("p", { className: "t-sm", role: "alert", style: { color: 'var(--danger, #C0392B)' }, children: t('ver.failed') })] }) }));
}
