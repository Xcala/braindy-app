import { jsx as _jsx } from "react/jsx-runtime";
const initials = (name) => name.replace(/^grupo\s+/i, 'G ').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
/** Round brand mark: the brand's logo when there is one, otherwise its initials. */
export function BrandMark({ brand }) {
    if (brand.logoUrl) {
        return _jsx("span", { className: "mark mark-img", children: _jsx("img", { src: brand.logoUrl, alt: "" }) });
    }
    return _jsx("span", { className: "mark", style: { background: 'var(--azul-press)' }, children: initials(brand.name) });
}
