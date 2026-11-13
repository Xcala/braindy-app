import type { PublicCopy } from './copy';
import { SiteVideo } from './SiteVideo';

const DAY_FILES = ['day-0', 'day-0-1', 'day-1', 'day-2', 'day-3-5', 'day-11'];

/** How we start, step by step: each step with its short loop from braindy.co. */
export function StartSteps({ c }: { c: PublicCopy }) {
  return (
    <section className="day-sky col g32 px-5 py-16 sm:px-14" data-section="5">
      <div className="row between g16 wrap" style={{ alignItems: 'flex-end' }} data-reveal>
        <div className="col g12"><span className="sec-num">06</span><h2 className="d-lg"><span className="w9">{c.days1}</span> <span className="w3">{c.days2}</span></h2></div>
        <p className="t-mute" style={{ maxWidth: '24rem', margin: 0 }}>{c.daysSub}</p>
      </div>
      <ol className="steps" role="list">
        {c.days.map(([d, w, line], i) => (
          <li key={d} className="card col g12 step" data-reveal style={{ ['--i' as string]: i }}>
            <SiteVideo className="step-film" src={`/video/days/${DAY_FILES[i]}.mp4`} poster={`/video/days/${DAY_FILES[i]}.webp`} />
            <span className="sec-num">{d}</span>
            <span className="h3 w9" style={{ margin: 0 }}>{w}</span>
            <span className="t-sm t-mute">{line}</span>
          </li>
        ))}
      </ol>
      <div className="card card-tight row g12" data-reveal style={{ background: 'var(--success-bg)', border: 0 }}><span><b>{c.whatsappNote1}</b> {c.whatsappNote2}</span></div>
    </section>
  );
}

/** The Braindy app: everything in one place, with the tour film from braindy.co. */
export function AppTour({ lang }: { lang: 'en' | 'es' }) {
  const s = (es: string, en: string) => (lang === 'es' ? es : en);
  return (
    <section className="grid items-center gap-10 px-5 py-16 sm:px-14 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]" data-section="5">
      <div className="col g20" data-reveal>
        <span className="sec-num">07 · Braindy app</span>
        <h2 className="d-lg"><span className="w3">{s('Todo tu marca,', 'Your whole brand,')}</span> <span className="w9">{s('en un solo lugar.', 'in one place.')}</span></h2>
        <ul className="offer-sub" style={{ gap: '0.5rem' }}>
          <li>{s('Pides en una frase, por la app o por WhatsApp.', 'Ask in one sentence, in the app or on WhatsApp.')}</li>
          <li>{s('Apruebas cada entrega con su porqué.', 'Approve every delivery with its reason.')}</li>
          <li>{s('Tus archivos, tu manual, tu sitio y tus resultados, siempre a mano.', 'Your files, brand book, website and results, always at hand.')}</li>
          <li>{s('Ves en qué va cada pedido, sin perseguir a nadie.', 'See where every request stands, without chasing anyone.')}</li>
        </ul>
      </div>
      <SiteVideo className="app-film" src={`/video/app-tour-${lang}-720.mp4`} poster={`/video/app-tour-${lang}-poster.webp`} sound={s('Ver el tour con sonido', 'Watch the tour with sound')} label={s('Tour de la app Braindy', 'Braindy app tour')} />
    </section>
  );
}
