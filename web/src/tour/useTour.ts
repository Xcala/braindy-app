import { useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { iniciarTour, tourVisto, type Paso } from './engine.js';

export const TOUR_EVENT = 'braindy:tour';

/** Asks the current screen to show its tour (account menu → "See the tour"). Returns false if none answered. */
export function requestTour(): boolean {
  const e = new Event(TOUR_EVENT, { cancelable: true });
  window.dispatchEvent(e);
  return e.defaultPrevented;
}

/**
 * First-use tour for a screen: opens once per person (remembered per user and screen), again with ?tour=1
 * or from the account menu. `steps` is a function so texts follow the current language.
 */
export function useTour(name: string, steps: () => Paso[], ready: boolean, auto = true) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  const id = `${name}-${user?.uid ?? 'anon'}`;

  useEffect(() => {
    if (!ready || !user) return;
    const open = () => iniciarTour(id, stepsRef.current(), {
      logoHtml: '<img src="/brand/braindy-logo.svg" alt="Braindy" width="112" height="28">',
      colores: ['#2F4DE0', '#F5B301', '#8B5CF6', '#06B6D4', '#2A7FFF'],
      textos: {
        saltar: t('tour.skip'), atras: t('tour.back'), siguiente: t('tour.next'), empezar: t('tour.start'),
        listo: t('tour.done'), empezarFin: t('tour.done'), de: t('tour.of'),
        felicitacion: t('tour.congrats'), felicitacionSub: t('tour.congratsSub'),
      },
    });
    const onRequest = (e: Event) => { e.preventDefault(); open(); };
    window.addEventListener(TOUR_EVENT, onRequest);
    const asked = new URLSearchParams(location.search).get('tour') === '1';
    const timer = asked || (auto && !tourVisto(id)) ? window.setTimeout(open, 700) : undefined;
    return () => { window.removeEventListener(TOUR_EVENT, onRequest); window.clearTimeout(timer); };
  }, [id, ready, user, lang, t, auto]);
}
