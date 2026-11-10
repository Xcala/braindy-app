import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
/** Shown once when the browser speaks neither Spanish nor English: the person picks the app's language. Bilingual on purpose. */
export function LangChooser({ onPick }) {
    const first = useRef(null);
    useEffect(() => { first.current?.focus(); }, []);
    return (_jsx("div", { className: "scrim fixed inset-0 z-[70] flex items-center justify-center p-4", children: _jsxs("div", { role: "dialog", "aria-modal": "true", "aria-labelledby": "h-lang", className: "card col g16", style: { maxWidth: 380, width: '100%', textAlign: 'center' }, children: [_jsx("img", { src: "/brand/braindy-logo.svg", alt: "Braindy", className: "mx-auto h-7 w-auto" }), _jsx("h2", { className: "h3", id: "h-lang", children: "Choose your language \u00B7 Elige tu idioma" }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx("button", { ref: first, type: "button", className: "btn btn-primary", onClick: () => onPick('en'), lang: "en", children: "English" }), _jsx("button", { type: "button", className: "btn btn-primary", onClick: () => onPick('es'), lang: "es", children: "Espa\u00F1ol" })] }), _jsx("p", { className: "t-xs t-mute", children: "You can change it any time with EN / ES. \u00B7 Puedes cambiarlo cuando quieras con EN / ES." })] }) }));
}
