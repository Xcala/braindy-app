import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const NEXT = /pr[oó]ximos pasos|siguientes pasos|next steps|action items|acuerdos|tareas|pendientes|to-?dos?/i;
/** Granola notes are light markdown: headings (with or without #), nested "-" bullets and **bold**. */
export function parseNotes(md) {
    const out = [];
    let cur = { paras: [], items: [] };
    const push = () => { if (cur.title || cur.paras.length || cur.items.length)
        out.push(cur); };
    for (const raw of md.replace(/\r/g, '').split('\n')) {
        if (!raw.trim())
            continue;
        const bullet = /^(\s*)(?:[-*•]|\d+[.)])\s+(.*)$/.exec(raw);
        if (bullet) {
            cur.items.push({ text: bullet[2], depth: Math.min(2, Math.floor(bullet[1].replace(/\t/g, '  ').length / 2)) });
            continue;
        }
        const line = raw.replace(/^#+\s*/, '').trim();
        // A short line that is not a sentence opens a new topic; anything else is a paragraph of the current one.
        if (/^#+\s/.test(raw) || (line.length <= 90 && !/[.:;]$/.test(line))) {
            push();
            cur = { title: line.replace(/\*\*/g, ''), paras: [], items: [] };
        }
        else
            cur.paras.push(line);
    }
    push();
    return out;
}
const inline = (s) => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith('**') && p.endsWith('**') ? _jsx("strong", { children: p.slice(2, -2) }, i) : p));
/** Meeting notes laid out as topics: a numbered title per topic, bullets with hierarchy, next steps as a checklist. */
export function MeetingNotes({ notes }) {
    const sections = parseNotes(notes);
    let n = 0;
    return (_jsx("div", { className: "mnotes", children: sections.map((s, i) => {
            const next = !!s.title && NEXT.test(s.title);
            if (s.title && !next)
                n++;
            return (_jsxs("section", { className: `mtopic${next ? ' is-next' : ''}`, children: [s.title && (_jsxs("h4", { className: "mtopic-h", children: [next ? _jsx("span", { className: "mtopic-n", "aria-hidden": "true", children: "\u2713" }) : _jsx("span", { className: "mtopic-n", children: String(n).padStart(2, '0') }), _jsx("span", { children: s.title })] })), s.paras.map((p, k) => _jsx("p", { className: "mtopic-p", children: inline(p) }, k)), s.items.length > 0 && (_jsx("ul", { className: "mlist", children: s.items.map((it, k) => _jsx("li", { className: `d${it.depth}`, children: inline(it.text) }, k)) }))] }, i));
        }) }));
}
/** The topic titles, for the closed card's preview. */
export const topics = (notes) => parseNotes(notes).map((s) => s.title).filter((x) => !!x && !NEXT.test(x));
