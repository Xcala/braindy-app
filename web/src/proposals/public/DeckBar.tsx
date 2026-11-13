import { useEffect, useState } from 'react';

const sections = () => Array.from(document.querySelectorAll<HTMLElement>('[data-section]'));
/** The section being shown: the last one whose top has reached the upper part of the window. */
const current = () => {
  const list = sections();
  let at = 0;
  list.forEach((el, i) => { if (el.getBoundingClientRect().top <= innerHeight * 0.3) at = i; });
  return at;
};

/** Each section becomes one slide that fits the screen: scaled down (CSS zoom) when its content is taller. */
function fitSlides() {
  for (const el of sections()) {
    el.style.removeProperty('zoom'); el.style.minHeight = 'auto';
    const z = Math.min(1, innerHeight / el.scrollHeight);
    el.style.setProperty('zoom', String(z));
    el.style.minHeight = `${innerHeight / z}px`;
  }
}
function unfit() { for (const el of sections()) { el.style.removeProperty('zoom'); el.style.minHeight = ''; } }

// Where the deck is heading while a smooth scroll is still running, so quick repeated keys keep advancing.
let want = 0; let wantAt = 0;
const base = () => (Date.now() - wantAt < 900 ? want : current());

function go(to: number) {
  const list = sections();
  want = Math.max(0, Math.min(list.length - 1, to)); wantAt = Date.now();
  const el = list[want];
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'smooth' });
}

/** Slides mode for the same page: one section per screen, arrows / space / PageDown / Home / End, full screen when the
 *  browser allows it, a counter and a progress bar. Opens with ?slides=1 or the "Present" button. */
export function useDeck() {
  const [on, setOn] = useState(() => new URLSearchParams(window.location.search).get('slides') === '1');
  const [at, setAt] = useState(0);
  useEffect(() => {
    document.documentElement.classList.toggle('deck-on', on);
    if (!on) return;
    document.querySelectorAll('[data-reveal],[data-count]').forEach((e) => e.classList.add('is-in'));
    fitSlides();
    const refit = setTimeout(fitSlides, 800);
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input,textarea,select,[role=dialog]')) return;
      if (e.key === 'Escape') return setOn(false);
      const n = sections().length;
      const to = ['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key) ? base() + 1 : ['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key) ? base() - 1
        : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : null;
      if (to == null) return;
      e.preventDefault();
      go(to);
    };
    const onScroll = () => setAt(current());
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', fitSlides);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      clearTimeout(refit); unfit();
      document.removeEventListener('keydown', onKey); window.removeEventListener('resize', fitSlides); window.removeEventListener('scroll', onScroll);
      document.documentElement.classList.remove('deck-on');
    };
  }, [on]);
  return { on, setOn, at };
}

export function DeckBar({ on, setOn, at, lang }: { on: boolean; setOn: (v: boolean) => void; at: number; lang: 'en' | 'es' }) {
  const s = (es: string, en: string) => (lang === 'es' ? es : en);
  const start = () => { setOn(true); document.documentElement.requestFullscreen?.().catch(() => undefined); setTimeout(() => go(current()), 50); };
  const stop = () => { setOn(false); if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined); };
  if (!on) return <div className="deck-bar"><button type="button" className="btn btn-primary btn-sm" onClick={start}>▶ {s('Presentar', 'Present')}</button></div>;
  const n = sections().length || 1;
  return (
    <>
      <div className="deck-progress" aria-hidden="true"><span style={{ width: `${((at + 1) / n) * 100}%` }} /></div>
      <nav className="deck-dots" aria-label={s('Diapositivas', 'Slides')}>
        {Array.from({ length: n }, (_, i) => <button key={i} type="button" aria-label={`${i + 1}`} aria-current={i === at || undefined} onClick={() => go(i)} />)}
      </nav>
      <div className="deck-bar" role="toolbar" aria-label={s('Presentación', 'Presentation')}>
        <button type="button" className="btn btn-secondary btn-sm" aria-label={s('Anterior', 'Previous')} onClick={() => go(at - 1)}>↑</button>
        <span className="deck-count">{at + 1} / {n}</span>
        <button type="button" className="btn btn-secondary btn-sm" aria-label={s('Siguiente', 'Next')} onClick={() => go(at + 1)}>↓</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={stop}>✕ {s('Salir', 'Exit')}</button>
      </div>
    </>
  );
}
