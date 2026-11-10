import { jsx as _jsx } from "react/jsx-runtime";
import { scanBlocks } from '../lib/scan';
import './scan.css';
/**
 * Any text written for people, shown to scan before reading: short headings, one point per line and the key of
 * each point in bold. `list` makes comma lists (rules, what to avoid) into points too; `points` splits every
 * paragraph of two or more sentences (otherwise only long ones).
 */
export function Scan({ text, list, points, className = 't-sm', tone = 'mute' }) {
    return (_jsx("div", { className: `scan scan-${tone} ${className}`, children: scanBlocks(text, { list, points }).map((b, i) => b.kind === 'head' ? _jsx("p", { className: "scan-head", children: bold(b.text) }, i)
            : b.kind === 'p' ? _jsx("p", { children: bold(b.text) }, i)
                : _jsx("ul", { className: "scan-list", children: b.items.map((x, j) => _jsx("li", { children: bold(x) }, j)) }, i)) }));
}
export const bold = (s) => s.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? _jsx("strong", { children: part }, i) : part));
