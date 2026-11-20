import { AlertsPrompt } from '../pwa/Alerts';
import { useAuth } from '../auth/AuthProvider';
import { useTour } from '../tour/useTour';
import { homeSteps } from '../tour/steps';
import { Link } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { useBrandsRequests } from '../requests/useBrandsRequests';
import { HomeHero } from '../home/HomeHero';
import { HomeDelivered } from '../home/HomeDelivered';
import { HomeProduction } from '../home/HomeProduction';
import { HomeMeetingsRow, NextMeetingTop } from '../home/HomeMeetingsRow';
import { InsightsCard } from '../brains/BrainPanels';
import { LiveBanner } from '../home/HomeExtras';
import { LessonOfTheWeek } from '../criterio/LessonCards';
import { HomeThisMonth } from '../home/HomeThisMonth';
import { HomeBrainLoop } from '../brain/BrainLoop';
import { useLessons } from '../criterio/useCriterio';

/**
 * Home, by hierarchy: the studio with what was launched (4 columns: studio 3, launches 1), what was delivered
 * and waits for approval (3), what is in production on its 48-business-hour clock (2), then meetings
 * (next 1 + history 3) and, last, the lesson and insights (2).
 */
export function Home() {
  const { current, brands } = useBrands();
  const { t, lang } = useI18n();
  const scope = current ? [current.id, ...brands.filter((b) => b.groupId && (b.groupId === current.id || brands.find((p) => p.id === b.groupId)?.groupId === current.id)).map((b) => b.id)] : [];
  const all = useBrandsRequests(scope);
  const { profile } = useAuth();
  // The tour offers the how-to videos too: the overview in this person's language, else the Learn shelf.
  const tutorials = useLessons().list.filter((l) => l.kind && l.status === 'published' && l.videos?.[lang]);
  const overview = tutorials.find((l) => l.kind === 'general');
  const videos = overview ? `/learn/${overview.id}` : tutorials.length ? '/learn' : undefined;
  useTour('home', () => homeSteps(lang, videos), !!current, profile?.role !== 'admin');
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;

  const needsYou = all.filter((r) => r.status === 'to_approve');
  const inProd = all.filter((r) => r.status === 'in_production')
    .sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));

  return (
    <div className="col g40">
      <AlertsPrompt />
      {current.onboarding && current.onboarding.step !== 'live' && (
        <Link to="/onboarding" className="card row between g16 wrap" style={{ textDecoration: 'none', color: 'var(--ink)', background: 'var(--hielo)', border: 0 }}>
          <span className="col"><span className="w7">{t('ob.continue')}</span><span className="t-sm t-mute">{t('ob.continueSub', { step: t(`ob.a.step.${current.onboarding.step}`) })}</span></span>
          <span className="btn btn-primary btn-sm">{t('common.continue')}</span>
        </Link>
      )}
      {current.onboarding?.step === 'live' && <LiveBanner liveAt={current.onboarding.liveAt} />}
      <NextMeetingTop brandId={current.id} brandName={current.name} />
      <HomeHero brandName={current.name} needsYou={needsYou} open={all} />
      {current.kind === 'brand' && <HomeBrainLoop brandId={current.id} />}
      <HomeThisMonth brandId={current.id} requests={all} />
      <HomeDelivered items={needsYou} />
      <HomeProduction items={inProd} />
      <div data-tour="home-meetings"><HomeMeetingsRow brandId={current.id} brandName={current.name} /></div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <LessonOfTheWeek />
        <InsightsCard brandId={current.id} />
      </div>
    </div>
  );
}
