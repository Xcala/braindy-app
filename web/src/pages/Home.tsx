import { Link } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { brandColors, type Color } from '../brands/identity/Colors';
import { useCopy } from '../brands/identity/useCopy';
import { useI18n } from '../i18n/I18nProvider';
import { BrainStack, brainName } from '../components/BrainStack';
import { useBrandsRequests, type ScopedRequest } from '../requests/useBrandsRequests';
import { useVersions } from '../requests/useRequests';
import { useFileUrl, isImage } from '../requests/useFileUrl';
import { HomeHero } from '../home/HomeHero';
import { BriefCase, LiveBanner, ResultsCard, WhatsappCard } from '../home/HomeExtras';
import { CONTACT } from '../proposals/public/copy';

export function Home() {
  const { current, brands, select } = useBrands();
  const { t } = useI18n();
  const identity = useBrandDoc(current?.id, 'context/identity');
  const { copied, copy } = useCopy();
  const scope = current ? [current.id, ...brands.filter((b) => b.groupId && (b.groupId === current.id || brands.find((p) => p.id === b.groupId)?.groupId === current.id)).map((b) => b.id)] : [];
  const all = useBrandsRequests(scope);
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;

  const needsYou = all.filter((r) => r.status === 'to_approve');
  const inProd = all.filter((r) => r.status === 'in_production').slice(0, 5);
  const delivered = all.filter((r) => r.status === 'approved' || r.status === 'published').slice(0, 3);
  const colors = brandColors(((identity.data?.colors as Color[]) ?? [])).slice(0, 4);
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
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="col g32">
          <section className="col g12" aria-labelledby="h-moving">
            <div className="row between"><h2 className="h3" id="h-moving">{t('req.status.in_production')}</h2><Link to="/requests" className="t-sm w7">{t('home.seeAll')}</Link></div>
            {inProd.length === 0 && <div className="card t-mute">{t('home.nothingInProd')}</div>}
            {inProd.map((r) => (
              <Link key={`${r.brandId}/${r.id}`} to={`/requests/${r.id}`} onClick={() => current.id !== r.brandId && select(r.brandId)} className="card row g16 wrap" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
                <BrainStack lead={r.leadBrain} state="working" />
                <div className="col g4 grow" style={{ minWidth: 200 }}>
                  <span className="w7">{r.title}</span>
                  <span className="t-sm t-mute">{r.brandId !== current.id ? `${brandOf(r.brandId)?.name} · ` : ''}{r.stage === 'plan' ? t('home.planning', { brain: brainName(r.leadBrain) }) : t('req.onIt', { brain: brainName(r.leadBrain) })}</span>
                </div>
                {r.dueDate && <span className="t-xs t-mute whitespace-nowrap">{t('req.due', { date: r.dueDate })}</span>}
              </Link>
            ))}
          </section>
          <section className="col g12" aria-labelledby="h-recent">
            <div className="row between"><h2 className="h3" id="h-recent">{t('home.recent')}</h2><Link to="/assets" className="t-sm w7">{t('home.openAssets')}</Link></div>
            {delivered.length === 0 ? <div className="card t-mute">{t('home.nothingDelivered')}</div> : (
              <div className="grid gap-4 sm:grid-cols-3">{delivered.map((r) => <DeliveredShot key={`${r.brandId}/${r.id}`} r={r} />)}</div>
            )}
          </section>
        </div>
        <aside className="col g16">
          <ResultsCard brandId={current.id} />
          <div className="card col g8">
            <h2 className="h3">{t('home.brandBrain')}</h2>
            <p className="t-sm t-mute">{t('home.brandBrainBody')}</p>
            <Link className="t-sm w7" to="/brand">{t('home.openBrand')}</Link>
          </div>
          {colors.length > 0 && (
            <div className="card col g12">
              <h2 className="h3">{t('brand.quickCopy')}</h2>
              <div className="row g8 wrap">{colors.map((c) => <button key={c.hex} className="qcopy" onClick={() => copy(c.hex!.toUpperCase())}><i style={{ background: c.hex }} />{copied === c.hex!.toUpperCase() ? t('common.copied') : c.hex!.toUpperCase()}</button>)}</div>
            </div>
          )}
          <WhatsappCard brandId={current.id} />
          <div className="card row g12">
            <img src="/brand/proposal/nicolas.jpg" alt="" className="h-12 w-12 rounded-full object-cover" />
            <div className="col grow"><span className="t-sm w7">Nicolas (NickMark)</span><span className="t-xs t-mute">{t('home.orchestrator')}</span></div>
            <a className="btn btn-secondary btn-sm" href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noreferrer">{t('home.talk')}</a>
          </div>
        </aside>
      </div>
      <BriefCase />
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
