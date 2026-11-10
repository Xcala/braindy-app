import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { ConfirmDialog } from '../components/ConfirmDialog';
/** The Braindy dialogs of the file browser: send to the trash, and rename (in place of the browser's own boxes). */
export function FileDialogs({ actions }) {
    const { t } = useI18n();
    const field = useRef(null);
    const ask = actions.ask;
    if (!ask)
        return null;
    if (ask.kind === 'trash') {
        const one = ask.ids.length === 1 && ask.name;
        return (_jsx(ConfirmDialog, { danger: true, title: t('files.toTrash'), confirmLabel: t('files.toTrash'), busy: actions.busy, onCancel: actions.closeAsk, onConfirm: () => { actions.closeAsk(); actions.trash(ask.ids); }, children: one ? t('files.deleteConfirm', { name: ask.name }) : t('files.deleteSelConfirm', { n: String(ask.ids.length) }) }));
    }
    if (ask.kind === 'trashFolder') {
        const name = ask.path.split('/').pop() ?? ask.path;
        return (_jsx(ConfirmDialog, { danger: true, title: t('files.folderTrash'), confirmLabel: t('files.toTrash'), busy: actions.busy, onCancel: actions.closeAsk, onConfirm: () => { actions.closeAsk(); actions.trashDir(ask.path); }, children: t('files.folderTrashConfirm', { name }) }));
    }
    if (ask.kind === 'renameFolder') {
        const name = ask.path.split('/').pop() ?? ask.path;
        const saveDir = (e) => { e?.preventDefault(); actions.closeAsk(); actions.renameDir(ask.path, field.current?.value.trim() ?? ''); };
        return (_jsx(ConfirmDialog, { title: t('files.folderRename'), confirmLabel: t('files.rename'), onCancel: actions.closeAsk, onConfirm: saveDir, children: _jsxs("form", { onSubmit: saveDir, className: "col g8", style: { marginTop: 4 }, children: [_jsx("label", { className: "t-sm w7", htmlFor: "folder-rename", style: { color: 'var(--ink)' }, children: t('files.renamePrompt') }), _jsx("input", { id: "folder-rename", ref: field, className: "input", defaultValue: name, "data-autofocus": true })] }) }));
    }
    const f = ask.f;
    const save = (e) => { e?.preventDefault(); actions.closeAsk(); actions.rename(f, field.current?.value.trim() ?? ''); };
    return (_jsx(ConfirmDialog, { title: t('files.rename'), confirmLabel: t('files.rename'), onCancel: actions.closeAsk, onConfirm: save, children: _jsxs("form", { onSubmit: save, className: "col g8", style: { marginTop: 4 }, children: [_jsx("label", { className: "t-sm w7", htmlFor: "file-rename", style: { color: 'var(--ink)' }, children: t('files.renamePrompt') }), _jsx("input", { id: "file-rename", ref: field, className: "input", defaultValue: f.title, "data-autofocus": true, onFocus: (e) => { const dot = f.title.lastIndexOf('.'); e.currentTarget.setSelectionRange(0, dot > 0 ? dot : f.title.length); } })] }) }));
}
