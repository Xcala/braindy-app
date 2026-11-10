import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
const link = { background: 'none', border: 0, cursor: 'pointer', padding: 0 };
/**
 * Edit and delete for a comment its author (or NickMark) may change: «Edit · Delete» links; Edit opens the text in a box
 * with Save/Cancel, Delete asks once inline. Without onSave only Delete shows (NickMark on someone else's comment).
 * The caller hides its own text while `editing` is on.
 */
export function CommentEdit({ text, max, onSave, onDelete, editing, setEditing }) {
    const { t } = useI18n();
    const [draft, setDraft] = useState(text);
    const [sure, setSure] = useState(false);
    const [state, setState] = useState('idle');
    async function save(e) {
        e?.preventDefault();
        const v = draft.trim();
        if (!onSave || !v || v === text) {
            setEditing(false);
            return;
        }
        setState('busy');
        try {
            await onSave(v.slice(0, max));
            setState('idle');
            setEditing(false);
        }
        catch {
            setState('error');
        }
    }
    if (editing)
        return (_jsxs("form", { className: "col g6", onSubmit: save, children: [_jsx("textarea", { className: "input", rows: 3, value: draft, maxLength: max, "aria-label": t('ce.label'), autoFocus: true, onChange: (e) => setDraft(e.target.value), onKeyDown: (e) => { if (e.key === 'Escape')
                        setEditing(false); if (e.key === 'Enter' && (e.metaKey || e.ctrlKey))
                        save(); }, style: { height: 'auto', paddingTop: 8, fontSize: 14 } }), _jsxs("div", { className: "row g8", children: [_jsx("button", { type: "submit", className: "btn btn-primary btn-sm", disabled: !draft.trim() || state === 'busy', children: t('ce.save') }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => { setDraft(text); setEditing(false); }, children: t('ce.cancel') })] }), state === 'error' && _jsx("span", { className: "t-xs", role: "alert", style: { color: 'var(--danger)' }, children: t('ce.failed') })] }));
    if (sure)
        return (_jsxs("span", { className: "row g8 t-xs", role: "group", "aria-label": t('ce.sure'), children: [_jsx("span", { className: "w7", children: t('ce.sure') }), _jsx("button", { type: "button", className: "w7", style: { ...link, color: 'var(--danger)' }, onClick: () => onDelete().catch(() => setSure(false)), children: t('ce.yes') }), _jsx("button", { type: "button", style: { ...link, color: 'var(--graphite)' }, onClick: () => setSure(false), children: t('ce.cancel') })] }));
    return (_jsxs("span", { className: "row g8 t-xs", children: [onSave && _jsx("button", { type: "button", className: "w7", style: { ...link, color: 'var(--graphite)' }, onClick: () => { setDraft(text); setEditing(true); }, children: t('ce.edit') }), _jsx("button", { type: "button", className: "w7", style: { ...link, color: 'var(--graphite)' }, onClick: () => setSure(true), children: t('ce.delete') })] }));
}
