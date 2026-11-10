import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { at } from './sceneKit';
/** The cursor that does the drawing: it travels the artboard while the pieces appear under it. */
const Cursor = () => _jsx("svg", { className: "sc-cursor", viewBox: "0 0 16 20", children: _jsx("path", { d: "M1 1l13 10-6 1 3 6-2 1-3-6-5 4z" }) });
const Palette = () => _jsx("span", { className: "sc-palette", style: at(3.2), children: [0, 1, 2, 3].map((k) => _jsx("i", { style: at(3.3 + k * 0.15) }, k)) });
const Stage = ({ say }) => (_jsxs("span", { className: "sc-stage", children: [_jsx("em", { className: "w", children: say('wire') }), _jsx("em", { className: "m", style: at(5.8), children: say('mockup') })] }));
/** A site: the wireframe boxes drawn one by one, the palette picked, then each box filled in until it is the mockup. */
function Web({ brand, say }) {
    const box = (cls, d, f, children) => (_jsx("span", { className: `sc-w ${cls}`, style: at(d, { ['--f']: `${f}s` }), children: children }));
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "sc-board", children: [box('nav', 0.2, 4.2, _jsxs(_Fragment, { children: [_jsx("b", { className: "logo", children: brand.slice(0, 14) }), _jsx("s", {}), _jsx("s", {}), _jsx("s", {})] })), box('hero-t', 0.7, 4.5, _jsxs(_Fragment, { children: [_jsx("b", {}), _jsx("b", {}), _jsx("s", {}), _jsx("u", {})] })), box('hero-i', 1.2, 4.9), box('card c1', 1.7, 5.3), box('card c2', 2, 5.5), box('card c3', 2.3, 5.7), box('foot', 2.7, 6)] }), _jsx(Palette, {}), _jsx(Stage, { say: say }), _jsx(Cursor, {})] }));
}
/** A logo: the construction circles and grid, the mark traced in vector, then color and the wordmark. */
function Logo({ brand }) {
    return (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "sc-logo", viewBox: "0 0 200 140", children: [_jsxs("g", { className: "grid", children: [[40, 70, 100, 130, 160].map((x, k) => _jsx("line", { x1: x, y1: "10", x2: x, y2: "130", style: at(k * 0.12) }, x)), [30, 70, 110].map((y, k) => _jsx("line", { x1: "20", y1: y, x2: "180", y2: y, style: at(0.5 + k * 0.12) }, y))] }), _jsx("circle", { className: "guide", cx: "100", cy: "70", r: "32", style: at(0.9) }), _jsx("circle", { className: "guide", cx: "100", cy: "70", r: "50", style: at(1.4) }), _jsx("path", { className: "mark", pathLength: 1, style: at(2.2), d: "M124 46 A 32 32 0 1 0 124 94" }), _jsx("circle", { className: "dot", cx: "118", cy: "70", r: "9", style: at(4) })] }), _jsx("span", { className: "sc-word", style: at(5.4), children: brand.slice(0, 18) }), _jsx(Palette, {}), _jsx(Cursor, {})] }));
}
/** A video: the storyboard frames sketched, the clips laid on the timeline, then the playhead running. */
function Video() {
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "sc-story", children: [0, 1, 2, 3].map((k) => _jsxs("span", { className: "sc-frame", style: at(0.2 + k * 0.5, { ['--f']: `${6 + k * 0.4}s`, ['--h']: `${190 + k * 30}` }), children: [_jsx("i", { style: at(0.6 + k * 0.5) }), _jsx("b", { style: at(0.8 + k * 0.5) })] }, k)) }), _jsxs("div", { className: "sc-timeline", children: [[0, 1, 2].map((tr) => (_jsx("span", { className: `sc-track t${tr}`, children: [0, 1, 2].map((k) => _jsx("i", { style: at(3 + tr * 0.4 + k * 0.3, { left: `${k * 33 + tr * 4}%`, width: `${26 - tr * 4}%` }) }, k)) }, tr))), _jsx("b", { className: "sc-head", style: at(5.2) })] }), _jsx(Cursor, {})] }));
}
/** A document: the page grid, the images and text placed, then the spread finished. */
function Doc() {
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "sc-spread", children: [0, 1].map((p) => (_jsxs("span", { className: "sc-page", children: [[0, 1, 2].map((c) => _jsx("i", { className: "col", style: at(0.2 + p * 0.3 + c * 0.1) }, c)), _jsx("span", { className: `sc-img p${p}`, style: at(2 + p * 0.6) }), [0, 1, 2, 3].map((k) => _jsx("s", { style: at(3.2 + p * 0.5 + k * 0.25, { width: `${90 - k * 12}%` }) }, k)), _jsx("b", { style: at(2.6 + p * 0.6) })] }, p))) }), _jsx(Palette, {}), _jsx(Cursor, {})] }));
}
export function CreatorScene({ variant, brand, say }) {
    if (variant === 'web')
        return _jsx(Web, { brand: brand, say: say });
    if (variant === 'logo')
        return _jsx(Logo, { brand: brand });
    if (variant === 'video')
        return _jsx(Video, {});
    return _jsx(Doc, {});
}
