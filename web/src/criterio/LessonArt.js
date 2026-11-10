import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import './learn.css';
/** Each area gets the color and the Brain of its craft (Creator for logos and brand books, Marketer for strategy and
 *  social, Builder for web and apps, Researcher for data); "how we work" is NickMark himself. */
export const AREA_ART = {
    process: { color: '#2F4DE0', deep: '#0B1220', brain: 'nico', icon: '✦' },
    logos: { color: '#06B6D4', deep: '#06303A', brain: 'creator', icon: '◎' },
    strategy: { color: '#8B5CF6', deep: '#22124A', brain: 'marketer', icon: '✧' },
    web: { color: '#2A7FFF', deep: '#0A2250', brain: 'builder', icon: '▭' },
    webtech: { color: '#2A7FFF', deep: '#0A2250', brain: 'builder', icon: '⚙' },
    dashboards: { color: '#F5B301', deep: '#3D2C00', brain: 'researcher', icon: '▥' },
    apps: { color: '#2A7FFF', deep: '#0A2250', brain: 'builder', icon: '▢' },
    brandkit: { color: '#06B6D4', deep: '#06303A', brain: 'creator', icon: '▤' },
    print: { color: '#06B6D4', deep: '#06303A', brain: 'creator', icon: '▦' },
    social: { color: '#8B5CF6', deep: '#22124A', brain: 'marketer', icon: '◍' },
};
export const brainImg = (brain) => (brain === 'nico' ? '/brand/proposal/nicolas-face.jpg' : `/brand/brains/${brain}.png`);
/** The lesson's own sections ("## " headings), cleaned of their "1." numbers: the steps of its explainer and its index. */
export const sectionsOf = (body) => (body.match(/^## .*/gm) ?? []).map((h) => h.slice(3).replace(/^\d+\.\s*/, '').trim());
/** Illustrated cover for a lesson card or header: area color, a big glyph, the Brain of the craft and the minutes. */
export function LessonCover({ l, big, label }) {
    const a = AREA_ART[l.area];
    return (_jsxs("div", { className: `lc${big ? ' lc-big' : ''}`, style: { background: `radial-gradient(120% 120% at 100% 0%, ${a.color} 0%, ${a.deep} 72%)` }, "aria-hidden": "true", children: [_jsx("span", { className: "lc-glyph", children: a.icon }), _jsxs("span", { className: "lc-rings", children: [_jsx("i", { style: { borderColor: a.color } }), _jsx("i", { style: { borderColor: a.color } })] }), _jsx("span", { className: "lc-label", children: label }), l.videoUrl && _jsx("span", { className: "lc-play", children: "\u25B6" }), _jsx("img", { className: `lc-brain${a.brain === 'nico' ? ' is-face' : ''}`, src: brainImg(a.brain), alt: "" })] }));
}
/** A lesson told in a loop: each of its first five sections takes a 2 s beat, with the area's Brain watching over. */
export function LessonStage({ l, steps }) {
    const a = AREA_ART[l.area];
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "ls-bg", style: { background: `radial-gradient(120% 110% at 50% 0%, ${a.color}33, transparent 70%)` } }), steps.slice(0, 5).map((s, i) => (_jsx("div", { className: `ex-layer ex-b${i + 1}`, children: _jsxs("div", { className: "ex-card ls-card", children: [_jsx("span", { className: "ls-num", style: { background: a.color }, children: i + 1 }), _jsx("b", { children: s }), _jsxs("span", { className: "ex-lines", children: [_jsx("i", { style: { width: '90%' } }), _jsx("i", { style: { width: '65%' } })] })] }) }, s))), _jsx("img", { className: `ls-brain${a.brain === 'nico' ? ' is-face' : ''}`, src: brainImg(a.brain), alt: "" }), _jsx("div", { className: "ls-dots", children: steps.slice(0, 5).map((s, i) => _jsx("i", { className: i ? `ex-f${i + 1}` : '', style: { background: a.color } }, s)) })] }));
}
/** The Learn page explainer: choose a topic, watch, get the key idea, use it when asking or approving, fewer rounds. */
export function LearnStage({ label }) {
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "ex-layer ex-b1", children: _jsx("div", { className: "ln-topics", children: ['logos', 'strategy', 'web'].map((k, i) => _jsx("span", { className: `ln-topic${i === 1 ? ' is-on' : ''}`, style: { background: AREA_ART[k].color }, children: AREA_ART[k].icon }, k)) }) }), _jsx("div", { className: "ex-layer ex-b2", children: _jsxs("div", { className: "ln-video", style: { background: `linear-gradient(135deg, ${AREA_ART.strategy.deep}, ${AREA_ART.strategy.color})` }, children: [_jsx("span", { className: "lc-play", style: { position: 'static' }, children: "\u25B6" }), _jsx("span", { className: "ln-progress", children: _jsx("i", {}) })] }) }), _jsx("div", { className: "ex-layer ex-b3", children: _jsxs("div", { className: "ex-card ln-idea", children: [_jsx("span", { className: "ln-bulb", children: "\uD83D\uDCA1" }), _jsx("b", { children: label.topic }), _jsxs("span", { className: "ex-lines", children: [_jsx("i", { style: { width: '85%' } }), _jsx("i", { style: { width: '60%' } })] })] }) }), _jsx("div", { className: "ex-layer ex-b4", children: _jsxs("div", { className: "ex-card ln-comment", children: [_jsx("span", { className: "ex-lines", children: _jsx("i", { style: { width: '80%' } }) }), _jsxs("span", { className: "ln-tip", children: ["\u2713 ", label.tip] })] }) }), _jsx("div", { className: "ex-layer ex-b5", children: _jsxs("div", { className: "col g8", style: { alignItems: 'center' }, children: [_jsx("div", { className: "ln-piece", style: { background: AREA_ART.logos.color }, children: _jsx("span", { className: "ln-check", children: "\u2713" }) }), _jsx("span", { className: "ex-pill ex-ok", children: label.ok })] }) }), _jsx("img", { className: "ls-brain is-face", src: brainImg('nico'), alt: "" })] }));
}
