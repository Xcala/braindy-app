// "New request" panel: the client starts from what they want to achieve, not from a blank box. Each intent opens
// the box with two or three short questions answered by tapping; the answers travel with the request so NickMark
// knows what to make, where it goes and for when. No AI in the browser: everything here is plain rules.
import type { IconName } from '../../components/Icon';
import { WHERE } from '../requestBits';

type L = { es: string; en: string };
const l = (es: string, en: string): L => ({ es, en });

export type QKey = 'format' | 'where' | 'goal';
export type Question = { key: QKey; label: L; options: L[]; multi?: boolean };
export type Intent = { id: string; icon: IconName; label: L; sub: L; category: string; questions: Question[]; ph: L };

const WHERE_SOCIAL: Question = { key: 'where', label: l('¿Dónde se publica?', 'Where does it go?'), multi: true, options: [l('Instagram', 'Instagram'), l('LinkedIn', 'LinkedIn'), l('TikTok', 'TikTok'), l('Facebook', 'Facebook')] };
const GOAL: Question = { key: 'goal', label: l('¿Qué quieres lograr?', 'What do you want to achieve?'), options: [l('Vender más', 'Sell more'), l('Lanzar algo nuevo', 'Launch something new'), l('Una fecha especial', 'A special date'), l('Clientes nuevos', 'New customers'), l('Verme más profesional', 'Look more professional')] };

export const INTENTS: Intent[] = [
  { id: 'social', icon: 'spark', category: 'social', label: l('Algo para redes', 'Something for social'), sub: l('Post, carrusel, reel, historias', 'Post, carousel, reel, stories'),
    questions: [{ key: 'format', label: l('¿Qué pieza?', 'Which piece?'), options: [l('Post', 'Post'), l('Carrusel', 'Carousel'), l('Reel', 'Reel'), l('Historia', 'Story'), l('Contenido del mes', "The month's content")] }, WHERE_SOCIAL],
    ph: l('¿De qué se trata y qué debe hacer la gente al verlo? Ej.: el lanzamiento del servicio de mantenimiento; que agenden por WhatsApp.', 'What is it about and what should people do when they see it? E.g. the launch of the maintenance service; book on WhatsApp.') },
  { id: 'piece', icon: 'file', category: 'graphic', label: l('Una pieza puntual', 'A one-off piece'), sub: l('Presentación, brochure, flyer, tarjetas', 'Deck, brochure, flyer, cards'),
    questions: [{ key: 'format', label: l('¿Qué pieza?', 'Which piece?'), options: [l('Presentación', 'Presentation'), l('Brochure', 'Brochure'), l('Flyer', 'Flyer'), l('Tarjetas', 'Business cards'), l('Banner', 'Banner')] },
      { key: 'where', label: l('¿Dónde se usa?', 'Where is it used?'), options: [l('Impreso', 'Printed'), l('Digital', 'Digital'), l('Para presentar en una reunión', 'To present in a meeting')] }],
    ph: l('¿Para qué es y qué debe decir? Si hay una versión anterior, adjúntala.', 'What is it for and what must it say? If there is a previous version, attach it.') },
  { id: 'web', icon: 'external', category: 'web', label: l('Algo para mi web', 'Something for my website'), sub: l('Cambios, página nueva, landing', 'Changes, new page, landing'),
    questions: [{ key: 'format', label: l('¿Qué necesitas?', 'What do you need?'), options: [l('Un cambio en una página', 'A change on a page'), l('Una página nueva', 'A new page'), l('Landing de campaña', 'Campaign landing'), l('Arreglar algo que falla', 'Fix something broken')] }],
    ph: l('¿Qué página (pega el enlace) y qué debe cambiar?', 'Which page (paste the link) and what should change?') },
  { id: 'campaign', icon: 'grid', category: 'marketing', label: l('Una campaña', 'A campaign'), sub: l('Varias piezas con un objetivo', 'Several pieces, one goal'),
    questions: [GOAL, { key: 'where', label: l('¿En qué canales?', 'Which channels?'), multi: true, options: [l('Redes', 'Social'), l('Web', 'Web'), l('Email', 'Email'), l('Pauta (ads)', 'Ads'), l('Impreso', 'Print')] }],
    ph: l('¿Qué se ofrece, a quién y hasta cuándo? Ej.: 20 % en planes anuales para clientes actuales, todo noviembre.', 'What is offered, to whom and until when? E.g. 20% off annual plans for current customers, all November.') },
  { id: 'unsure', icon: 'search', category: 'other', label: l('No sé, ayúdame', "Not sure, help me"), sub: l('Cuéntanos qué quieres lograr', 'Tell us what you want to achieve'),
    questions: [GOAL],
    ph: l('Cuéntanos qué está pasando y qué te gustaría lograr. NicoMarca te propone qué hacer.', 'Tell us what is going on and what you would like to achieve. NickMark proposes what to do.') },
];

export const intentById = (id: string) => INTENTS.find((i) => i.id === id);
export const intentForCategory = (cat: string) => INTENTS.find((i) => i.category === cat)?.id ?? (cat === 'branding' || cat === 'multimedia' ? 'piece' : 'unsure');

export type Answers = Partial<Record<QKey, string[]>>;

/** The four things a request needs to be clear, read from what the client tapped, typed and attached. */
export function checklist(x: { intent?: Intent; answers: Answers; text: string; dueDate: string; noRush: boolean; files: number; links: number; noMaterial: boolean }) {
  const words = x.text.toLowerCase();
  return {
    what: !!x.answers.format?.length || (x.intent?.id === 'unsure' && !!x.answers.goal?.length) || x.text.trim().length >= 40,
    where: x.intent?.id === 'web' || !!x.answers.where?.length || (x.intent?.id === 'unsure' && !!x.answers.goal?.length) || WHERE.test(words),
    when: !!x.dueDate || x.noRush || /lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|ma[nñ]ana|semana|\d{1,2} de [a-z]|monday|tuesday|wednesday|thursday|friday|tomorrow|week/.test(words),
    material: x.files > 0 || x.links > 0 || x.noMaterial || /adjunt|attach/.test(words),
  };
}
export type Check = ReturnType<typeof checklist>;

// Dates worth preparing for (Colombia), as month/day or a rule. Shown as an idea 10 to 60 days before.
type Season = { id: string; label: L; date: (y: number) => Date };
const nth = (y: number, m: number, weekday: number, n: number) => { const d = new Date(y, m, 1); d.setDate(1 + ((weekday - d.getDay() + 7) % 7) + (n - 1) * 7); return d; };
const SEASONS: Season[] = [
  { id: 'valentine', label: l('San Valentín', "Valentine's Day"), date: (y) => new Date(y, 1, 14) },
  { id: 'mother', label: l('Día de la Madre', "Mother's Day"), date: (y) => nth(y, 4, 0, 2) },
  { id: 'father', label: l('Día del Padre', "Father's Day"), date: (y) => nth(y, 5, 0, 3) },
  { id: 'friendship', label: l('Amor y Amistad', 'Love and Friendship Day'), date: (y) => nth(y, 8, 6, 3) },
  { id: 'halloween', label: l('Halloween', 'Halloween'), date: (y) => new Date(y, 9, 31) },
  { id: 'blackfriday', label: l('Black Friday', 'Black Friday'), date: (y) => { const d = nth(y, 10, 4, 4); d.setDate(d.getDate() + 1); return d; } },
  { id: 'christmas', label: l('Navidad', 'Christmas'), date: (y) => new Date(y, 11, 25) },
];

export type Idea = { id: string; title: L; sub: L; intent: string; answers: Answers; text: L };

/** Up to three ideas ready to tap: a date that is coming, social media with nothing scheduled, and an evergreen one. */
export function ideasFor(x: { now: Date; postedRecently: number; scheduledSoon: number; lang: 'es' | 'en' }): Idea[] {
  const out: Idea[] = [];
  const y = x.now.getFullYear();
  for (const s of SEASONS) {
    for (const d of [s.date(y), s.date(y + 1)]) {
      const days = Math.round((+d - +x.now) / 864e5);
      if (days < 10 || days > 60 || out.length >= 2) continue;
      const weeks = Math.round(days / 7);
      out.push({ id: s.id, intent: 'campaign', answers: { goal: [GOAL.options[2][x.lang]] },
        title: l(`${s.label.es} en ${weeks} semanas`, `${s.label.en} in ${weeks} weeks`), sub: l('Piezas de temporada, a tiempo', 'Seasonal pieces, on time'),
        text: l(`Campaña para ${s.label.es}: `, `Campaign for ${s.label.en}: `) });
    }
  }
  if (x.postedRecently > 0 && x.scheduledSoon === 0) {
    out.push({ id: 'social-gap', intent: 'social', answers: { format: [l('Contenido del mes', "The month's content")[x.lang]] },
      title: l('Nada programado en redes', 'Nothing scheduled on social'), sub: l('Las próximas 2 semanas están vacías', 'The next 2 weeks are empty'),
      text: l('Contenido para las próximas semanas sobre: ', 'Content for the coming weeks about: ') });
  }
  const fill: Idea[] = [
    { id: 'deck', intent: 'piece', answers: { format: [l('Presentación', 'Presentation')[x.lang]], where: [l('Para presentar en una reunión', 'To present in a meeting')[x.lang]] },
      title: l('Tu presentación comercial al día', 'Your sales deck, up to date'), sub: l('Cifras nuevas, tu marca, menos de 10 minutos', 'New figures, your brand, under 10 minutes'),
      text: l('Actualizar la presentación comercial: ', 'Update the sales deck: ') },
    { id: 'web-check', intent: 'unsure', answers: { goal: [GOAL.options[0][x.lang]] },
      title: l('Que tu web venda más', 'Make your website sell more'), sub: l('NicoMarca la revisa y te dice qué cambiar', 'NickMark reviews it and tells you what to change'),
      text: l('Quiero que la web convierta más visitas en clientes. ', 'I want the website to turn more visits into customers. ') },
  ];
  for (const f of fill) if (out.length < 3) out.push(f);
  return out.slice(0, 3);
}

/** "This week": Friday, or two days from now when Friday is closer than that. "Next week": the Friday after. YYYY-MM-DD. */
export function quickDates(now = new Date()) {
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fri = new Date(now); fri.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7));
  if (+fri - +now < 2 * 864e5) { fri.setTime(+now); fri.setDate(now.getDate() + 2); }
  const next = new Date(now); next.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7) + 7);
  return { today: iso(now), thisWeek: iso(fri), nextWeek: iso(next) };
}
