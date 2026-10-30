import { jsx as _jsx } from "react/jsx-runtime";
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
/** Lesson text as the Brains write it (no HTML is ever rendered). */
export function Prose({ text }) {
    return (_jsx("div", { className: "col g16", style: { maxWidth: 720 }, children: parse(text).map((b, i) => {
            if (b.kind === 'h')
                return _jsx("h2", { className: "h3", style: { marginTop: 12 }, children: inline(b.lines[0]) }, i);
            if (b.kind === 'ul')
                return _jsx("ul", { className: "col g8", style: { ...body, paddingLeft: 22, listStyle: 'disc' }, children: b.lines.map((l, j) => _jsx("li", { children: inline(l) }, j)) }, i);
            if (b.kind === 'quote')
                return _jsx("blockquote", { className: "h3", style: { borderLeft: '3px solid var(--azul)', paddingLeft: 16 }, children: inline(b.lines.join(' ')) }, i);
            return _jsx("p", { style: body, children: inline(b.lines.join(' ')) }, i);
        }) }));
}
