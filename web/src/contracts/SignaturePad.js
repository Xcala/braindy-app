import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
/** Draw a signature with mouse, pen or finger. Reports a PNG data URL, or null while empty. */
export function SignaturePad({ onChange, label }) {
    const { t } = useI18n();
    const ref = useRef(null);
    const drawing = useRef(false);
    const strokes = useRef(0);
    const [empty, setEmpty] = useState(true);
    useEffect(() => {
        const c = ref.current;
        const ratio = window.devicePixelRatio || 1;
        c.width = c.offsetWidth * ratio;
        c.height = c.offsetHeight * ratio;
        const ctx = c.getContext('2d');
        ctx.scale(ratio, ratio);
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#0F1421';
    }, []);
    const point = (e) => {
        const r = ref.current.getBoundingClientRect();
        return [e.clientX - r.left, e.clientY - r.top];
    };
    const down = (e) => {
        e.preventDefault();
        ref.current.setPointerCapture(e.pointerId);
        drawing.current = true;
        const ctx = ref.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(...point(e));
    };
    const move = (e) => {
        if (!drawing.current)
            return;
        const ctx = ref.current.getContext('2d');
        ctx.lineTo(...point(e));
        ctx.stroke();
    };
    const up = () => {
        if (!drawing.current)
            return;
        drawing.current = false;
        strokes.current += 1;
        setEmpty(false);
        onChange(ref.current.toDataURL('image/png'));
    };
    const clear = () => {
        const c = ref.current;
        c.getContext('2d').clearRect(0, 0, c.width, c.height);
        strokes.current = 0;
        setEmpty(true);
        onChange(null);
    };
    return (_jsxs("div", { className: "col g8", children: [_jsx("span", { className: "t-sm w7", children: label }), _jsx("canvas", { ref: ref, role: "img", "aria-label": label, onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerLeave: up, style: { width: '100%', height: 160, borderRadius: 14, border: '1.5px dashed #C9D0DE', background: '#fff', touchAction: 'none', cursor: 'crosshair' } }), _jsxs("div", { className: "row between", children: [_jsx("span", { className: "t-xs t-mute", children: empty ? t('ctr.padHint') : t('ctr.padDone') }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: clear, disabled: empty, children: t('ctr.padClear') })] })] }));
}
