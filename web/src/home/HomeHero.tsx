import { useI18n } from '../i18n/I18nProvider';
import type { ScopedRequest } from '../requests/useBrandsRequests';
import { TalkToNico } from './TalkToNico';
import { HomeAsk } from './HomeAsk';

/**
 * Home hero: one line (date + what needs you, or "anything is possible"), "Talk to Nick" with every way to reach him,
 * and the ask box. The studio scene left Home on 2026-11-24 (Nicolas: the ask box and what waits for approval must show
 * together on the first screen); it lives in its own page.
 */
export function HomeHero({ brandName, needsYou }: { brandName: string; needsYou: ScopedRequest[] }) {
  const { t, lang } = useI18n();
  const today = new Date().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <section className="col g16" aria-labelledby="h-home">
      <div className="row between g16 wrap" data-tour="home-needs">
        <div className="col g4 min-w-0">
          <p className="label">{today} · {brandName}</p>
          <h1 className="h2" id="h-home">
            {needsYou.length
              ? <><span className="w9">{t(needsYou.length === 1 ? 'home.needsOne' : 'home.needsN', { n: needsYou.length })}</span> {t('home.restMoving')}</>
              : <><span className="w9">{t('home.nothingNeeds')}</span> {t('home.possibleSub')}</>}
          </h1>
        </div>
        <TalkToNico brandName={brandName} />
      </div>
      <div data-tour="home-ask"><HomeAsk /></div>
    </section>
  );
}
