import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
/** A pill button that opens a small panel under it; closes on outside click or Escape. */
export function Popover({ label, children, align = 'left', className = 'fx-chip' }) {
    const [open, setOpen] = useState(false);
    const box = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        const off = (e) => { if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target))
            setOpen(false); };
        document.addEventListener('mousedown', off);
        document.addEventListener('keydown', off);
        return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', off); };
    }, [open]);
    return (_jsxs("div", { ref: box, style: { position: 'relative' }, children: [_jsx("button", { type: "button", className: `${className}${open ? ' is-on' : ''}`, "aria-expanded": open, onClick: () => setOpen((o) => !o), children: label }), open && (_jsx("div", { className: "card col g12", role: "dialog", style: { position: 'absolute', top: 'calc(100% + 8px)', [align]: 0, zIndex: 30, width: 'min(320px, 86vw)', padding: 16, boxShadow: '0 18px 40px rgba(11,18,32,.14)' }, children: children(() => setOpen(false)) }))] }));
}
