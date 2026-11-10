import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const ORDER = ['researcher', 'marketer', 'creator', 'builder'];
const NAMES = { researcher: 'Researcher', marketer: 'Marketer', creator: 'Creator', builder: 'Builder' };
/** The four Brains as a signature (design: "sig"). The lead Brain carries the request's state. */
export function BrainStack({ lead, state = 'idle', size = 'sm', label }) {
    return (_jsxs("span", { className: "sig row g8", style: { minWidth: 0 }, title: ORDER.map((b) => NAMES[b]).join(', '), children: [_jsx("span", { className: "row", style: { flex: 'none' }, "aria-label": ORDER.map((b) => NAMES[b]).join(', '), children: ORDER.map((b, i) => (_jsx("span", { className: `brain ${size} b-${b} ${b === lead && state !== 'idle' ? `brain-${state}` : ''}`, style: { marginLeft: i ? -7 : 0, boxShadow: '0 0 0 2px #FFFFFF' }, children: _jsx("img", { src: `/brand/brains/${b}.png`, alt: "" }) }, b))) }), label && _jsx("span", { className: "t-sm", style: { minWidth: 0 }, children: label })] }));
}
export const brainName = (b) => (b ? NAMES[b] : '');
