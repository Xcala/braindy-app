import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n/I18nProvider';
/** Modal confirmation from the design system (scrim + modal), focus kept inside, Escape closes. */
export function ConfirmDialog({ title, children, confirmLabel, danger, busy, onConfirm, onCancel }) {
    const { t } = useI18n();
    const ref = useRef(null);
    useEffect(() => {
        const prev = document.activeElement;
        ref.current?.querySelector('button[data-autofocus]')?.focus();
        const onKey = (e) => {
            if (e.key === 'Escape')
                onCancel();
            if (e.key === 'Tab' && ref.current) {
                const f = [...ref.current.querySelectorAll('button')];
                if (!f.length)
                    return;
                if (e.shiftKey && document.activeElement === f[0]) {
                    e.preventDefault();
                    f[f.length - 1].focus();
                }
                else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
                    e.preventDefault();
                    f[0].focus();
                }
            }
        };
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('keydown', onKey); prev?.focus(); };
    }, [onCancel]);
    return (_jsx("div", { className: "scrim fixed inset-0 z-50 flex items-center justify-center p-4", onMouseDown: (e) => e.target === e.currentTarget && onCancel(), children: _jsxs("div", { ref: ref, className: "modal w-full max-w-[480px]", role: "alertdialog", "aria-modal": "true", "aria-labelledby": "confirm-title", children: [_jsx("h2", { className: "h2", id: "confirm-title", children: title }), children && _jsx("div", { className: "t-mute", children: children }), _jsxs("div", { className: "row g12 wrap", style: { justifyContent: 'flex-end' }, children: [_jsx("button", { className: "btn btn-secondary", onClick: onCancel, "data-autofocus": true, children: t('common.cancel') }), _jsx("button", { className: `btn ${danger ? 'btn-danger' : 'btn-primary'}`, onClick: onConfirm, disabled: busy, children: confirmLabel })] })] }) }));
}
