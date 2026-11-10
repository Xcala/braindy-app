import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLayoutEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { ADDONS, CHECKOUT, ENTERPRISE, MODULES, WEB_PLANS } from './hostingData';
import { Compare, Finder, Plan, PriceCards, useL } from './HostingParts';
import { Faq, Glossary, Sign, Tech } from './HostingInfo';
import { useNicoWhatsApp } from '../lib/nicoWhatsApp';
import './hosting.css';
const STEP = 72;
/** Staircase, as on the pricing page: on desktop each card is at least STEP px taller than the one before. */
function useLadder(dep) {
    const ref = useRef(null);
    useLayoutEffect(() => {
        const fit = () => ref.current?.querySelectorAll('.hp-plans').forEach((group) => {
            const cards = [...group.querySelectorAll('.hp-plan')];
            cards.forEach((c) => c.style.removeProperty('--h'));
            if (window.innerWidth <= 900)
                return;
            let prev = 0;
            cards.forEach((c, i) => { const h = i === 0 ? c.offsetHeight : Math.max(c.offsetHeight, prev + STEP); c.style.setProperty('--h', `${h}px`); prev = h; });
        });
        fit();
        void document.fonts?.ready.then(fit);
        window.addEventListener('resize', fit);
        return () => window.removeEventListener('resize', fit);
    }, [dep]);
    return ref;
}
/** In Mi plan · The website hosting offer with the pricing page's design: Sitios web and Enterprise tabs, currency and billing
 *  toggles, plan cards (the brand's current plan marked), plan finder, comparison, add-ons, agency note and modules. */
export function HostingPlans({ current, brandName }) {
    const { lang } = useI18n();
    const L = useL();
    const wa = useNicoWhatsApp();
    const [tab, setTab] = useState('web');
    const [cur, setCur] = useState(lang === 'es' ? 'cop' : 'usd');
    const [bill, setBill] = useState('m');
    // The plans stay in view; add-ons, the comparison and the questions open on request so Mi plan stays short.
    const [more, setMore] = useState(false);
    const moreBtn = (_jsx("button", { type: "button", className: "btn btn-secondary btn-sm", style: { alignSelf: 'center' }, "aria-expanded": more, onClick: () => setMore((m) => !m), children: more ? L(['Ver menos', 'See less']) : L(['Ver complementos, comparación y preguntas', 'See add-ons, comparison and questions']) }));
    const ref = useLadder(`${tab}${cur}${bill}${lang}`);
    return (_jsxs("div", { ref: ref, className: "hp", "aria-labelledby": "hp-title", children: [_jsxs("header", { className: "hp-hero", children: [_jsx("span", { className: "hp-eyebrow", children: L(['Braindy · Planes de sitio web y Enterprise', 'Braindy · Website and Enterprise plans']) }), _jsxs("h2", { id: "hp-title", children: [_jsx("span", { children: L(['Tu sitio, ', 'Your site, ']) }), _jsx("b", { children: L(['en tus manos', 'in your hands']) })] }), _jsxs("p", { children: [L(['Diseñamos y publicamos tu sitio. Después, ', 'We design and publish your site. Then ']), _jsx("b", { children: L(['tu equipo lo edita por su cuenta', 'your team edits it on its own']) }), L([', sin código, y nosotros nos encargamos de que siempre esté en línea, rápido y seguro.', ', no code, and we keep it always online, fast and secure.'])] })] }), _jsxs("div", { className: "hp-bar", children: [_jsx("div", { className: "hp-seg hp-tabs", role: "tablist", children: ['web', 'ent'].map((k) => _jsx("button", { type: "button", role: "tab", "aria-selected": tab === k, onClick: () => setTab(k), children: k === 'web' ? L(['Sitios web', 'Websites']) : 'Enterprise' }, k)) }), _jsxs("div", { className: "hp-toggles", children: [_jsx("div", { className: "hp-seg", role: "group", "aria-label": "Currency", children: ['usd', 'cop'].map((c) => _jsx("button", { type: "button", "aria-pressed": cur === c, onClick: () => setCur(c), children: c.toUpperCase() }, c)) }), _jsxs("div", { className: "hp-seg", role: "group", "aria-label": "Billing", children: [_jsx("button", { type: "button", "aria-pressed": bill === 'm', onClick: () => setBill('m'), children: L(['Mensual', 'Monthly']) }), _jsxs("button", { type: "button", "aria-pressed": bill === 'y', onClick: () => setBill('y'), children: [L(['Anual', 'Yearly']), " ", _jsx("span", { className: "hp-save", children: L(['2 meses gratis', '2 months free']) })] })] })] })] }), tab === 'web' ? (_jsxs("div", { className: "hp-panel", role: "tabpanel", children: [_jsx("div", { className: "hp-plans", children: WEB_PLANS.map((p) => (_jsx(Plan, { p: p, cur: cur, bill: bill, mine: current === p.id, children: current !== p.id && (_jsxs("div", { className: "hp-buy", children: [_jsx("a", { className: `hp-btn${p.top ? ' primary' : ''}`, href: `${CHECKOUT}?plan=${p.id}&cur=${cur}&bill=${bill}`, target: "_blank", rel: "noreferrer", children: current ? L(['Cambiar a este plan', 'Switch to this plan']) : L(['Quiero este plan', 'I want this plan']) }), _jsx("a", { className: "hp-alt", href: wa(`Hosting ${p.name} · ${brandName}`), target: "_blank", rel: "noreferrer", children: L(['o escríbenos por WhatsApp', 'or write us on WhatsApp']) })] })) }, p.id))) }), moreBtn, more && _jsxs(_Fragment, { children: [_jsx(PriceCards, { title: [['Complementos ', 'Add-ons '], ['para cualquier plan', 'for any plan']], lead: ['Agrégalos cuando los necesites y quítalos cuando quieras. Se suman al valor mensual de tu plan.', 'Add them when you need them and remove them anytime. They add to your monthly plan.'], items: ADDONS, cur: cur, plus: true, two: true }), _jsx(Finder, { brandName: brandName }), _jsx(Compare, { current: current }), _jsxs("aside", { className: "hp-agency", "aria-label": "Fee", children: [_jsxs("h3", { children: [L(['¿Ya tienes ', 'Already have a ']), _jsx("b", { children: L(['fee mensual de agencia', 'monthly agency fee']) }), L([' con Braindy?', ' with Braindy?'])] }), _jsxs("p", { children: [L(['Entonces ', 'Then ']), _jsx("b", { children: L(['nosotros nos encargamos de todo', 'we take care of everything']) }), L([': diseño, montaje, páginas nuevas y cambios de contenido, dentro de tu fee. El plan de hosting se paga aparte del fee: cubre que el sitio esté en línea, rápido y seguro, sin importar quién edite.', ': design, build, new pages and content changes, within your fee. Hosting is paid apart from the fee: it keeps the site online, fast and secure, no matter who edits.'])] })] })] })] })) : (_jsxs("div", { className: "hp-panel", role: "tabpanel", children: [_jsxs("header", { className: "hp-hero", children: [_jsx("span", { className: "hp-eyebrow", children: L(['Enterprise · Apps, dashboards y plataformas', 'Enterprise · Apps, dashboards and platforms']) }), _jsxs("h2", { children: [L(['Cuando tu sitio ', 'When your site ']), _jsx("b", { children: L(['se vuelve una app', 'becomes an app']) })] }), _jsxs("p", { children: [L(['Para medios digitales con mucho tráfico, áreas privadas con login, onboarding de clientes, emailing, dashboards y apps. Cada plan corre en un ', 'For high-traffic media, private areas with login, client onboarding, emailing, dashboards and apps. Each plan runs in its ']), _jsx("b", { children: L(['proyecto de Google Cloud propio', 'own Google Cloud project']) }), L([', separado de los demás clientes.', ', apart from other clients.'])] })] }), _jsx("div", { className: "hp-plans", children: ENTERPRISE.map((p) => (_jsx(Plan, { p: p, cur: cur, bill: bill, children: _jsx("a", { className: "hp-btn primary", href: wa(`Enterprise ${p.name} · ${brandName}`), target: "_blank", rel: "noreferrer", children: L(['Agenda una llamada', 'Book a call']) }) }, p.id))) }), moreBtn, more && _jsx(PriceCards, { title: [['Módulos ', 'Development '], ['de desarrollo', 'modules']], lead: ['Se suman a cualquier plan Enterprise. El valor mensual cubre operación, infraestructura y soporte del módulo. El desarrollo inicial se cotiza una vez, según lo que necesites.', 'They add to any Enterprise plan. The monthly fee covers the module’s operation, infrastructure and support. The initial build is quoted once, based on what you need.'], items: MODULES, cur: cur })] })), more && _jsxs(_Fragment, { children: [_jsx(Glossary, {}), _jsx(Faq, {}), _jsx(Tech, {})] }), _jsx(Sign, {})] }));
}
