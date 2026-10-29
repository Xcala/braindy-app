import { useAuth } from '../auth/AuthProvider';
import { useTour } from '../tour/useTour';
import { homeSteps } from '../tour/steps';
import { Link } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { brainName } from '../components/BrainStack';
import { dayLabel, isOverdue } from '../lib/dates';
import { useBrandsRequests, type ScopedRequest } from '../requests/useBrandsRequests';
import { useVersions } from '../requests/useRequests';
import { useFileUrl, isImage } from '../requests/useFileUrl';
import { HomeHero } from '../home/HomeHero';
import { HomeStudio } from '../home/HomeStudio';
import { InsightsCard } from '../brains/BrainPanels';
import { LiveBanner, ResultsCard, WhatsappCard } from '../home/HomeExtras';
import { LessonOfTheWeek } from '../criterio/LessonCards';

export function Home() {
  const { current, brands, select } = useBrands();
  const { t, lang } = useI18n();
  const scope = current ? [current.id, ...brands.filter((b) => b.groupId && (b.groupId === current.id || brands.find((p) => p.id === b.groupId)?.groupId === current.id)).map((b) => b.id)] : [];
  const all = useBrandsRequests(scope);
  const { profile } = useAuth();
  useTour('home', () => homeSteps(lang), !!current, profile?.role !== 'admin');
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;

  const needsYou = all.filter((r) => r.status === 'to_approve');
  const inProd = all.filter((r) => r.status === 'in_production')
    .sort((a, b) => String(a.dueDate ?? '9999').localeCompare(String(b.dueDate ?? '9999'))).slice(0, 5);
  const delivered = all.filter((r) => r.status === 'approved' || r.status === 'published').slice(0, 3);
  const brandOf = (id: string) => brands.find((b) => b.id === id);

  return (
    <div className="col g32">
      {current.onboarding && current.onboarding.step !== 'live' && (
        <Link to="/onboarding" className="card row between g16 wrap" style={{ textDecoration: 'none', color: 'var(--ink)', background: '#EAF0FF', border: 0 }}>
          <span className="col"><span className="w7">{t('ob.continue')}</span><span className="t-sm t-mute">{t('ob.continueSub', { step: t(`ob.a.step.${current.onboarding.step}`) })}</span></span>
          <span className="btn btn-primary btn-sm">{t('common.continue')}</span>
        </Link>
      )}
      {current.onboarding?.step === 'live' && <LiveBanner liveAt={current.onboarding.liveAt} />}
      <HomeHero brandName={current.name} needsYou={needsYou} open={all} />
      <HomeStudio requests={all} />
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="col g32 min-w-0">
          <section className="col g12" aria-labelledby="h-moving" data-tour="home-prod">
            <div className="row between"><h2 className="h3" id="h-moving">{t('home.thisWeek')}</h2><Link to="/requests" className="t-sm w7">{t('home.seeAll')}</Link></div>
            {inProd.length === 0 && <div className="card t-mute">{t('home.nothingInProd')}</div>}
            {inProd.map((r) => {
              const late = isOverdue(r.dueDate);
              return (
                <Link key={`${r.brandId}/${r.id}`} to={`/requests/${r.id}`} onClick={() => current.id !== r.brandId && select(r.brandId)} className="card row g16" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
                  {r.leadBrain && <img src={`/brand/brains/${r.leadBrain}.png`} alt="" className="h-10 w-10 flex-none rounded-full" style={{ background: 'var(--niebla)' }} />}
                  <div className="col g4 grow" style={{ minWidth: 0 }}>
                    <span className="w7 truncate">{r.title}</span>
                    <span className="t-sm t-mute truncate">{r.brandId !== current.id ? `${brandOf(r.brandId)?.name} · ` : ''}{r.stage === 'plan' ? t('home.planning', { brain: brainName(r.leadBrain) }) : t('req.onIt', { brain: brainName(r.leadBrain) })}</span>
                  </div>
                  {r.dueDate && (
                    <span className={`t-xs whitespace-nowrap ${late ? 'w7' : 't-mute'}`} style={late ? { color: '#C0362C' } : undefined}>
                      {t(late ? 'home.late' : 'home.dueDay', { day: dayLabel(r.dueDate, lang) })}
                    </span>
                  )}
                </Link>
              );
            })}
          </section>
          <section className="col g12" aria-labelledby="h-recent" data-tour="home-delivered">
            <div className="row between"><h2 className="h3" id="h-recent">{t('home.recent')}</h2><Link to="/assets" className="t-sm w7">{t('home.openAssets')}</Link></div>
            {delivered.length === 0 ? <div className="card t-mute">{t('home.nothingDelivered')}</div> : (
              <div className="grid gap-4 sm:grid-cols-3">{delivered.map((r) => <DeliveredShot key={`${r.brandId}/${r.id}`} r={r} />)}</div>
            )}
          </section>
        </div>
        <aside className="col g16 min-w-0">
          <ResultsCard brandId={current.id} />
          <InsightsCard brandId={current.id} />
          <LessonOfTheWeek />
          <WhatsappCard brandId={current.id} />
        </aside>
      </div>
    </div>
  );
}

function DeliveredShot({ r }: { r: ScopedRequest }) {
  const { t } = useI18n();
  const versions = useVersions(r.brandId, r.id);
  const v = versions.find((x) => x.id === r.latestVersion) ?? versions[versions.length - 1];
  const url = useFileUrl(r.brandId, r.id, v);
  return (
    <Link to={`/requests/${r.id}`} className="shot block overflow-hidden rounded-2xl" style={{ aspectRatio: '4 / 5', background: 'var(--niebla)' }}>
      {url && isImage(v?.files?.[0]?.contentType) ? <img src={url} alt={r.title} className="h-full w-full object-cover" loading="lazy" /> : <span className="flex h-full items-center justify-center p-4 text-center t-sm t-mute">{r.title}</span>}
      <span className="tag">{r.title} · {t(`req.status.${r.status}`)}</span>
    </Link>
  );
}
