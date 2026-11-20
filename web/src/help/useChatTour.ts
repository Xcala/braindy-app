import { useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { iniciarTour, tourVisto, type Paso } from '../tour/engine.js';

/**
 * The first time the chat opens empty, three short steps point at «+» (attach), the mic and the clock (your chats).
 * Once per person; the mic step is left out where the browser cannot dictate.
 */
export function useChatTour(ready: boolean) {
  const { user } = useAuth();
  const { t } = useI18n();
  useEffect(() => {
    if (!ready || !user) return;
    const id = `help-chat-${user.uid}`;
    if (tourVisto(id)) return;
    const timer = window.setTimeout(() => {
      if (document.querySelector('.tg-tour, .ai-pop')) return;
      const steps: Paso[] = [
        { el: '[data-tour="help-attach"]', titulo: t('ct.t1'), texto: t('ct.x1') },
        { el: '[data-tour="help-mic"]', titulo: t('ct.t2'), texto: t('ct.x2') },
        { el: '[data-tour="help-hist"]', titulo: t('ct.t3'), texto: t('ct.x3') },
      ].filter((p) => document.querySelector(p.el));
      if (!steps.length) return;
      iniciarTour(id, steps, { confeti: false,
        colores: ['#8B5CF6', '#F5B301', '#06B6D4', '#2A7FFF'],
        textos: { saltar: t('tour.skip'), atras: t('tour.back'), siguiente: t('tour.next'), empezar: t('tour.next'), listo: t('tour.done'), empezarFin: t('tour.done'), de: t('tour.of') },
      });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [ready, user, t]);
}
