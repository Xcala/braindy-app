import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { brainName } from '../components/BrainStack';
import { useVersions } from '../requests/useRequests';
import { useFileUrl, isImage } from '../requests/useFileUrl';
import type { ScopedRequest } from '../requests/useBrandsRequests';
import type { BrainId } from '../requests/taxonomy';
import { useBrands } from '../brands/BrandProvider';

const BRAINS: BrainId[] = ['researcher', 'marketer', 'creator', 'builder'];

/** Home hero (design 12): what needs you, and the four Brains with their live state. */
export function HomeHero({ brandName, needsYou, open }: { brandName: string; needsYou: ScopedRequest[]; open: ScopedRequest[] }) {
  const { t, lang } = useI18n();
  const today = new Date().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const first = needsYou[0];
  const state = (b: BrainId) => needsYou.some((r) => r.leadBrain === b) ? 'approval' : open.some((r) => r.leadBrain === b && r.status === 'in_production') ? 'working' : 'idle';

  return (
    <section className="stage grid gap-10 rounded-[28px] p-6 sm:p-12 lg:grid-cols-[1.2fr_1fr]" aria-labelledby="h-home">
      <div className="col g24" data-tour="home-needs">
        <p className="label" style={{ color: '#C9D0DE' }}>{today} · {brandName}</p>
        <h1 className="d-lg" id="h-home" style={{ color: '#fff' }}>
          {needsYou.length ? <><span className="w9">{t(needsYou.length === 1 ? 'home.needsOne' : 'home.needsN', { n: needsYou.length })}</span> {t('home.restMoving')}</>
            : <><span className="w9">{t('home.nothingNeeds')}</span> {t('home.restMoving')}</>}
        </h1>
        {first && <FirstItem r={first} />}
      </div>
      <div className="col g12" data-tour="home-brains">
        <div className="grid grid-cols-2 gap-3">
          {BRAINS.map((b) => (
            <div key={b} className="b3d col g4">
              <img src={`/brand/proposal/b3d-${b}.jpg`} alt={brainName(b)} loading="lazy" />
              <span className="w7">{brainName(b)}</span>
              <span className="st t-xs" style={{ color: state(b) === 'approval' ? '#FFD66B' : state(b) === 'working' ? '#8FA0FF' : '#C9D0DE' }}>{t(`team.state.${state(b)}`)}</span>
              <span className="t-xs muted">{t(`home.brainLine.${b}`)}</span>
            </div>
          ))}
        </div>
        <p className="t-xs muted">{t('home.brainsOn', { name: brandName })}</p>
      </div>
    </section>
  );
}

function FirstItem({ r }: { r: ScopedRequest }) {
  const { t } = useI18n();
  const { select, current } = useBrands();
  const versions = useVersions(r.brandId, r.id);
  const v = versions.find((x) => x.id === r.latestVersion);
  const url = useFileUrl(r.brandId, r.id, v);
  return (
    <div className="widget row g20 wrap" style={{ position: 'static' }}>
      <div className="flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-xl" style={{ background: 'rgba(255,255,255,.1)' }}>
        {url && isImage(v?.files?.[0]?.contentType) ? <img src={url} alt="" className="h-full w-full object-cover" /> : <span className="t-xs muted">v{v?.n ?? ''}</span>}
      </div>
      <div className="col g4 grow" style={{ minWidth: 180 }}>
        <span className="t-xs muted">v{v?.n ?? ''}</span>
        <span className="w7">{r.title}</span>
        <span className="t-sm muted">{r.approvalLevel === 'nicolas' ? t('req.madeByReviewed') : t('req.madeBy', { brain: brainName(r.leadBrain) })}</span>
      </div>
      <div className="col g8">
        <Link className="btn btn-white" to={`/requests/${r.id}`} onClick={() => current?.id !== r.brandId && select(r.brandId)}>{t('home.review')}</Link>
        <span className="t-xs muted">{t('home.twoMinutes')}</span>
      </div>
    </div>
  );
}
