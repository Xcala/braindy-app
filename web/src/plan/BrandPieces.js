import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { inkOn } from '../brands/identity/useCopy';
import { Featured, useL } from './HostingParts';
import { Explainer, useBrandKit } from './Explainer';
import './hosting.css';
const BRAINS = ['researcher', 'marketer', 'creator', 'builder'];
/**
 * Mi plan · Brand tab: on-brand piece design with the Brains, told visually. An animated loop of how one piece is made
 * (you ask, your brand loads, the Brains create, NickMark reviews, you receive it), examples drawn with this brand's own
 * logo, colors and type, and the price card (Braindy credits).
 */
export function BrandPieces({ brand }) {
    const { lang } = useI18n();
    const L = useL();
    const [cur, setCur] = useState(lang === 'es' ? 'cop' : 'usd');
    const kit = useBrandKit(brand);
    const steps = [
        [L(['Pides', 'You ask']), L(['En una frase, desde Pedidos.', 'In one sentence, from Requests.'])],
        [L(['Tu marca se carga', 'Your brand loads']), L(['Logo, colores, tipografía y tono.', 'Logo, colors, type and tone.'])],
        [L(['Los Brains crean', 'The Brains create']), L(['Investigan, escriben y diseñan.', 'They research, write and design.'])],
        [L(['NicoMarca revisa', 'NickMark reviews']), L(['Nada sale sin su visto bueno.', 'Nothing ships without his OK.'])],
        [L(['Lo recibes', 'You receive it']), L(['Listo para publicar.', 'Ready to publish.'])],
    ];
    return (_jsxs("div", { className: "col g32", children: [_jsx(Explainer, { label: L(['Diseño de piezas on-brand', 'On-brand piece design']), title: L(['Pides una pieza. ', 'Ask for a piece. ']), strong: L(['Sale con tu marca.', 'It comes out on-brand.']), lead: L(['Carruseles, posts, historias, videos e investigaciones hechos por los Brains con tu identidad ya cargada, y revisados por NicoMarca antes de llegar a ti.', 'Carousels, posts, stories, videos and research made by the Brains with your identity already loaded, and reviewed by NickMark before they reach you.']), stage: _jsx(Stage, { kit: kit, head: L(['Gran lanzamiento', 'Big launch']), ask: L(['Un carrusel para el lanzamiento', 'A carousel for the launch']), done: L(['Entregado', 'Delivered']) }), steps: steps }), _jsxs("section", { className: "col g16", "aria-labelledby": "bp-ex", children: [_jsxs("div", { className: "col g4", children: [_jsx("h2", { id: "bp-ex", className: "h3", children: L(['Así se verían con tu marca', 'How they would look with your brand']) }), _jsxs("p", { className: "t-sm t-mute", style: { margin: 0 }, children: [L(['Ejemplos dibujados con el logo y los colores de ', 'Examples drawn with the logo and colors of ']), brand.name, "."] })] }), _jsx(Examples, { kit: kit, L: L })] }), _jsxs("div", { className: "hp", children: [_jsxs("div", { className: "hp-bar", children: [_jsx("span", { className: "hp-eyebrow", children: L(['Cuánto cuesta', 'What it costs']) }), _jsx("div", { className: "hp-seg", role: "group", "aria-label": "Currency", children: ['usd', 'cop'].map((c) => _jsx("button", { type: "button", "aria-pressed": cur === c, onClick: () => setCur(c), children: c.toUpperCase() }, c)) })] }), _jsx(Featured, { cur: cur, brandName: brand.name })] })] }));
}
/** One piece being made, in a 10 s loop (CSS only; with reduced motion it rests on the finished piece). */
function Stage({ kit, head, ask, done }) {
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "bp-bubble", children: ask }), _jsxs("div", { className: "bp-card", style: { background: kit.c1, color: inkOn(kit.c1), fontFamily: kit.font ? `'${kit.font}', var(--f-text)` : undefined }, children: [_jsx("div", { className: "bp-skel" }), _jsxs("div", { className: "bp-fill", children: [kit.logo ? _jsx("img", { src: kit.logo, alt: "", className: "bp-logo" }) : _jsx("b", { className: "bp-logo-txt", children: kit.name }), _jsx("span", { className: "bp-head", children: head }), _jsx("span", { className: "bp-sub", style: { background: kit.c3, color: inkOn(kit.c3) }, children: "Nuevo \u00B7 New" }), _jsx("span", { className: "bp-bar", style: { background: kit.c2 } })] }), _jsx("span", { className: "bp-check", children: "\u2713" }), _jsx("span", { className: "bp-done", children: done })] }), _jsx("div", { className: "bp-swatches", children: [kit.c1, kit.c2, kit.c3].map((c, i) => _jsx("i", { style: { background: c } }, i)) }), _jsx("div", { className: "bp-brains", children: BRAINS.map((b) => _jsx("img", { src: `/brand/brains/${b}.png`, alt: "" }, b)) }), _jsx("img", { className: "bp-nico", src: "/brand/proposal/nicolas-face.jpg", alt: "" })] }));
}
function Examples({ kit, L }) {
    const ink1 = inkOn(kit.c1), ink2 = inkOn(kit.c2);
    const ff = kit.font ? `'${kit.font}', var(--f-text)` : undefined;
    const Logo = ({ dark }) => kit.logo
        ? _jsx("img", { src: kit.logo, alt: "", className: "bp-x-logo", style: dark ? { filter: 'brightness(0) invert(1)' } : undefined })
        : _jsx("b", { className: "t-xs", children: kit.name });
    const pieces = [
        { key: 'carousel', label: L(['Carrusel', 'Carousel']), note: L(['Instagram y LinkedIn', 'Instagram and LinkedIn']), art: (_jsx("div", { className: "bp-x bp-x-car", children: [kit.c2, kit.c3, kit.c1].map((bg, i) => (_jsx("div", { className: "bp-x-slide", style: { background: bg, color: inkOn(bg), fontFamily: ff, transform: `translate(${i * 14}px, ${i * -10}px)` }, children: i === 2 && _jsxs(_Fragment, { children: [_jsx(Logo, { dark: ink1 === '#FFFFFF' }), _jsx("b", { children: L(['5 claves de tu sector', '5 keys of your industry']) }), _jsx("small", { children: "1 / 5" })] }) }, i))) })) },
        { key: 'post', label: L(['Post', 'Post']), note: L(['Una imagen con mensaje', 'One image with a message']), art: (_jsxs("div", { className: "bp-x bp-x-post", style: { background: kit.c2, color: ink2, fontFamily: ff }, children: [_jsx("span", { className: "bp-x-blob", style: { background: kit.c1 } }), _jsx("b", { children: L(['Lo que tu cliente necesita oír', 'What your client needs to hear']) }), _jsx(Logo, { dark: ink2 === '#FFFFFF' })] })) },
        { key: 'story', label: L(['Historia o video', 'Story or video']), note: L(['Vertical, 9:16', 'Vertical, 9:16']), art: (_jsxs("div", { className: "bp-x bp-x-story", style: { background: `linear-gradient(160deg, ${kit.c1}, ${kit.c2})`, color: ink1, fontFamily: ff }, children: [_jsx("span", { className: "bp-x-play", children: "\u25B6" }), _jsx("b", { children: L(['Detrás de cámaras', 'Behind the scenes']) }), _jsx(Logo, { dark: ink1 === '#FFFFFF' })] })) },
        { key: 'research', label: L(['Investigación', 'Research']), note: L(['Mercado y competencia', 'Market and competitors']), art: (_jsxs("div", { className: "bp-x bp-x-doc", style: { fontFamily: ff }, children: [_jsx("span", { className: "bp-x-doc-top", style: { background: kit.c1 }, children: _jsx(Logo, { dark: ink1 === '#FFFFFF' }) }), _jsx("b", { children: L(['Mapa de mercado', 'Market map']) }), _jsx("span", { className: "bp-x-bars", children: [70, 45, 85, 30].map((w, i) => _jsx("i", { style: { width: `${w}%`, background: i % 2 ? kit.c3 : kit.c1 } }, i)) })] })) },
    ];
    return (_jsx("div", { className: "grid grid-cols-2 gap-4 lg:grid-cols-4", children: pieces.map((p) => (_jsxs("figure", { className: "bp-ex card", children: [_jsx("div", { className: "bp-ex-art", children: p.art }), _jsxs("figcaption", { className: "col", children: [_jsx("span", { className: "w7", children: p.label }), _jsx("span", { className: "t-xs t-mute", children: p.note })] })] }, p.key))) }));
}
