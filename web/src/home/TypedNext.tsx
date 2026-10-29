import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';

// What NickMark and his Brains make, in the order he delivers most. Each one carries its article so the
// sentence stays right in Spanish ("la próxima pieza", "el próximo logo"). First and last: "the next piece".
const ITEMS = {
  es: ['la próxima pieza', 'el próximo logo', 'el próximo naming', 'la próxima estrategia de marca', 'el próximo brand research',
    'el próximo market map', 'la próxima web', 'la próxima landing page', 'la próxima home', 'el próximo e-commerce',
    'el próximo ajuste de SEO', 'el próximo dashboard', 'la próxima app', 'la próxima automatización', 'el próximo agente de IA',
    'el próximo chatbot', 'la próxima presentación', 'el próximo manual de marca', 'la próxima firma de correo', 'la próxima tarjeta digital',
    'el próximo brochure', 'el próximo empaque', 'el próximo flyer', 'el próximo carrusel', 'el próximo post', 'el próximo reel',
    'el próximo video', 'la próxima campaña', 'el próximo calendario de contenido', 'el próximo informe de resultados',
    'la próxima infografía', 'la próxima idea loca'],
  en: ['the next piece', 'the next logo', 'the next name', 'the next brand strategy', 'the next brand research',
    'the next market map', 'the next website', 'the next landing page', 'the next home page', 'the next e-commerce',
    'the next SEO fix', 'the next dashboard', 'the next app', 'the next automation', 'the next AI agent',
    'the next chatbot', 'the next presentation', 'the next brand manual', 'the next email signature', 'the next digital card',
    'the next brochure', 'the next package', 'the next flyer', 'the next carousel', 'the next post', 'the next reel',
    'the next video', 'the next campaign', 'the next content calendar', 'the next results report',
    'the next infographic', 'the next wild idea'],
};
const TYPE_MS = 60, ERASE_MS = 28, HOLD_MS = 1400, GAP_MS = 250;
/** Letters two items share at the start ("el próximo "), so only the product is erased and retyped. */
const shared = (a: string, b: string) => { let k = 0; while (k < a.length && a[k] === b[k]) k++; return k; };

/** "Ask me for ___ whenever you want", with the product typed and erased in a loop. Static if motion is reduced. */
export function TypedNext() {
  const { lang } = useI18n();
  const list = ITEMS[lang === 'en' ? 'en' : 'es'];
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [i, setI] = useState(0);
  const [n, setN] = useState(list[0].length);
  const [erasing, setErasing] = useState(false);

  useEffect(() => { setI(0); setN(list[0].length); setErasing(false); }, [list]);
  useEffect(() => {
    if (reduce) return;
    const word = list[i], keep = shared(word, list[(i + 1) % list.length]);
    let ms = erasing ? ERASE_MS : TYPE_MS;
    if (!erasing && n === word.length) ms = HOLD_MS;
    if (erasing && n <= keep) ms = GAP_MS;
    const id = window.setTimeout(() => {
      if (!erasing && n === word.length) setErasing(true);
      else if (erasing && n <= keep) { setErasing(false); setI((i + 1) % list.length); }
      else setN(n + (erasing ? -1 : 1));
    }, ms);
    return () => window.clearTimeout(id);
  }, [i, n, erasing, list, reduce]);

  const [before, after] = lang === 'en' ? ['Ask me for ', ' whenever you want.'] : ['Pídeme ', ' cuando quieras.'];
  return (
    <span aria-label={`${before}${list[0]}${after}`}>
      <span aria-hidden="true">
        {before}<b className="w7" style={{ color: '#fff' }}>{list[i].slice(0, n)}</b>
        {!reduce && <span className="typed-caret" />}{after}
      </span>
    </span>
  );
}
