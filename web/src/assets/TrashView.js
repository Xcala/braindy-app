import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toaster';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { formatBytes, listTrash, purgeFile, restoreFile } from './fileApi';
/** NickMark only: files sent to the trash in the last 30 days, to restore or delete for good. */
export function TrashView({ brandId, onBack }) {
    const { t, lang } = useI18n();
    const [list, setList] = useState(null);
    const [days, setDays] = useState(30);
    const [error, setError] = useState(false);
    const [purge, setPurge] = useState(null);
    const closePurge = useCallback(() => setPurge(null), []);
    const toast = useToast();
    const load = useCallback(() => listTrash(brandId).then((r) => { setList(r.files); setDays(r.days); }).catch(() => setError(true)), [brandId]);
    useEffect(() => { void load(); }, [load]);
    const act = (p, ok) => { setError(false); p.then(() => { toast({ text: ok }); return load(); }).catch(() => setError(true)); };
    const left = (ms) => (ms ? Math.max(0, days - Math.floor((Date.now() - ms) / 864e5)) : days);
    return (_jsxs("div", { className: "col g16", children: [_jsxs("div", { className: "row between g8 wrap", children: [_jsxs("div", { className: "col g4", children: [_jsxs("p", { className: "label", children: [t('files.trash'), list ? ` · ${list.length}` : ''] }), _jsx("p", { className: "t-xs t-mute", style: { margin: 0 }, children: t('files.trashSub', { days: String(days) }) })] }), _jsxs("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: onBack, children: [_jsx(Icon, { name: "arrowLeft", size: 14 }), " ", t('files.back')] })] }), error && _jsx("p", { role: "alert", className: "t-sm", style: { color: 'var(--danger)' }, children: t('files.actionError') }), !list ? _jsx("div", { className: "skel", style: { height: 120 } })
                : !list.length ? _jsxs("div", { className: "empty", children: [_jsx(Icon, { name: "trash", size: 32 }), _jsx("p", { className: "t-mute", children: t('files.trashEmpty') })] })
                    : (_jsx("div", { className: "list overflow-x-auto", children: list.map((f) => (_jsxs("div", { className: "lrow trow min-w-[640px]", children: [_jsxs("span", { className: "col", style: { minWidth: 0 }, children: [_jsx("span", { className: "w7 truncate", children: f.title }), _jsxs("span", { className: "t-xs t-mute truncate", children: [f.folder || t('files.rootFolder'), " \u00B7 ", formatBytes(f.size)] })] }), _jsx("span", { className: "t-xs t-mute", children: lang === 'es' ? `${left(f.trashedAt)} días` : `${left(f.trashedAt)} days` }), _jsxs("span", { className: "row g4", style: { justifyContent: 'flex-end' }, children: [_jsxs("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => act(restoreFile(brandId, f.id), t('files.restoredN', { n: '1' })), children: [_jsx(Icon, { name: "restore", size: 14 }), " ", t('files.restore')] }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", style: { color: 'var(--danger)' }, onClick: () => setPurge(f), children: t('files.purge') })] })] }, f.id))) })), purge && (_jsx(ConfirmDialog, { danger: true, title: t('files.purge'), confirmLabel: t('files.purge'), onCancel: closePurge, onConfirm: () => { const f = purge; setPurge(null); act(purgeFile(brandId, f.id), t('files.purged')); }, children: t('files.purgeConfirm', { name: purge.title }) }))] }));
}
