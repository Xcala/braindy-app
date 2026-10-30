import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../../i18n/I18nProvider';
/** The images that only lived in the LogoDeck (brand cover and design concept), without duplicates. */
export function deckShots(assets) {
    const seen = new Set();
    const out = [];
    for (const a of assets.filter((x) => x.type === 'logodeck')) {
        for (const s of a.data?.sections ?? []) {
            if (s.visible === false || !s.imageUrl || seen.has(s.imageUrl))
                continue;
            if (s.type !== 'hero' && s.type !== 'design-concept')
                continue;
            seen.add(s.imageUrl);
            out.push({ url: s.imageUrl, kind: s.type, caption: s.type === 'hero' ? a.data?.heroSubtitle : undefined });
        }
    }
    return out.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'design-concept' ? -1 : 1));
}
/** "Design concept" in My brand: the LogoDeck content that the identity sections did not show yet. */
export function DeckConcept({ shots }) {
    const { t } = useI18n();
    return (_jsx("div", { className: "grid gap-5 md:grid-cols-2", children: shots.map((s) => (_jsxs("figure", { className: "card col g8", style: { padding: 0, overflow: 'hidden', margin: 0 }, children: [_jsx("img", { src: s.url, alt: t(s.kind === 'hero' ? 'brand.cover' : 'brand.concept'), loading: "lazy", style: { width: '100%', aspectRatio: '16 / 9', objectFit: s.kind === 'hero' ? 'cover' : 'contain', background: '#fff', display: 'block' } }), _jsxs("figcaption", { className: "col g4", style: { padding: '10px 16px 14px' }, children: [_jsx("span", { className: "label", children: t(s.kind === 'hero' ? 'brand.cover' : 'brand.concept') }), s.caption && _jsx("span", { className: "t-sm t-mute", children: s.caption })] })] }, s.url))) }));
}
