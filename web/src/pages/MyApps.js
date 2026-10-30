import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { LinkGrid } from '../links/LinkGrid';
import { useBrandLinks } from '../links/useBrandLinks';
import { SiteChanges } from '../links/SiteChanges';
/** My apps: the brand's website and the web apps built for it, each one a link that opens in a new tab. */
export function MyApps() {
    const { current } = useBrands();
    const { t } = useI18n();
    const { links, loading } = useBrandLinks(current?.id, 'apps');
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    return (_jsxs("div", { className: "col g32", children: [_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", children: current.name }), _jsxs("h1", { className: "h1", children: [_jsxs("span", { className: "w9", children: [t('nav.apps'), "."] }), " ", t('apps.tagline')] })] }), _jsx(LinkGrid, { brandId: current.id, section: "apps", links: links }), !loading && links.length === 0 && _jsx("div", { className: "card t-mute", children: t('apps.empty') }), _jsx(SiteChanges, { brandId: current.id })] }));
}
