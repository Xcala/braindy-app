import { useCallback, useEffect, useState } from 'react';

const sections = () => Array.from(document.querySelectorAll<HTMLElement>('[data-section]'));
/** The section being read in page mode: the last one whose top has reached the upper part of the window. */
const current = () => {
  let at = 0;
  sections().forEach((el, i) => { if (el.getBoundingClientRect().top <= innerHeight * 0.3) at = i; });
  return at;
};

/** Each section is one slide that fits the screen: scaled down (CSS zoom) when its content is taller. */
function fitSlides() {
  for (const el of sections()) {
    el.style.removeProperty('zoom');
    const z = Math.min(1, innerHeight / Math.max(1, el.scrollHeight));
    if (z < 1) el.style.setProperty('zoom', String(Math.max(0.55, z)));
  }
}
function mark(at: number) {
  sections().forEach((el, i) => {
    el.classList.toggle('slide-on', i === at);
    el.classList.toggle('slide-past', i < at);
    el.setAttribute('aria-hidden', i === at ? 'false' : 'true');
  });
}
function unmark() {
  for (const el of sections()) { el.classList.remove('slide-on', 'slide-past'); el.removeAttribute('aria-hidden'); el.style.removeProperty('zoom'); }
}

/** Slides mode for the same page: one section per screen with a slide transition, arrows / space / PageDown / Home / End,
 *  swipe on phones, full screen when the browser allows it, a counter, dots and a progress bar.
 *  Opens with ?slides=1 or the "Present" button; leaving returns to the section you were on. */
export function useDeck(ready = true) {
  const [on, setOn] = useState(() => new URLSearchParams(window.location.search).get('slides') === '1');
  const [at, setAt] = useState(0);
  const [n, setN] = useState(1);
  const go = useCallback((to: number) => setAt(Math.max(0, Math.min(sections().length - 1, to))), []);

  useEffect(() => {
    document.documentElement.classList.toggle('deck-on', on);
    if (!on || !ready) return;
    document.querySelectorAll('[data-reveal],[data-count]').forEach((e) => e.classList.add('is-in'));
    setN(sections().length);
    fitSlides();
    const refit = setTimeout(fitSlides, 900);
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input,textarea,select,[role=dialog]')) return;
      if (e.key === 'Escape') return setOn(false);
      const n = sections().length;
      const step = ['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key) ? 1 : ['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key) ? -1 : 0;
      if (step) { e.preventDefault(); setAt((a) => Math.max(0, Math.min(n - 1, a + step))); }
      else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); setAt(e.key === 'Home' ? 0 : n - 1); }
    };
    let x0 = 0; let y0 = 0;
    const onStart = (e: TouchEvent) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - x0; const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && !(e.target instanceof Element && e.target.closest('.reel'))) {
        setAt((a) => Math.max(0, Math.min(sections().length - 1, a + (dx < 0 ? 1 : -1))));
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('resize', fitSlides);
    return () => {
      clearTimeout(refit); unmark();
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('touchstart', onStart); document.removeEventListener('touchend', onEnd);
      window.removeEventListener('resize', fitSlides);
      document.documentElement.classList.remove('deck-on');
    };
  }, [on, ready]);

  useEffect(() => { if (on && ready) { mark(at); sections()[at]?.scrollTo?.({ top: 0 }); } }, [on, at, ready]);

  const start = () => { setAt(current()); setOn(true); document.documentElement.requestFullscreen?.().catch(() => undefined); };
  const stop = () => {
    const el = sections()[at];
    setOn(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    setTimeout(() => el?.scrollIntoView(), 60);
  };
  return { on, at, n, go, start, stop };
}

type Deck = ReturnType<typeof useDeck>;

export function DeckBar({ deck, lang }: { deck: Deck; lang: 'en' | 'es' }) {
  const s = (es: string, en: string) => (lang === 'es' ? es : en);
  const { on, at, n, go, start, stop } = deck;
  if (!on) return <div className="deck-bar"><button type="button" className="btn btn-primary btn-sm" onClick={start}>▶ {s('Presentar', 'Present')}</button></div>;
  return (
    <>
      <div className="deck-progress" aria-hidden="true"><span style={{ width: `${((at + 1) / n) * 100}%` }} /></div>
      <nav className="deck-dots" aria-label={s('Diapositivas', 'Slides')}>
        {Array.from({ length: n }, (_, i) => <button key={i} type="button" aria-label={`${i + 1}`} aria-current={i === at || undefined} onClick={() => go(i)} />)}
      </nav>
      <div className="deck-nav" role="toolbar" aria-label={s('Presentación', 'Presentation')}>
        <button type="button" className="deck-btn" aria-label={s('Anterior', 'Previous')} disabled={at === 0} onClick={() => go(at - 1)}>←</button>
        <span className="deck-count" aria-live="polite">{String(at + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
        <button type="button" className="deck-btn" aria-label={s('Siguiente', 'Next')} disabled={at === n - 1} onClick={() => go(at + 1)}>→</button>
        <button type="button" className="deck-exit" onClick={stop}>✕ {s('Salir', 'Exit')}</button>
      </div>
    </>
  );
}
