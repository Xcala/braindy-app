import { useEffect, useState } from 'react';

const sections = () => Array.from(document.querySelectorAll<HTMLElement>('[data-section]'));
/** The section being shown: the last one whose top has reached the top of the window (sections can be taller than it). */
const current = () => {
  const list = sections();
  let at = 0;
  list.forEach((el, i) => { if (el.getBoundingClientRect().top <= 8) at = i; });
  return at;
};

/** Slides mode for the same page: every section fills the screen, arrows / space / PageDown move one at a time,
 *  full screen when the browser allows it. Opens with ?slides=1 or the "Present" button. */
export function useDeck() {
  const [on, setOn] = useState(() => new URLSearchParams(window.location.search).get('slides') === '1');
  useEffect(() => {
    document.documentElement.classList.toggle('deck-on', on);
    if (!on) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input,textarea,select,[role=dialog]')) return;
      const next = ['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key) ? 1 : ['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key) ? -1 : 0;
      if (e.key === 'Escape') return setOn(false);
      if (!next) return;
      e.preventDefault();
      go(next);
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.documentElement.classList.remove('deck-on'); };
  }, [on]);
  return [on, setOn] as const;
}

function go(step: number) {
  const list = sections();
  const el = list[Math.max(0, Math.min(list.length - 1, current() + step))];
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'smooth' });
}

export function DeckBar({ on, setOn, lang }: { on: boolean; setOn: (v: boolean) => void; lang: 'en' | 'es' }) {
  const s = (es: string, en: string) => (lang === 'es' ? es : en);
  const start = () => { setOn(true); document.documentElement.requestFullscreen?.().catch(() => undefined); };
  const stop = () => { setOn(false); if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined); };
  if (!on) return <div className="deck-bar"><button type="button" className="btn btn-secondary btn-sm" onClick={start}>▶ {s('Presentar', 'Present')}</button></div>;
  return (
    <div className="deck-bar" role="toolbar" aria-label={s('Presentación', 'Presentation')}>
      <button type="button" className="btn btn-secondary btn-sm" aria-label={s('Anterior', 'Previous')} onClick={() => go(-1)}>↑</button>
      <button type="button" className="btn btn-secondary btn-sm" aria-label={s('Siguiente', 'Next')} onClick={() => go(1)}>↓</button>
      <button type="button" className="btn btn-secondary btn-sm" onClick={stop}>✕ {s('Salir', 'Exit')}</button>
    </div>
  );
}
