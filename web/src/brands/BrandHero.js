import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useBrands } from './BrandProvider';
import { isHex } from './identity/useCopy';
/** Hero from the design: dark field tinted with the brand's own primary color. */
export function BrandHero({ brand, logo, essence, tags, accent }) {
    const { t } = useI18n();
    const { brands, select } = useBrands();
    const tint = isHex(accent) ? accent : '#2F4DE0';
    const parent = brand.groupId ? brands.find((b) => b.id === brand.groupId) : undefined;
    return (_jsxs("section", { className: "relative flex flex-wrap items-end justify-between gap-8 overflow-hidden p-8 text-white sm:p-14", style: { borderRadius: 28, background: `radial-gradient(40% 70% at 88% 20%, ${tint}8C, transparent 70%), radial-gradient(30% 60% at 10% 110%, ${tint}59, transparent 70%), #060D1E` }, children: [_jsxs("div", { className: "col g24", style: { maxWidth: 760 }, children: [_jsxs("div", { className: "row g8 wrap", children: [_jsx("p", { className: "label", style: { color: '#C9D0DE' }, children: t('brand.heroLabel') }), brand.kind === 'group' && _jsx("span", { className: "chip c-group", children: t('brand.group') }), brand.status === 'archived' && _jsx("span", { className: "chip c-archived", children: t('status.archived') })] }), logo ? (_jsx("img", { src: logo, alt: brand.name, style: { height: 56, width: 'auto', maxWidth: 320, alignSelf: 'flex-start', objectFit: 'contain', filter: 'brightness(0) invert(1)' } })) : (_jsx("h1", { className: "d-lg", style: { color: '#fff' }, children: _jsxs("span", { className: "w9", children: [brand.name, "."] }) })), essence && _jsx("p", { className: "d-lg", style: { fontSize: 28, lineHeight: '36px', color: '#fff' }, children: essence }), _jsxs("div", { className: "row g12 wrap", children: [parent && (_jsx("button", { onClick: () => select(parent.id), className: "chip chip-plain glass-clear", style: { color: '#fff', cursor: 'pointer' }, children: t('brand.inGroup', { name: parent.name }) })), tags.map((tag) => _jsx("span", { className: "chip chip-plain glass-clear", style: { color: '#fff' }, children: tag }, tag))] })] }), _jsx("div", { className: "col g12 flex-none", children: _jsxs(Link, { className: "btn btn-white", to: "/assets", children: [_jsx(Icon, { name: "folder" }), t('brand.openFiles')] }) })] }));
}
