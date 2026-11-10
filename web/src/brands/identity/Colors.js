import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Icon } from '../../components/Icon';
import { inkOn, isHex, rgb, useCopy } from './useCopy';
import { cmyk, nearestPantone } from './pantone';
const FIRST = 5;
export const brandColors = (colors) => {
    const valid = colors.filter((c) => isHex(c.hex));
    return valid.some((c) => c.chosen) ? valid.filter((c) => c.chosen) : valid;
};
export function Colors({ colors }) {
    const { t } = useI18n();
    const { copied, copy } = useCopy();
    const [all, setAll] = useState(false);
    const list = brandColors(colors);
    if (!list.length)
        return null;
    // One row first (the main colors); the rest on request, so the page stays short.
    const shown = all ? list : list.slice(0, FIRST);
    return (_jsxs("div", { className: "col g24", children: [_jsx("div", { className: "grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5", children: shown.map((c) => {
                    const hex = c.hex.toUpperCase();
                    return (_jsxs("div", { className: "card flex sm:block", style: { padding: 0, overflow: 'hidden' }, children: [_jsx("div", { className: "swatch w-[84px] flex-none sm:w-auto", style: { borderRadius: 0, height: 'auto', minHeight: 140, background: hex, borderBottom: inkOn(hex) === '#0B1220' ? '1px solid #E3E7F0' : undefined } }), _jsxs("div", { className: "col g8 min-w-0 grow p-3.5 sm:p-[18px]", children: [_jsx("span", { className: "h3", children: c.name ?? hex }), _jsxs("div", { className: "spec", children: [_jsx("span", { className: "k", children: "Hex" }), _jsx("span", { className: "mono", children: hex }), _jsxs("button", { className: "copybtn", onClick: () => copy(hex), "aria-label": `${t('common.copy')} ${hex}`, children: [_jsx(Icon, { name: copied === hex ? 'check' : 'copy', size: 14 }), copied === hex ? t('common.copied') : t('common.copy')] }), _jsx("span", { className: "k", children: "RGB" }), _jsx("span", { className: "mono", children: rgb(hex).join(' ') }), _jsx("span", {}), _jsx("span", { className: "k", children: "CMYK" }), _jsx("span", { className: "mono", children: cmyk(rgb(hex)).join(' ') }), _jsx("span", {}), _jsx("span", { className: "k", children: "PMS" }), c.pantone ? _jsx("span", { className: "mono", children: c.pantone })
                                                : _jsxs("span", { className: "mono", title: t('brand.pantoneApprox'), children: ["\u2248 ", nearestPantone(hex).replace(/^PANTONE /, '')] }), _jsx("span", {})] })] })] }, c.id ?? hex));
                }) }), list.length > FIRST && _jsx("button", { type: "button", className: "btn btn-secondary btn-sm self-start", onClick: () => setAll((a) => !a), children: all ? t('common.showLess') : t('common.showAll', { n: String(list.length) }) })] }));
}
