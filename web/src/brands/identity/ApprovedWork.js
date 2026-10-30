import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ApprovedWork({ items }) {
    const valid = items.filter((i) => typeof i.url === 'string' && i.url.startsWith('http'));
    const list = (valid.some((i) => i.chosen) ? valid.filter((i) => i.chosen) : valid).slice(0, 8);
    if (!list.length)
        return null;
    return (_jsx("div", { className: "grid gap-5 sm:grid-cols-2 lg:grid-cols-4", children: list.map((i) => (_jsxs("a", { className: "tile", href: i.url, target: "_blank", rel: "noreferrer", children: [_jsx("div", { className: "thumb", style: { height: 240, overflow: 'hidden' }, children: _jsx("img", { className: "cover h-full w-full object-cover", src: i.url, alt: "", loading: "lazy" }) }), i.name && _jsx("div", { className: "tile-meta", children: _jsx("span", { className: "tile-name", children: i.name }) })] }, i.id ?? i.url))) }));
}
