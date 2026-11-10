import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function SectionHead({ id, num, title, subtitle, children }) {
    return (_jsxs("div", { className: "sec-head flex-wrap", children: [_jsxs("div", { className: "col g8", children: [_jsx("span", { className: "sec-num", children: String(num).padStart(2, '0') }), _jsx("h2", { className: "h2", id: `h-${id}`, children: title }), subtitle && _jsx("p", { className: "t-mute", children: subtitle })] }), children && _jsx("div", { className: "row g8 wrap", children: children })] }));
}
