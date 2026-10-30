import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useI18n } from '../../i18n/I18nProvider';
import { Icon } from '../../components/Icon';
import { LogoTile } from './LogoTile';
const GROUNDS = [
    { key: 'white', style: { background: '#FFFFFF', border: '1px solid #E3E7F0' }, filter: undefined },
    { key: 'dark', style: { background: '#060D1E' }, filter: 'brightness(0) invert(1)' },
    { key: 'fog', style: { background: '#F4F6FB' }, filter: undefined },
    { key: 'mono', style: { background: '#FFFFFF', border: '1px solid #E3E7F0' }, filter: 'brightness(0)' },
];
/** Each logo shown on four grounds, as in the design's logo matrix. */
export function Logos({ logos }) {
    const { t } = useI18n();
    const rows = [
        [t('brand.logoPrimary'), logos?.primary],
        [t('brand.logoSecondary'), logos?.secondary],
        [t('brand.logoIcon'), logos?.icon],
    ].filter((r) => typeof r[1] === 'string' && r[1].startsWith('http'));
    // Variations are often full artworks with their own background: never recolored; the viewer switches the ground behind them.
    const variations = (logos?.variations ?? []).filter((v) => typeof v === 'string' && v.startsWith('http'));
    if (!rows.length && !variations.length)
        return null;
    return (_jsxs("div", { className: "col g24", children: [rows.length > 0 && _jsx("div", { className: "overflow-x-auto", children: _jsxs("div", { className: "vgrid min-w-[720px]", children: [_jsx("span", {}), GROUNDS.map((g) => _jsx("span", { className: "label", style: { textAlign: 'center' }, children: t(`brand.ground.${g.key}`) }, g.key)), rows.map(([label, url]) => (_jsx(Row, { label: label, url: url, downloadLabel: t('common.download') }, url)))] }) }), variations.length > 0 && (_jsxs("div", { className: "col g12", children: [_jsx("p", { className: "label", children: t('brand.logoVariations') }), _jsx("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5", children: variations.map((url, i) => _jsx(LogoTile, { url: url, label: `${t('brand.logoVariation')} ${i + 1}` }, url)) })] }))] }));
}
function Row({ label, url, downloadLabel }) {
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "col g4", style: { justifyContent: 'center' }, children: _jsx("span", { className: "w7", children: label }) }), GROUNDS.map((g) => (_jsxs("div", { className: "vcell", style: g.style, children: [_jsx("img", { src: url, alt: "", loading: "lazy", style: { filter: g.filter } }), _jsx("a", { className: "btn btn-ghost btn-icon btn-sm dl", href: url, target: "_blank", rel: "noreferrer", "aria-label": `${downloadLabel} ${label}`, style: { width: 36, background: g.key === 'dark' ? 'rgba(255,255,255,.14)' : undefined, color: g.key === 'dark' ? '#fff' : undefined }, children: _jsx(Icon, { name: "download", size: 16 }) })] }, g.key)))] }));
}
