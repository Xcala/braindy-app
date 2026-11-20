import { useI18n } from '../i18n/I18nProvider';
import type { ScopedRequest } from '../requests/useBrandsRequests';
import { HomeStudio } from './HomeStudio';
import { TalkToNico } from './TalkToNico';
import { HomeAsk } from './HomeAsk';

/**
 * Home hero: the studio is the screen. Above it, one line (date + what needs you, or "anything is possible")
 * and "Talk to Nick" with every way to reach him. The studio already shows him and his Brains, so the hero
 * repeats neither.
 */
export function HomeHero({ brandName, needsYou, open }: { brandName: string; needsYou: ScopedRequest[]; open: ScopedRequest[] }) {
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
      <HomeAsk />
      <div data-tour="home-brains"><HomeStudio requests={open} /></div>
    </section>
  );
}
