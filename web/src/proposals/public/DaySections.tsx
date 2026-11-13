import { fill, type PublicCopy } from './copy';
import type { PublicProposal } from './Sections';

// The daylight look of braindy.co (Nov 2026) for proposals built on the new offer: San Francisco photo under a white
// scrim, ink type with 300/900 contrast, the sky gradient, white cards and the Braindy sun as an accent.
const SITE = '/brand/site';
const BRAINS = [['researcher', 'Researcher'], ['marketer', 'Marketer'], ['creator', 'Creator'], ['builder', 'Builder']] as const;

export function DayHero({ c, p, dateLabel, validLabel, onLang, lang }: { c: PublicCopy; p: PublicProposal; dateLabel: string; validLabel?: string; onLang: (l: 'en' | 'es') => void; lang: 'en' | 'es' }) {
  const name = p.prospect.company || p.prospect.name || '';
  const s = (es: string, en: string) => (lang === 'es' ? es : en);
  return (
    <section className="day-hero" data-section="0">
      <img className="day-hero-photo" src={`${SITE}/hero-spring-poster.webp`} srcSet={`${SITE}/hero-spring-poster_sm.webp 800w, ${SITE}/hero-spring-poster.webp 1920w`} sizes="100vw" alt="" fetchPriority="high" />
      <div className="day-hero-scrim" aria-hidden="true" />
      <div className="day-hero-in col g40 px-5 py-8 sm:px-14 sm:py-10">
        <div className="day-nav row between g16">
          <img src="/brand/braindy-logo.svg" alt="Braindy" style={{ height: '1.75rem' }} />
          <div className="lang" role="group" aria-label="Language">
            {(['en', 'es'] as const).map((l) => <button key={l} aria-pressed={lang === l} className={lang === l ? 'is-on' : ''} onClick={() => onLang(l)}>{l.toUpperCase()}</button>)}
          </div>
        </div>
        <div className="col g24" style={{ maxWidth: '40rem', marginTop: 'clamp(2rem, 8vh, 6rem)' }}>
          <div className="col g8" style={{ alignItems: 'flex-start' }}>
            <span className="day-pill">{fill(c.preparedFor, { name, date: dateLabel })}</span>
            {validLabel && <span className="day-pill"><i className="day-dot" />{fill(c.validUntil, { date: validLabel })}</span>}
          </div>
          <h1 className="day-display"><span className="w3">{s('Construimos tu marca.', 'We build your brand.')}</span> <span className="w9 day-azul">{s('Y la operamos.', 'And we run it.')}</span></h1>
          <p className="day-lede"><b>{s('Lo hace NicoMarca. Sus Brains lo aceleran.', 'Made by NickMark. Powered by his Brains.')}</b> {s('Sin herramientas que aprender: los Brains hacen el volumen, una persona lo dirige y tú apruebas.', 'No tools to learn: the Brains do the volume, a human leads it, you approve.')}</p>
          <div className="row g12 wrap"><a className="btn btn-primary" href="#options">{s('Ver tu propuesta', 'See your proposal')}</a><a className="btn btn-ghost day-link" href="#talk">{c.talk} →</a></div>
        </div>
        <div className="day-stats row g40 wrap">{c.stats.map(([n, l]) => <span key={l}><b>{n}</b> {l}</span>)}</div>
      </div>
    </section>
  );
}

export function DayBraintrust({ c }: { c: PublicCopy }) {
  return (
    <section className="day-sky grid items-center gap-10 px-5 py-16 sm:px-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]" data-section="3">
      <div className="relative overflow-hidden rounded-[1.25rem]" style={{ aspectRatio: '3 / 4', maxWidth: '28rem', boxShadow: 'var(--day-shadow)' }}>
        <img src={`${SITE}/nickmark_01_sm.webp`} srcSet={`${SITE}/nickmark_01_sm.webp 600w, ${SITE}/nickmark_01.webp 1200w`} sizes="28rem" alt={c.sigCard} className="h-full w-full object-cover" loading="lazy" />
        <div className="glass-dark absolute bottom-4 left-4 rounded-[0.875rem] px-4 py-3" style={{ color: '#fff' }}><p className="w7" style={{ margin: 0 }}>{c.sigCard}</p><p className="t-sm" style={{ margin: 0, opacity: 0.8 }}>{c.founderRole}</p></div>
      </div>
      <div className="col g24">
        <span className="sec-num">03 · The Braintrust</span>
        <h2 className="day-display" style={{ fontSize: 'clamp(2.25rem, 4.5vw, 3.75rem)' }}><span className="w3">{c.bt1}</span> <span className="w9">{c.bt2}</span></h2>
        <p className="day-lede">{c.btBody}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BRAINS.map(([k, n], i) => (
            <div key={k} className="day-brain col g8">
              <img src={`${SITE}/${k}_3d_sm.webp`} alt={n} loading="lazy" />
              <span className="w7 t-sm">{n}</span>
              <span className="t-xs t-mute">{c.brains[i]?.[2]}</span>
            </div>
          ))}
        </div>
        <p className="t-lg" style={{ margin: 0 }}><b>{c.brainWidget}</b> {c.brainWidgetBody}</p>
      </div>
    </section>
  );
}

/** The Braindy sun peeking in from an edge, as on braindy.co. */
export const DaySun = ({ side = 'right', tone = 'azul' }: { side?: 'left' | 'right'; tone?: 'azul' | 'sol' }) =>
  <span className={`day-sun day-sun-${side} day-sun-${tone}`} aria-hidden="true" />;
