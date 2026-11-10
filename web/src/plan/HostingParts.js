import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useNicoWhatsApp } from '../lib/nicoWhatsApp';
import { COMBO, COMPARE, CREDITS, FINDER, PICKS, WEB_PLANS } from './hostingData';
export const useL = () => { const { lang } = useI18n(); return (x) => x[lang === 'es' ? 0 : 1]; };
export const fmt = (n, cur) => `$${(cur === 'usd' ? Math.round(n * 100) / 100 : Math.round(n / 100) * 100).toLocaleString('es-CO')}`;
const T = {
    ideal: ['Ideal para:', 'Best for:'], perMonth: ['/ mes', '/ month'], from: ['desde', 'from'], billedM: ['Facturado cada mes', 'Billed every month'],
    year: ['al año · ', 'a year · '], save: ['ahorras ', 'you save '], yours: ['Tu plan actual', 'Your current plan'],
    what: ['¿Qué es', 'What is'],
    pick: ['Te recomendamos', 'We recommend'], start: ['Empezar por WhatsApp', 'Start on WhatsApp'], yes: ['Sí', 'Yes'], no: ['No', 'No'],
};
/** One plan card, as on the pricing page: dot, name, ideal for, price with the yearly saving, features, specs and the action. */
export function Plan({ p, cur, bill, mine, children }) {
    const L = useL();
    const base = p.price[cur], yearly = base * 10;
    return (_jsxs("article", { className: `hp-plan${p.top ? ' top' : ''}${mine ? ' mine' : ''}`, style: { '--c': p.color }, children: [p.badge && _jsx("span", { className: "hp-badge", children: L(p.badge) }), _jsxs("div", { className: "hp-head", children: [mine && _jsx("span", { className: "hp-mine", children: L(T.yours) }), _jsxs("div", { className: "hp-name", children: [_jsx("span", { className: "hp-dot", "aria-hidden": true }), _jsx("h3", { children: p.name })] }), _jsxs("p", { className: "hp-ideal", children: [_jsx("b", { children: L(T.ideal) }), " ", L(p.ideal)] })] }), _jsxs("div", { className: "hp-price", children: [_jsxs("div", { className: "hp-price-main", children: [p.id === 'medida' && _jsx("span", { className: "hp-per", children: L(T.from) }), _jsx("span", { className: "hp-amount", children: fmt(bill === 'm' ? base : yearly / 12, cur) }), _jsx("span", { className: "hp-cur", children: cur.toUpperCase() }), _jsx("span", { className: "hp-per", children: L(T.perMonth) })] }), _jsx("p", { className: "hp-note", children: bill === 'm' ? L(T.billedM) : _jsxs(_Fragment, { children: [fmt(yearly, cur), " ", L(T.year), _jsxs("b", { children: [L(T.save), fmt(base * 2, cur)] })] }) })] }), p.lead && _jsx("p", { className: "hp-inherits", children: L(p.lead) }), _jsx("ul", { className: "hp-key", children: p.features.map((f, i) => (_jsxs("li", { children: [_jsx("b", { children: L(f.b) }), f.rest && L(f.rest), f.term && _jsxs(_Fragment, { children: [" ", _jsx(TermLink, { t: f.term })] }), f.small && _jsx("small", { children: L(f.small) })] }, i))) }), _jsx("dl", { className: "hp-specs", children: p.specs.map(([k, v], i) => _jsxs("div", { children: [_jsx("dt", { children: L(k) }), _jsx("dd", { children: L(v) })] }, i)) }), children] }));
}
/** "Which one fits me?": four yes/no questions and the plan they point to. */
export function Finder({ brandName }) {
    const L = useL();
    const wa = useNicoWhatsApp();
    const [a, setA] = useState({ pages: false, team: false, chat: false, app: false });
    const key = a.app ? 'ent' : a.chat ? 'ultra' : a.pages || a.team ? 'pro' : 'esencial';
    return (_jsxs("section", { children: [_jsxs("h2", { children: [L(['¿Cuál ', 'Which one ']), _jsx("b", { children: L(['me sirve?', 'fits me?']) })] }), _jsxs("div", { className: "hp-finder", children: [_jsx("div", { children: FINDER.map((q) => (_jsxs("div", { className: "hp-q", children: [_jsx("p", { children: L(q.q) }), _jsx("div", { className: "hp-seg", children: [true, false].map((v) => _jsx("button", { type: "button", "aria-pressed": a[q.id] === v, onClick: () => setA({ ...a, [q.id]: v }), children: L(v ? T.yes : T.no) }, String(v))) })] }, q.id))) }), _jsxs("div", { className: "hp-result", "aria-live": "polite", children: [_jsx("span", { className: "hp-eyebrow", children: L(T.pick) }), _jsx("span", { className: "hp-r-name", children: PICKS[key].name }), _jsx("p", { children: L(PICKS[key].why) }), _jsx("a", { className: "hp-btn primary", href: wa(`${PICKS[key].name} · ${brandName}`), target: "_blank", rel: "noreferrer", children: L(T.start) })] })] })] }));
}
/** The three web plans side by side; the current one is shaded. */
export function Compare({ current }) {
    const L = useL();
    const hi = current ?? 'ultra';
    return (_jsxs("section", { children: [_jsxs("h2", { children: [L(['Compara ', 'Compare ']), _jsx("b", { children: L(['los tres planes', 'the three plans']) })] }), _jsx("div", { className: "hp-table", children: _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col" }), WEB_PLANS.map((p) => _jsx("th", { scope: "col", className: p.id === hi ? 'hp-us' : undefined, children: p.name }, p.id))] }) }), COMPARE.map((g) => (_jsxs("tbody", { children: [_jsx("tr", { className: "hp-group", children: _jsx("th", { colSpan: 4, scope: "colgroup", children: L(g.group) }) }), g.rows.map(([label, ...cells]) => (_jsxs("tr", { children: [_jsx("th", { scope: "row", children: L(label) }), cells.map((c, i) => _jsx("td", { className: [WEB_PLANS[i].id === hi && 'hp-us', c[0] === '✓' && 'hp-ok', c[0] === '–' && 'hp-no'].filter(Boolean).join(' ') || undefined, children: L(c) }, i))] }, label[0])))] }, g.group[0])))] }) }), _jsx("p", { className: "hp-small", children: L(['Soporte técnico en todos los planes: caídas, errores del sitio o del editor, certificado HTTPS, dominio y actualizaciones de seguridad. Por WhatsApp, correo o solicitud en Braindy App, de lunes a viernes de 8:00 a 18:00, hora Colombia. Los cambios de contenido los hace tu equipo.', 'Technical support on every plan: outages, site or editor errors, HTTPS certificate, domain and security updates. By WhatsApp, email or a request in Braindy App, Monday to Friday 8:00–18:00 Colombia time. Content changes are made by your team.']) })] }));
}
/** Add-on or module cards: name, monthly price, what it does and the fine print. */
export function PriceCards({ title, lead, items, cur, plus, two, children }) {
    const L = useL();
    return (_jsxs("section", { className: children ? 'hp-addons' : undefined, children: [_jsxs("h2", { children: [L(title[0]), _jsx("b", { children: L(title[1]) })] }), _jsx("p", { className: "hp-lead", children: L(lead) }), children, _jsx("div", { className: `hp-grid3${two ? ' two' : ''}`, children: items.map((x) => (_jsxs("article", { className: "hp-card", children: [x.for && _jsx("span", { className: "hp-where", children: x.for }), _jsxs("div", { className: "hp-card-top", children: [_jsx("h3", { children: L(x.name) }), _jsxs("span", { className: "hp-m-price", children: [plus ? '+' : '', fmt(x.price[cur], cur), " ", _jsxs("span", { children: [cur.toUpperCase(), " ", L(T.perMonth)] })] })] }), _jsx("p", { children: L(x.body) }), x.note && _jsx("p", { className: "hp-extra", children: L(x.note) })] }, x.name[0]))) })] }));
}
const TERM_NAME = { mcp: 'MCP', cms: 'CMS', pwa: 'PWA', sla: 'SLA', dkim: 'SPF/DKIM', transfer: '', https: 'HTTPS', dns: 'DNS' };
/** "¿Qué es MCP?": opens that term in the glossary below and scrolls to it. */
export function TermLink({ t }) {
    const L = useL();
    const open = (e) => {
        e.preventDefault();
        const d = document.getElementById(`hp-t-${t}`);
        if (!d)
            return;
        d.open = true;
        d.classList.add('hit');
        d.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(() => d.classList.remove('hit'), 2400);
    };
    return _jsxs("a", { href: `#hp-t-${t}`, onClick: open, children: [L(T.what), " ", TERM_NAME[t], "?"] });
}
/** Featured add-on: on-brand pieces made by the Brains with the brand loaded, reviewed by NicoMarca. */
export function Featured({ cur, brandName }) {
    const L = useL();
    const wa = useNicoWhatsApp();
    return (_jsxs("article", { className: "hp-feature", children: [_jsxs("div", { className: "hp-feature-main", children: [_jsx("span", { className: "hp-tag", children: L(['Créditos Braindy · con los Brains', 'Braindy credits · with the Brains']) }), _jsxs("h3", { children: [L(['Diseño de piezas ', 'Design of ']), _jsx("b", { children: L(['on-brand', 'on-brand pieces']) })] }), _jsx("span", { className: "hp-sub", children: L(['Créditos Braindy · 300 créditos al mes', 'Braindy credits · 300 credits a month']) }), _jsxs("p", { children: [L(['Pídele a los ', 'Ask the ']), "Br", _jsx("b", { children: "ai" }), "ns", L([' carruseles, imágenes, videos, investigaciones y planes de marketing. Todo sale con tu logo, tus colores y tu tono ya cargados, y NicoMarca revisa cada pieza antes de entregarla. Ves el costo de cada pedido antes de confirmar.', ' for carousels, images, videos, research and marketing plans. Everything comes out with your logo, colors and tone already loaded, and NickMark reviews every piece before delivering it. You see the cost of each order before confirming.'])] })] }), _jsxs("div", { className: "hp-feature-side", children: [_jsxs("div", { className: "hp-f-price", children: [_jsxs("span", { className: "hp-f-amount", children: ["+", fmt(CREDITS[cur], cur), " ", cur.toUpperCase()] }), " ", _jsx("span", { children: L(T.perMonth) })] }), _jsxs("ul", { className: "hp-key", children: [_jsxs("li", { children: [_jsx("b", { children: L(['Unos 7 carruseles', 'About 7 carousels']) }), L([' al mes', ' a month'])] }), _jsxs("li", { children: [L(['O ', 'Or ']), _jsx("b", { children: L(['2 videos de marca', '2 brand videos']) }), L([' y 60 imágenes', ' and 60 images'])] }), _jsxs("li", { children: [L(['O un ', 'Or a ']), _jsx("b", { children: "brand research" }), L([' y un plan de marketing', ' and a marketing plan'])] })] }), _jsxs("p", { className: "hp-fine", children: [L(['También hay planes de 1.000 y 3.000 créditos. Ultra + 300 créditos juntos: ', 'There are also 1,000 and 3,000 credit plans. Ultra + 300 credits together: ']), _jsxs("b", { children: [fmt(COMBO[cur], cur), " ", cur.toUpperCase()] }), L([' al mes.', ' a month.'])] }), _jsx("a", { className: "hp-btn primary", href: wa(`Créditos Braindy (piezas on-brand) · ${brandName}`), target: "_blank", rel: "noreferrer", children: L(['Quiero piezas on-brand', 'I want on-brand pieces']) })] })] }));
}
