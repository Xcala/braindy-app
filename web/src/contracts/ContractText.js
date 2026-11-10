import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment } from 'react';
/** **bold** runs inside a line. */
const inline = (s) => s.split(/(\*\*[^*]+\*\*)/).filter(Boolean)
    .map((p, i) => (p.startsWith('**') ? _jsx("b", { children: p.slice(2, -2) }, i) : _jsx(Fragment, { children: p }, i)));
/** The contract text (markdown subset: ## headings, paragraphs, numbered items, tables). Blanks show as ________. */
export function ContractText({ text }) {
    const blocks = text.replace(/\r/g, '').split(/\n{2,}/);
    return (_jsx("article", { className: "col g12 t-sm", style: { lineHeight: 1.6, color: 'var(--ink)' }, children: blocks.map((block, i) => {
            const lines = block.split('\n').filter((l) => l.trim());
            if (!lines.length || lines[0].trim() === '---')
                return null;
            if (lines[0].startsWith('## ') || lines[0].startsWith('### ')) {
                return (_jsxs(Fragment, { children: [_jsx("h3", { className: "w9", style: { fontSize: 15, marginTop: 8 }, children: lines[0].replace(/^#+\s/, '') }), lines.slice(1).map((l, k) => _jsx("p", { children: inline(l) }, k))] }, i));
            }
            if (lines[0].startsWith('|')) {
                const rows = lines.filter((l) => !/^\|\s*-/.test(l)).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
                return (_jsx("div", { style: { overflowX: 'auto' }, children: _jsx("table", { className: "t-sm", style: { borderCollapse: 'collapse', width: '100%', minWidth: 420 }, children: _jsx("tbody", { children: rows.map((r, k) => (_jsx("tr", { children: r.map((c, j) => {
                                    const Cell = k === 0 ? 'th' : 'td';
                                    return _jsx(Cell, { style: { border: '1px solid #E3E7F0', padding: '6px 8px', textAlign: 'left', background: k === 0 ? '#F4F6FA' : undefined }, children: inline(c) }, j);
                                }) }, k))) }) }) }, i));
            }
            return _jsx("div", { className: "col g4", children: lines.map((l, k) => _jsx("p", { style: /^\d+\.\s/.test(l.trim()) ? { paddingLeft: 12 } : undefined, children: inline(l.trim()) }, k)) }, i);
        }) }));
}
