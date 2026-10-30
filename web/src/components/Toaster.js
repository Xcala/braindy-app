import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
const Ctx = createContext(() => undefined);
/** Toasts (design 30): undo instead of confirming reversible actions. 6 s, paused on hover/focus. */
export const useToast = () => useContext(Ctx);
export function Toaster({ children }) {
    const [list, setList] = useState([]);
    const next = useRef(1);
    const show = useCallback((t) => setList((l) => [...l.slice(-2), { ...t, id: next.current++ }]), []);
    const close = useCallback((id) => setList((l) => l.filter((x) => x.id !== id)), []);
    return (_jsxs(Ctx.Provider, { value: show, children: [children, _jsx("div", { className: "pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6", role: "status", "aria-live": "polite", children: list.map((t) => _jsx(Item, { t: t, onClose: () => close(t.id) }, t.id)) })] }));
}
function Item({ t, onClose }) {
    const { t: tr } = useI18n();
    const [paused, setPaused] = useState(false);
    const left = useRef(t.ms ?? (t.undo ? 6000 : 2000));
    useEffect(() => {
        if (paused)
            return;
        const started = Date.now();
        const id = window.setTimeout(onClose, left.current);
        return () => { window.clearTimeout(id); left.current -= Date.now() - started; };
    }, [paused, onClose]);
    return (_jsxs("div", { className: "toast pointer-events-auto w-full max-w-[420px]", onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false), onFocus: () => setPaused(true), onBlur: () => setPaused(false), children: [_jsx("span", { className: t.tone === 'bad' ? 'bad' : 'ok', "aria-hidden": "true", children: _jsx("svg", { viewBox: "0 0 24 24", width: "14", height: "14", fill: "none", stroke: "#fff", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round", children: t.tone === 'bad' ? _jsx("path", { d: "M6 6l12 12M18 6 6 18" }) : _jsx("path", { d: "m5 12 5 5 9-10" }) }) }), _jsx("span", { className: "grow", children: t.text }), t.undo && _jsx("a", { href: "#", onClick: (e) => { e.preventDefault(); t.undo(); onClose(); }, children: tr('common.undo') })] }));
}
