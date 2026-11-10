import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { WORDS } from './teamLog';
import { at } from './sceneKit';
import { CreatorScene } from './CreatorScenes';
import './teamScenes.css';
/** Researcher: a search, the results coming in, the lens going over them and tagging, then the findings written down. */
function Research({ query, say }) {
    const tags = [[0, 'ref'], [2, 'rival'], [4, 'good']];
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "sc-browser", children: [_jsxs("div", { className: "sc-bar", children: [_jsx("i", {}), _jsx("i", {}), _jsx("i", {}), _jsx("span", { className: "sc-search", children: _jsx("span", { className: "sc-typed", style: { ['--n']: Math.min(query.length, 34) }, children: query.slice(0, 34) }) })] }), _jsx("div", { className: "sc-grid", children: [0, 1, 2, 3, 4, 5].map((k) => (_jsxs("span", { className: "sc-thumb", style: at(1.2 + k * 0.18, { ['--h']: `${(k * 57 + 20) % 360}` }), children: [_jsx("i", {}), _jsx("b", {}), _jsx("b", {}), tags.map(([n, w]) => n === k && _jsx("em", { className: `sc-tag is-${w}`, style: at(2.8 + k * 0.45), children: say(w) }, w))] }, k))) })] }), _jsx("b", { className: "sc-lens" }), _jsxs("div", { className: "sc-notes", style: at(5.6), children: [_jsx("b", { children: say('findings') }), [0, 1, 2].map((k) => _jsxs("span", { style: at(6.2 + k * 0.6), children: [_jsx("i", { children: "\u2713" }), _jsx("s", { style: { width: `${82 - k * 14}%` } })] }, k))] })] }));
}
/** Marketer: competitors placed on a positioning map, the brand moving into the free space, then the goal as a funnel. */
function Market({ say }) {
    const rivals = [[22, 26], [30, 38], [64, 30], [24, 70], [36, 62]];
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "sc-map", children: [_jsx("i", { className: "sc-ax x" }), _jsx("i", { className: "sc-ax y" }), _jsx("small", { className: "t", children: say('premium') }), _jsx("small", { className: "b", children: say('budget') }), _jsx("small", { className: "l", children: say('classic') }), _jsx("small", { className: "r", children: say('bold') }), rivals.map(([x, y], k) => _jsx("span", { className: "sc-dot", style: at(0.8 + k * 0.3, { left: `${x}%`, top: `${y}%` }) }, k)), _jsx("span", { className: "sc-you", style: at(2.8), children: _jsx("em", { children: say('you') }) }), _jsx("span", { className: "sc-zone", style: at(3.6) })] }), _jsxs("div", { className: "sc-goal", style: at(4.8), children: [_jsx("b", { children: say('goal') }), ['aware', 'consider', 'act'].map((w, k) => (_jsx("span", { className: "sc-funnel", style: at(5.4 + k * 0.5, { width: `${100 - k * 24}%` }), children: say(w) }, w)))] })] }));
}
const CODE = (brand) => [
    ['<section class="hero">', 0], [`<h1>${brand.slice(0, 22)}</h1>`, 1], ['<p>{copy.promise}</p>', 1], ['<a class="cta" href="#contact">', 1],
    ['</section>', 0], ['<Cards items={services} />', 0], ['<Footer brand={brand} />', 0],
];
/** Builder, for a site: the code typed in, the build passing, the deploy bar, then the site live. */
function BuildWeb({ brand, say }) {
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "sc-editor", children: CODE(brand).map(([line, indent], k) => (_jsxs("span", { className: "sc-line", style: at(0.3 + k * 0.45, { paddingLeft: `${1 + indent * 2}ch` }), children: [_jsx("i", { children: k + 1 }), _jsx("code", { style: { ['--n']: line.length }, children: line })] }, k))) }), _jsxs("div", { className: "sc-term", style: at(3.9), children: [_jsx("span", { style: at(4.1), children: "$ npm run build" }), _jsx("span", { className: "ok", style: at(4.8), children: "\u2713 built \u00B7 0 errors" }), _jsx("span", { className: "sc-deploy", style: at(5.3), children: _jsx("i", {}) })] }), _jsxs("div", { className: "sc-site", style: at(7), children: [_jsxs("div", { className: "sc-bar", children: [_jsx("i", {}), _jsx("i", {}), _jsx("i", {}), _jsxs("span", { className: "sc-search", children: [brand.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 16) || 'brand', ".com"] })] }), _jsxs("b", { className: "sc-live", children: ["\u25CF ", say('live')] })] })] }));
}
const FILES = {
    logo: ['logo.svg', 'logo-color.png', 'logo-white.png', 'brand-kit.pdf'],
    video: ['video-9x16.mp4', 'video-1x1.mp4', 'video-16x9.mp4', 'subtitles.srt'],
    doc: ['print.pdf', 'digital.pdf', 'editable.fig', 'images.zip'],
};
/** Builder, for a logo, a video or a document: every file exported and checked, then the kit ready. */
function BuildFiles({ variant, say }) {
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "sc-files", children: FILES[variant].map((f, k) => (_jsxs("span", { className: "sc-file", style: at(0.4 + k * 1.1), children: [_jsx("i", { children: f.split('.').pop() }), _jsx("b", { children: f }), _jsx("s", { style: at(0.6 + k * 1.1) }), _jsx("em", { style: at(1.4 + k * 1.1), children: "\u2713" })] }, f))) }), _jsxs("b", { className: "sc-live", style: at(6.2), children: ["\u2713 ", say('ready')] })] }));
}
/** The scene for the Brain at work. Remounted on every turn so it plays from the start. */
export function Scene({ brain, variant, title, brand, say }) {
    return (_jsxs("div", { className: `sc is-${brain} v-${variant}`, "aria-hidden": "true", children: [brain === 'researcher' && _jsx(Research, { query: title, say: say }), brain === 'marketer' && _jsx(Market, { say: say }), brain === 'creator' && _jsx(CreatorScene, { variant: variant, brand: brand, say: say }), brain === 'builder' && (variant === 'web' ? _jsx(BuildWeb, { brand: brand, say: say }) : _jsx(BuildFiles, { variant: variant, say: say }))] }));
}
export const sayIn = (lang) => (w) => WORDS[w][lang];
