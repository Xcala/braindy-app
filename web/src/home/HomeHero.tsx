import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { brainName } from '../components/BrainStack';
import { useVersions } from '../requests/useRequests';
import { useFileUrl, isImage } from '../requests/useFileUrl';
import type { ScopedRequest } from '../requests/useBrandsRequests';
import { useBrands } from '../brands/BrandProvider';
import { useNicoWhatsApp } from '../lib/nicoWhatsApp';
import { HomeStudio } from './HomeStudio';

/**
 * Home hero: the studio is the screen. Above it, one line (date + what needs you, or "anything is possible")
 * and the button to talk to NickMark; what needs approval sits as a short row in between. The studio already
 * shows him and his Brains, so the hero repeats neither.
 */
export function HomeHero({ brandName, needsYou, open }: { brandName: string; needsYou: ScopedRequest[]; open: ScopedRequest[] }) {
  const wa = useNicoWhatsApp();
  const { t, lang } = useI18n();
  const today = new Date().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const shown = needsYou.slice(0, 3);

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
        <a className="btn btn-primary" href={wa()} target="_blank" rel="noreferrer">{t('home.talkNico')}</a>
      </div>
      {shown.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {shown.map((r) => <NeedItem key={`${r.brandId}/${r.id}`} r={r} />)}
          {needsYou.length > 3 && <Link to="/requests" className="t-sm w7 self-center">{t('home.moreToReview', { n: needsYou.length - 3 })}</Link>}
        </div>
      )}
      <div data-tour="home-brains"><HomeStudio requests={open} /></div>
    </section>
  );
}

function NeedItem({ r }: { r: ScopedRequest }) {
  const { t } = useI18n();
  const { select, current } = useBrands();
  const versions = useVersions(r.brandId, r.id);
  const v = versions.find((x) => x.id === r.latestVersion);
  const url = useFileUrl(r.brandId, r.id, v);
  return (
    <div className="card row g12" style={{ padding: 12 }}>
      <div className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-xl" style={{ background: 'var(--niebla)' }}>
        {url && isImage(v?.files?.[0]?.contentType) ? <img src={url} alt="" className="h-full w-full object-cover" /> : <span className="t-xs t-mute">{v?.n ?? ''}</span>}
      </div>
      <div className="col grow" style={{ minWidth: 0 }}>
        <span className="w7 truncate">{r.title}</span>
        <span className="t-xs t-mute truncate">{v?.n ? `${t('home.version', { n: v.n })} · ` : ''}{r.approvalLevel === 'nicolas' ? t('req.madeByReviewed') : t('req.madeBy', { brain: brainName(r.leadBrain) })}</span>
      </div>
      <Link className="btn btn-secondary btn-sm flex-none" to={`/requests/${r.id}`} onClick={() => current?.id !== r.brandId && select(r.brandId)}>{t('home.review')}</Link>
    </div>
  );
}
