import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { BrandDocs } from '../assets/BrandDocs';
import { useLegacyAssets } from '../assets/useLegacyAssets';
import { LinkGrid } from '../links/LinkGrid';
import { useBrandLinks } from '../links/useBrandLinks';
/** My research: market maps carried over from the old apps plus studies NickMark publishes as links. */
export function MyResearch() {
    const { current } = useBrands();
    const { t } = useI18n();
    const { links, loading } = useBrandLinks(current?.id, 'research');
    const maps = useLegacyAssets(current?.id).filter((a) => a.type === 'marketmap')
        .map((a) => ({ ...a, url: a.url ?? a.data?.htmlFiles?.find((f) => f.isMain)?.downloadUrl ?? a.data?.htmlFiles?.[0]?.downloadUrl ?? null }));
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    return (_jsxs("div", { className: "col g32", children: [_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", children: current.name }), _jsxs("h1", { className: "h1", children: [_jsxs("span", { className: "w9", children: [t('nav.research'), "."] }), " ", t('research.tagline')] })] }), !loading && links.length === 0 && maps.length === 0 && _jsx("div", { className: "card t-mute", children: t('research.empty') }), _jsx(BrandDocs, { assets: maps, title: t('research.marketmaps') }), _jsxs("section", { className: "col g16", children: [(links.length > 0 || maps.length > 0) && _jsx("h2", { className: "h3", children: t('research.studies') }), _jsx(LinkGrid, { brandId: current.id, section: "research", links: links })] })] }));
}
