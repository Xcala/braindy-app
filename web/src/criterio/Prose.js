import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** Bold spans in a line: **like this**. */
function inline(text) {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => part.startsWith('**') && part.endsWith('**') ? _jsx("strong", { children: part.slice(2, -2) }, i) : part);
}
/** Groups lines: "## " heading, "- " list items, "> " quote, anything else a paragraph; blank lines close a block. */
function parse(text) {
    const out = [];
    let cur = null;
    for (const raw of text.trim().split('\n')) {
        const line = raw.trimEnd();
        const kind = !line.trim() ? null : line.startsWith('## ') ? 'h' : line.startsWith('- ') ? 'ul' : line.startsWith('> ') ? 'quote' : 'p';
        if (!kind) {
            cur = null;
            continue;
        }
        if (kind === 'h') {
            out.push({ kind, lines: [line.slice(3)] });
            cur = null;
            continue;
        }
        const content = kind === 'ul' ? line.slice(2) : kind === 'quote' ? line.slice(2) : line;
        if (cur && cur.kind === kind)
            cur.lines.push(content);
        else {
            cur = { kind, lines: [content] };
            out.push(cur);
        }
    }
    return out;
}
const body = { fontSize: 17, lineHeight: 1.65 };
/**
 * Lesson text as the Brains write it (no HTML is ever rendered). With an accent it reads richer: the first paragraph
 * as a lead, numbered sections (anchors sec-1, sec-2…), lists as check cards and quotes as pull quotes.
 */
export function Prose({ text, accent }) {
    let n = 0, firstP = true;
    return (_jsx("div", { className: "col g16", style: { maxWidth: 760 }, children: parse(text).map((b, i) => {
            if (b.kind === 'h') {
                if (!accent)
                    return _jsx("h2", { className: "h3", style: { marginTop: 12 }, children: inline(b.lines[0]) }, i);
                n += 1;
                return _jsxs("h2", { id: `sec-${n}`, className: "h3 lx-h", children: [_jsx("span", { className: "lx-n", style: { background: accent }, children: n }), inline(b.lines[0].replace(/^\d+\.\s*/, ''))] }, i);
            }
            if (b.kind === 'ul') {
                if (!accent)
                    return _jsx("ul", { className: "col g8", style: { ...body, paddingLeft: 22, listStyle: 'disc' }, children: b.lines.map((l, j) => _jsx("li", { children: inline(l) }, j)) }, i);
                const grid = b.lines.length >= 4 && b.lines.every((l) => l.length < 110);
                return _jsx("ul", { className: `lx-list${grid ? ' is-grid' : ''}`, children: b.lines.map((l, j) => _jsxs("li", { children: [_jsx("i", { style: { background: accent }, children: "\u2713" }), _jsx("span", { children: inline(l) })] }, j)) }, i);
            }
            if (b.kind === 'quote') {
                return accent
                    ? _jsx("blockquote", { className: "lx-quote", style: { background: `${accent}14`, color: 'var(--ink)' }, children: inline(b.lines.join(' ')) }, i)
                    : _jsx("blockquote", { className: "h3", style: { borderLeft: '3px solid var(--azul)', paddingLeft: 16 }, children: inline(b.lines.join(' ')) }, i);
            }
            const lead = accent && firstP;
            firstP = false;
            return _jsx("p", { className: lead ? 'lx-lead' : undefined, style: lead ? undefined : body, children: inline(b.lines.join(' ')) }, i);
        }) }));
}
