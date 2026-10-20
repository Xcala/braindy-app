import { Link, Navigate } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { Steps } from '../onboarding/Steps';
import { BriefChat } from '../onboarding/BriefChat';
import { BrainCards } from '../onboarding/BrainCards';
import { SessionPicker } from '../onboarding/SessionPicker';
import type { BrainDraft } from '../onboarding/api';

/** First 11 days (design 17): one page that follows the brand's onboarding step. */
export function Onboarding() {
  const { current } = useBrands();
  const { t } = useI18n();
  const brainDoc = useBrandDoc(current?.id, 'context/brain');
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;
  const ob = current.onboarding;
  if (!ob || ob.step === 'live') return <Navigate to="/home" replace />;
  const brain = (brainDoc.data ?? {}) as BrainDraft;
  const signed = brain.status === 'signed';

  return (
    <div className="grid items-start gap-7 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Steps step={ob.step} />
      {ob.step === 'brief' && <BriefChat brandId={current.id} brandName={current.name} />}

      {(ob.step === 'brain' || ob.step === 'session') && (
        <section className="col g20">
          <div className="stage grid items-center gap-6 rounded-[20px] p-6 sm:p-9 md:grid-cols-[minmax(0,1fr)_260px]">
            <div className="col g12">
              <div className="row g8 wrap"><p className="label">{t('ob.day1')} · {t('ob.byResearcher')}</p><span className="chip c-draft">{t('ob.namePending')}</span></div>
              <h1 className="d-lg" style={{ color: '#fff', fontSize: 44, lineHeight: '46px' }}><span className="w9">{t('ob.brainReady1')}</span> {t('ob.brainReady2')}</h1>
              <p className="t-lg muted">{t('ob.brainReadySub')}</p>
            </div>
            <div className="widget col" style={{ alignItems: 'flex-start', gap: 8, position: 'static' }}>
              <span className="t-xs" style={{ color: '#C9D0DE' }}>{t('ob.signature')}</span>
              <div className="row g8"><img src="/brand/proposal/nicolas.jpg" alt="" className="h-10 w-10 rounded-full object-cover" />
                <div className="col"><span className="w7 t-sm">{signed ? t('ob.signedBy') : t('ob.waitingNicolas')}</span><span className="t-xs" style={{ color: '#C9D0DE' }}>{t('ob.signDay2')}</span></div></div>
            </div>
          </div>
          <SessionPicker brandId={current.id} brandName={current.name} bookedAt={ob.sessionAt} />
          {ob.step === 'session' && (
            <div className="card col g8" style={{ padding: 22 }}>
              <h2 className="h3">{t('ob.agenda')}</h2>
              {(['ob.agenda1', 'ob.agenda2', 'ob.agenda3', 'ob.agenda4'] as const).map((k, i) => <div key={k} className="row g12 t-sm"><span className="sec-num">0{i + 1}</span>{t(k)}</div>)}
            </div>
          )}
          <BrainCards brain={brain} />
          <div className="card t-sm" style={{ background: '#EAF0FF', border: 0 }}><b>{t('ob.aiNoteBold')}</b> {t('ob.aiNote')}</div>
        </section>
      )}

      {ob.step === 'firstDelivery' && (
        <section className="col g20">
          <div className="stage col g12 rounded-[20px] p-6 sm:p-9">
            <p className="label">{t('ob.day35')}</p>
            <h1 className="d-lg" style={{ color: '#fff' }}><span className="w9">{t('ob.signedTitle1')}</span> {t('ob.signedTitle2')}</h1>
            <p className="t-lg muted">{t('ob.signedSub')}</p>
            <div className="row g12 wrap"><Link className="btn btn-white" to="/requests">{t('ob.seeRequests')}</Link><Link className="btn btn-outline-light" to="/brand">{t('ob.openBrain')}</Link></div>
          </div>
          <BrainCards brain={brain} />
        </section>
      )}
    </div>
  );
}
