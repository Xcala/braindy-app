import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useBrandDoc } from '../brands/useBrandDoc';
import { brandColors } from '../brands/identity/Colors';
import './brandPieces.css';
import './explainers.css';
const FALLBACK = ['#2F4DE0', '#0B1220', '#06B6D4'];
export function useBrandKit(brand) {
    const id = (useBrandDoc(brand.id, 'context/identity').data ?? {});
    const hexes = brandColors(id.colors ?? []).map((c) => c.hex).slice(0, 3);
    return {
        c1: hexes[0] ?? FALLBACK[0], c2: hexes[1] ?? FALLBACK[1], c3: hexes[2] ?? hexes[0] ?? FALLBACK[2],
        logo: id.logos?.primary ?? brand.logoUrl ?? undefined, font: id.typography?.[0]?.fontFamily ?? id.typography?.[0]?.name, name: brand.name,
    };
}
export const fontOf = (k) => (k.font ? `'${k.font}', var(--f-text)` : undefined);
/**
 * The top of a Mi plan tab: a label, a two-part title, one line, then an animated stage (10 s loop, five 2 s beats)
 * next to the five steps it tells, each lit in turn.
 */
export function Explainer({ label, title, strong, lead, stage, steps, children }) {
    return (_jsxs("section", { className: "bp-how card", "aria-label": `${title}${strong}`, children: [_jsxs("div", { className: "col g8", children: [_jsx("span", { className: "label", children: label }), _jsxs("h2", { className: "h2", children: [title, _jsx("span", { className: "w9", children: strong })] }), lead && _jsx("p", { className: "t-mute", style: { margin: 0, maxWidth: 560 }, children: lead })] }), _jsxs("div", { className: "bp-stage", children: [_jsx("div", { className: "bp-anim", "aria-hidden": "true", children: stage }), _jsx("ol", { className: "bp-steps", children: steps.map(([t, body], i) => _jsxs("li", { style: { animationDelay: `${i * 2}s` }, children: [_jsxs("b", { children: [_jsx("span", { children: i + 1 }), t] }), _jsx("small", { children: body })] }, t)) })] }), children] }));
}
/** Small illustrated examples as a compact strip at the bottom of an explainer card, so the tab stays one card. */
export function ExampleRow({ title, items }) {
    return (_jsxs("div", { className: "ex-strip", "aria-label": title, children: [_jsx("span", { className: "label", children: title }), _jsx("div", { className: "ex-strip-grid", children: items.map((p) => (_jsxs("figure", { className: "ex-mini", children: [_jsx("div", { className: "ex-mini-art", "aria-hidden": "true", children: p.art }), _jsxs("figcaption", { className: "col", children: [_jsx("span", { className: "w7 t-sm", children: p.label }), _jsx("span", { className: "t-xs t-mute", children: p.note })] })] }, p.key))) })] }));
}
