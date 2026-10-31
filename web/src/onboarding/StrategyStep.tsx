import { Link } from 'react-router';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import type { Brand } from '../brands/BrandProvider';
import type { StringKey } from '../i18n/strings';
import { BriefChat } from './BriefChat';
import { BrainCards } from './BrainCards';
import { SessionPicker } from './SessionPicker';
import type { BrainDraft } from './api';
import { OnboardingLessons } from '../criterio/LessonCards';

const TRAINING: Array<{ to: string; title: StringKey; sub: StringKey }> = [
  { to: '/requests', title: 'ctr.tr.requests', sub: 'ctr.tr.requestsSub' },
  { to: '/requests', title: 'ctr.tr.approve', sub: 'ctr.tr.approveSub' },
  { to: '/assets', title: 'ctr.tr.files', sub: 'ctr.tr.filesSub' },
  { to: '/accesses', title: 'ctr.tr.accesses', sub: 'ctr.tr.accessesSub' },
];

/** The platform, in four uses: the training of step 3. */
function Training() {
  const { t } = useI18n();
  return (
    <div className="card col g12" style={{ padding: 22 }}>
      <h2 className="h3">{t('ctr.trTitle')}</h2>
      <p className="t-sm t-mute">{t('ctr.trSub')}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {TRAINING.map((x, i) => (
          <Link key={x.title} to={x.to} className="card col g4" style={{ padding: 16, textDecoration: 'none', color: 'var(--ink)', background: '#F7F8FB', border: 0 }}>
            <span className="sec-num">0{i + 1}</span><span className="w7">{t(x.title)}</span><span className="t-xs t-mute">{t(x.sub)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Step 3 · Strategy and training: the brief questions support the Brand Brain that Nicolas signs. */
export function StrategyStep({ brand }: { brand: Brand }) {
  const { t } = useI18n();
  const brain = (useBrandDoc(brand.id, 'context/brain').data ?? {}) as BrainDraft;
  const ob = brand.onboarding!;
  const signed = brain.status === 'signed';

  if (ob.step === 'brief') {
    return (
      <div className="col g24 min-w-0">
        <div className="stage col g12 rounded-[20px] p-6 sm:p-9">
          <p className="label">{t('ctr.step3')}</p>
          <h1 className="d-lg" style={{ color: '#fff', fontSize: 40, lineHeight: '44px' }}><span className="w9">{t('ctr.strat1')}</span> {t('ctr.strat2')}</h1>
          <p className="t-lg muted">{t('ctr.stratSub')}</p>
        </div>
        <Training />
        <BriefChat brandId={brand.id} brandName={brand.name} />
        <OnboardingLessons />
      </div>
    );
  }

  if (ob.step === 'firstDelivery') {
    return (
      <section className="col g20">
        <div className="stage col g12 rounded-[20px] p-6 sm:p-9">
          <p className="label">{t('ctr.step3')}</p>
          <h1 className="d-lg" style={{ color: '#fff' }}><span className="w9">{t('ob.signedTitle1')}</span> {t('ob.signedTitle2')}</h1>
          <p className="t-lg muted">{t('ob.signedSub')}</p>
          <div className="row g12 wrap"><Link className="btn btn-white" to="/requests">{t('ob.seeRequests')}</Link><Link className="btn btn-outline-light" to="/brand">{t('ob.openBrain')}</Link></div>
        </div>
        <BrainCards brain={brain} />
      </section>
    );
  }

  return (
    <section className="col g20">
      <div className="stage grid items-center gap-6 rounded-[20px] p-6 sm:p-9 md:grid-cols-[minmax(0,1fr)_260px]">
        <div className="col g12">
          <div className="row g8 wrap"><p className="label">{t('ctr.step3')} · {t('ob.byResearcher')}</p><span className="chip c-draft">{t('ob.namePending')}</span></div>
          <h1 className="d-lg" style={{ color: '#fff', fontSize: 44, lineHeight: '46px' }}><span className="w9">{t('ob.brainReady1')}</span> {t('ob.brainReady2')}</h1>
          <p className="t-lg muted">{t('ob.brainReadySub')}</p>
        </div>
        <div className="widget col" style={{ alignItems: 'flex-start', gap: 8, position: 'static' }}>
          <span className="t-xs" style={{ color: '#C9D0DE' }}>{t('ob.signature')}</span>
          <div className="row g8"><img src="/brand/proposal/nicolas-face.jpg" alt="" className="h-10 w-10 rounded-full object-cover" />
            <div className="col"><span className="w7 t-sm">{signed ? t('ob.signedBy') : t('ob.waitingNicolas')}</span><span className="t-xs" style={{ color: '#C9D0DE' }}>{t('ob.signDay2')}</span></div></div>
        </div>
      </div>
      <SessionPicker brandId={brand.id} brandName={brand.name} bookedAt={ob.sessionAt} />
      {ob.step === 'session' && (
        <div className="card col g8" style={{ padding: 22 }}>
          <h2 className="h3">{t('ob.agenda')}</h2>
          {(['ob.agenda1', 'ob.agenda2', 'ob.agenda3', 'ob.agenda4'] as const).map((k, i) => <div key={k} className="row g12 t-sm"><span className="sec-num">0{i + 1}</span>{t(k)}</div>)}
        </div>
      )}
      <BrainCards brain={brain} />
      <Training />
      <div className="card t-sm" style={{ background: '#EAF0FF', border: 0 }}><b>{t('ob.aiNoteBold')}</b> {t('ob.aiNote')}</div>
      <OnboardingLessons />
    </section>
  );
}
