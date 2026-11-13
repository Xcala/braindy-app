import type { PublicCopy } from './copy';
import { SiteVideo } from './SiteVideo';

type Lang = 'en' | 'es';
type T = readonly [es: string, en: string];
const tr = (t: T, l: Lang) => (l === 'es' ? t[0] : t[1]);

// The case films of braindy.co, in its reel order (titles from the site's copy).
const FILMS: Array<{ file: string; client: string; light: T; strong: T; line: T }> = [
  { file: 'milohas-case', client: 'Milohas', light: ['12 años.', '12 years.'], strong: [' Las mismas recetas.', ' Same recipes.'], line: ['Doce años de recetas, convertidos en marca patrimonial', 'Turned twelve years of recipes into a heritage brand'] },
  { file: 'sanuteam-case', client: 'Sanuteam', light: ['Una marca que', 'A brand that'], strong: [' abre sus manos.', ' opens its hands.'], line: ['Le abrió las manos a un equipo que combate la desnutrición', 'Opened the hands of a team fighting malnutrition'] },
  { file: 'ipark-film', client: 'iPark', light: ['De máquina de tiquetes', 'From ticket machine'], strong: [' a historia de movilidad.', ' to mobility story.'], line: ['Un brief, una semana: marca, stand, web y agentes', 'One brief, one week: brand, stand, web and agents'] },
  { file: 'cemex-case', client: 'Cemex', light: ['Una empresa Fortune 500,', 'A Fortune 500 company,'], strong: [' en Colombia.', ' in Colombia.'], line: ['La calidad del concreto, del papel a una plataforma', 'Concrete lab quality, from paper to a platform'] },
  { file: 'experian-case', client: 'Experian', light: ['Experian sabe quién paga.', 'Experian knows who pays.'], strong: [' Las pymes no.', " Small businesses didn't."], line: ['Un SaaS de riesgo con 11k leads al día', 'A credit risk SaaS with 11k leads a day'] },
  { file: 'delvecchio-case', client: 'Del Vecchio', light: ['La marca que', 'The brand that'], strong: [' logró su exit.', ' got an exit.'], line: ['+24 % en ventas a 6 meses; luego la compró Alquería', '+24% sales in 6 months; then Alquería bought it'] },
];
const src = (file: string, l: Lang) => (file === 'ipark-film' ? (l === 'es' ? '/video/ipark-film-es-720.mp4' : '/video/ipark-film-720.mp4') : `/video/${file}-${l}-720.mp4`);
const poster = (file: string, l: Lang) => (file === 'ipark-film' ? (l === 'es' ? '/video/ipark-film-es-poster.webp' : '/video/ipark-film-poster.webp') : `/video/${file}-${l}-poster.webp`);

/** 01 · Our work: business results first, then the case films in a swipe row with sound on demand. */
export function WorkReel({ c, lang }: { c: PublicCopy; lang: Lang }) {
  const s = (es: string, en: string) => (lang === 'es' ? es : en);
  return (
    <section className="col g32 py-16" data-section="1">
      <div className="col g16 px-5 sm:px-14" data-reveal>
        <span className="sec-num">01</span>
        <h2 className="d-lg"><span className="w9">{s('Nuestro trabajo.', 'Our work.')}</span> <span className="w3">{s('Pruebas, no promesas.', 'Proof, not promises.')}</span></h2>
        <div className="grid gap-4 md:grid-cols-3">
          {c.results.map(([n, w, d]) => <div key={w} className="card col g4" data-reveal><span className="day-num" data-count={n}>{n}</span><span className="w7">{w}</span><span className="t-sm t-mute">{d}</span></div>)}
        </div>
        <p className="t-xs t-mute" style={{ margin: 0 }}>{c.resultsNote}</p>
      </div>
      <div className="reel" role="list" aria-label={s('Casos en video', 'Case films')}>
        {FILMS.map((f) => (
          <article key={f.file} className="reel-item col g12" role="listitem" data-reveal>
            <SiteVideo className="reel-film" src={src(f.file, lang)} poster={poster(f.file, lang)} sound={s('Activar sonido', 'Sound on')} label={`${f.client}`} />
            <div className="col" style={{ gap: 2 }}>
              <span className="h3"><span className="w3">{tr(f.light, lang)}</span><span className="w9">{tr(f.strong, lang)}</span></span>
              <span className="t-sm t-mute"><b>{f.client}.</b> {tr(f.line, lang)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
