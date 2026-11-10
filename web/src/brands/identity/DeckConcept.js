import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Lightbox } from '../../components/Lightbox';
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
/** "Design concept" in My brand: the LogoDeck content that the identity sections did not show yet.
 *  On phones each slide is shown tall enough to read and swipes sideways; a tap opens it full screen. */
export function DeckConcept({ shots }) {
    const { t } = useI18n();
    const [open, setOpen] = useState(null);
    const name = (s) => t(s.kind === 'hero' ? 'brand.cover' : 'brand.concept');
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "dc-grid grid gap-5 md:grid-cols-2", children: shots.map((s, i) => (_jsxs("figure", { className: "card col", style: { padding: 0, overflow: 'hidden', margin: 0 }, children: [_jsx("div", { className: "dc-pan", children: _jsx("button", { type: "button", className: "dc-shot", onClick: () => setOpen(i), "aria-label": `${name(s)} · ${t('brand.tapToZoom')}`, children: _jsx("img", { src: s.url, alt: name(s), loading: "lazy", className: s.kind === 'hero' ? 'dc-img dc-cover' : 'dc-img' }) }) }), _jsxs("figcaption", { className: "dc-cap row between g8", style: { padding: '10px 16px 14px' }, children: [_jsxs("span", { className: "col g4", style: { minWidth: 0 }, children: [_jsx("span", { className: "label", children: name(s) }), s.caption && _jsx("span", { className: "t-sm t-mute", children: s.caption })] }), _jsxs("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => setOpen(i), children: ["\u2922 ", t('brand.tapToZoom')] })] })] }, s.url))) }), open !== null && _jsx(Lightbox, { items: shots.map((s) => ({ url: s.url, name: name(s) })), index: open, onIndex: setOpen, onClose: () => setOpen(null) })] }));
}
