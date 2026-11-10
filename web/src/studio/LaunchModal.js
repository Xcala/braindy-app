import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n/I18nProvider';
/** One launch, big: the piece (video plays with sound controls), its title, brand and date, and whatever goes below (reactions). */
export function LaunchModal({ w, sub, onClose, children }) {
    const { t } = useI18n();
    const box = useRef(null);
    useEffect(() => {
        const prev = document.activeElement;
        box.current?.querySelector('button')?.focus();
        const esc = (e) => { if (e.key === 'Escape')
            onClose(); };
        document.addEventListener('keydown', esc);
        return () => { document.removeEventListener('keydown', esc); prev?.focus(); };
    }, [onClose]);
    return (_jsx("div", { className: "scrim fixed inset-0 z-50 flex items-center justify-center p-4", onMouseDown: (e) => e.target === e.currentTarget && onClose(), children: _jsxs("div", { ref: box, className: "modal col g12 w-full max-w-[880px]", role: "dialog", "aria-modal": "true", "aria-labelledby": "launch-title", children: [_jsxs("div", { className: "row between g8", children: [_jsxs("div", { className: "col min-w-0", children: [_jsx("h2", { className: "h3 truncate", id: "launch-title", children: w.title }), _jsx("span", { className: "t-sm t-mute", children: sub })] }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: onClose, "aria-label": t('st.close'), children: "\u2715" })] }), w.kind === 'video'
                    ? _jsx("video", { src: w.url, controls: true, autoPlay: true, playsInline: true, className: "sd-launch-media", "aria-label": w.title })
                    : _jsx("img", { src: w.url, alt: w.title, className: "sd-launch-media" }), children] }) }));
}
