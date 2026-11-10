import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Icon } from '../../components/Icon';
import { AskStart } from './AskStart';
import { AskCompose } from './AskCompose';
import './ask.css';
/**
 * "New request" as a side panel (full screen on phones): first what you want to achieve, then the details.
 * Escape or the scrim closes it; focus goes into the panel and comes back to the button that opened it.
 */
export function AskPanel({ brandId, list, onClose, initial }) {
    const { t } = useI18n();
    const [seed, setSeed] = useState(initial ?? null);
    const panel = useRef(null);
    const close = useRef(onClose);
    close.current = onClose;
    useEffect(() => {
        const back = document.activeElement;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        panel.current?.focus();
        const key = (e) => { if (e.key === 'Escape')
            close.current(); };
        document.addEventListener('keydown', key);
        return () => { document.removeEventListener('keydown', key); document.body.style.overflow = overflow; back?.focus?.(); };
    }, []);
    useEffect(() => { panel.current?.scrollTo({ top: 0 }); }, [seed]);
    return (_jsxs("div", { className: "ask-layer", children: [_jsx("div", { className: "ask-scrim", onClick: onClose, "aria-hidden": true }), _jsxs("div", { ref: panel, className: "ask-panel", role: "dialog", "aria-modal": "true", "aria-labelledby": "h-ask", tabIndex: -1, children: [_jsxs("div", { className: "row between g12", children: [_jsxs("div", { className: "row g12", children: [_jsx("img", { src: "/brand/proposal/nicolas-face.jpg", alt: "", className: "h-11 w-11 flex-none rounded-full object-cover" }), _jsxs("span", { className: "col", children: [_jsx("h2", { className: "h3", id: "h-ask", style: { margin: 0 }, children: t('ask.simpleTitle') }), _jsx("span", { className: "t-xs t-mute", children: t('as.sub') })] })] }), _jsx("button", { type: "button", className: "fx-ibtn", onClick: onClose, "aria-label": t('be.close'), children: _jsx(Icon, { name: "x", size: 16 }) })] }), seed ? _jsx(AskCompose, { brandId: brandId, seed: seed, onBack: () => setSeed(null) }, JSON.stringify(seed))
                        : _jsx(AskStart, { brandId: brandId, list: list, onPick: setSeed })] })] }));
}
