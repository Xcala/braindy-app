import { studioNow } from './officeHours';
/** What each seat works on when no client is waiting: Braindy itself and Revista Level. Nobody in the studio is ever idle. */
const INTERNAL = {
    nico: [
        { es: 'Estrategia de Braindy', en: 'Braindy strategy' },
        { es: 'Revista Level · edición del mes', en: 'Revista Level · this month’s issue' },
        { es: 'Revisando y ajustando el trabajo de sus Brains', en: 'Reviewing and adjusting his Brains’ work' },
        { es: 'Revista Level · portada', en: 'Revista Level · cover' },
        { es: 'Codificando la app de Braindy', en: 'Coding the Braindy app' },
        { es: 'Creando un conector MCP para Braindy', en: 'Building an MCP connector for Braindy' },
    ],
    researcher: [
        { es: 'Tendencias para Revista Level', en: 'Trends for Revista Level' },
        { es: 'Investigación de mercado de Braindy', en: 'Braindy market research' },
        { es: 'Métricas de lectores de Revista Level', en: 'Revista Level reader metrics' },
    ],
    marketer: [
        { es: 'Contenidos de Braindy', en: 'Braindy content' },
        { es: 'Redes de Revista Level', en: 'Revista Level social media' },
        { es: 'Calendario editorial de Revista Level', en: 'Revista Level editorial calendar' },
    ],
    creator: [
        { es: 'Piezas de Revista Level', en: 'Revista Level visuals' },
        { es: 'Identidad de Braindy', en: 'Braindy identity' },
        { es: 'Motion para Revista Level', en: 'Motion for Revista Level' },
    ],
    builder: [
        { es: 'App de Braindy', en: 'Braindy app' },
        { es: 'Sitio de Revista Level', en: 'Revista Level website' },
        { es: 'Automatizaciones de Braindy', en: 'Braindy automations' },
    ],
};
const STEP = 180e3; // a new internal task every 3 minutes
/** The internal tasks of a seat, starting with the current one. */
export function internalWork(id, lang, d = studioNow()) {
    const list = INTERNAL[id].map((x) => (lang === 'es' ? x.es : x.en));
    const i = Math.floor(d.getTime() / STEP) % list.length;
    return [...list.slice(i), ...list.slice(0, i)];
}
/** On a client's home the team, when free, keeps working on that client's brand (never on others). */
const FOR_BRAND = {
    nico: [
        { es: 'Estrategia de {b}', en: '{b} strategy' },
        { es: 'Revisando y ajustando el trabajo de {b}', en: 'Reviewing and adjusting the {b} work' },
        { es: 'Definiendo con sus Brains lo próximo de {b}', en: 'Planning what is next for {b} with his Brains' },
    ],
    researcher: [
        { es: 'Investigación de mercado de {b}', en: '{b} market research' },
        { es: 'Competencia de {b}', en: '{b} competitors' },
        { es: 'Tendencias del sector de {b}', en: 'Trends in the {b} industry' },
    ],
    marketer: [
        { es: 'Ideas de contenido para {b}', en: 'Content ideas for {b}' },
        { es: 'Métricas de {b}', en: '{b} metrics' },
        { es: 'Plan de comunicación de {b}', en: '{b} communication plan' },
    ],
    creator: [
        { es: 'Identidad de {b}', en: '{b} identity' },
        { es: 'Piezas para {b}', en: 'Visuals for {b}' },
        { es: 'Ideas visuales para {b}', en: 'Visual ideas for {b}' },
    ],
    builder: [
        { es: 'Sitio web de {b}', en: '{b} website' },
        { es: 'Automatizaciones para {b}', en: 'Automations for {b}' },
        { es: 'Mejoras digitales de {b}', en: 'Digital improvements for {b}' },
    ],
};
export function brandWork(id, lang, brand, d = studioNow()) {
    const list = FOR_BRAND[id].map((x) => (lang === 'es' ? x.es : x.en).replace('{b}', brand));
    const i = Math.floor(d.getTime() / STEP) % list.length;
    return [...list.slice(i), ...list.slice(0, i)];
}
