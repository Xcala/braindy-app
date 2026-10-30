import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
const COVERS = {
    logodeck: 'radial-gradient(120% 90% at 85% 0%, rgba(42,127,255,.9), transparent 55%), radial-gradient(90% 80% at 0% 100%, rgba(167,139,250,.75), transparent 60%), #1F3596',
    marketmap: 'radial-gradient(100% 90% at 100% 0%, rgba(245,179,1,.35), transparent 55%), #060D1E',
    file: 'linear-gradient(60deg, #0B1220, #1F3596)',
};
/** "Brand documents" from the design: LogoDecks, MarketMaps and documents carried over from the old apps. */
export function BrandDocs({ assets, title }) {
    const { t } = useI18n();
    if (!assets.length)
        return null;
    const order = ['logodeck', 'marketmap', 'file'];
    const list = [...assets].sort((a, b) => order.indexOf(a.type ?? '') - order.indexOf(b.type ?? '') || String(a.title).localeCompare(String(b.title)));
    return (_jsxs("section", { className: "col g16", "aria-labelledby": "docs", children: [_jsxs("div", { className: "row between wrap g8", children: [_jsx("h2", { className: "h3", id: "docs", children: title ?? t('assets.docs') }), !title && _jsx("span", { className: "t-sm t-mute", children: t('assets.docsSub') })] }), _jsx("div", { className: "grid gap-5 sm:grid-cols-2 lg:grid-cols-4", children: list.map((a) => {
                    const kind = a.type === 'logodeck' ? 'LogoDeck' : a.type === 'marketmap' ? 'MarketMap' : t('assets.document');
                    const Tag = a.url ? 'a' : 'div';
                    return (_jsxs(Tag, { className: "deck", ...(a.url ? { href: a.url, target: '_blank', rel: 'noreferrer' } : {}), children: [_jsx("div", { className: "cover", style: { background: COVERS[a.type ?? 'file'] ?? COVERS.file, color: '#fff' }, children: a.data?.coverImageUrl ? _jsx("img", { className: "bg", src: a.data.coverImageUrl, alt: "", loading: "lazy" }) : _jsx(Icon, { name: "file", size: 34 }) }), _jsxs("div", { className: "body", children: [_jsxs("div", { className: "row between g8", children: [_jsx("span", { className: `kind ${a.type === 'marketmap' ? 'kind-marketmap' : a.type === 'logodeck' ? 'kind-logodeck' : 'kind-manual'}`, children: kind }), _jsx("span", { className: `chip ${a.status === 'published' ? 'c-approved' : 'c-draft'}`, children: a.status === 'published' ? t('assets.published') : t('assets.draft') })] }), _jsx("span", { className: "h3", children: a.title }), a.data?.description && _jsx("p", { className: "t-sm t-mute line-clamp-2", children: a.data.description }), a.url && _jsxs("span", { className: "t-sm w7", style: { color: 'var(--azul)' }, children: [t('common.open'), " \u2197"] })] })] }, a.id));
                }) })] }));
}
