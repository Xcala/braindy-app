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
