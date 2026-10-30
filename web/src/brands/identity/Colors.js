import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useI18n } from '../../i18n/I18nProvider';
import { Icon } from '../../components/Icon';
import { inkOn, isHex, rgb, useCopy } from './useCopy';
export const brandColors = (colors) => {
    const valid = colors.filter((c) => isHex(c.hex));
    return valid.some((c) => c.chosen) ? valid.filter((c) => c.chosen) : valid;
};
export function Colors({ colors }) {
    const { t } = useI18n();
    const { copied, copy } = useCopy();
    const list = brandColors(colors);
    if (!list.length)
        return null;
    return (_jsx("div", { className: "col g24", children: _jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5", children: list.map((c) => {
                const hex = c.hex.toUpperCase();
                return (_jsxs("div", { className: "card", style: { padding: 0, overflow: 'hidden' }, children: [_jsx("div", { className: "swatch", style: { borderRadius: 0, height: 140, background: hex, borderBottom: inkOn(hex) === '#0B1220' ? '1px solid #E3E7F0' : undefined } }), _jsxs("div", { className: "col g8", style: { padding: 18 }, children: [_jsx("span", { className: "h3", children: c.name ?? hex }), _jsxs("div", { className: "spec", children: [_jsx("span", { className: "k", children: "Hex" }), _jsx("span", { className: "mono", children: hex }), _jsxs("button", { className: "copybtn", onClick: () => copy(hex), "aria-label": `${t('common.copy')} ${hex}`, children: [_jsx(Icon, { name: copied === hex ? 'check' : 'copy', size: 14 }), copied === hex ? t('common.copied') : t('common.copy')] }), _jsx("span", { className: "k", children: "RGB" }), _jsx("span", { className: "mono", children: rgb(hex).join(' ') }), _jsx("span", {}), c.pantone && _jsxs(_Fragment, { children: [_jsx("span", { className: "k", children: "PMS" }), _jsx("span", { className: "mono", children: c.pantone }), _jsx("span", {})] })] })] })] }, c.id ?? hex));
            }) }) }));
}
