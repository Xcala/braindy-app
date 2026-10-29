import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { brainName } from '../components/BrainStack';
import { useVersions } from '../requests/useRequests';
import { useFileUrl, isImage } from '../requests/useFileUrl';
import type { ScopedRequest } from '../requests/useBrandsRequests';
import type { BrainId } from '../requests/taxonomy';
import { useBrands } from '../brands/BrandProvider';
import { dayLabel, daysFrom } from '../lib/dates';
import { CONTACT } from '../proposals/public/copy';
import { TypedNext } from './TypedNext';

const BRAINS: BrainId[] = ['researcher', 'marketer', 'creator', 'builder'];

/** Home hero: what needs you (every item, up to three) and NickMark, who makes the work, with his Brains as a signature. */
export function HomeHero({ brandName, needsYou, open }: { brandName: string; needsYou: ScopedRequest[]; open: ScopedRequest[] }) {
  const { t, lang } = useI18n();
  const today = new Date().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const shown = needsYou.slice(0, 3);
  const working = (b: BrainId) => open.some((r) => r.leadBrain === b && r.status === 'in_production');
  const next = open
    .filter((r) => r.status === 'in_production' && r.dueDate && (daysFrom(r.dueDate) ?? -1) >= 0)
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))[0];
  const current = open.find((r) => r.status === 'in_production');

  return (
    <section className="stage grid gap-10 rounded-[28px] p-6 sm:p-12 lg:grid-cols-[1.25fr_1fr]" aria-labelledby="h-home">
      <div className="col g24 min-w-0" data-tour="home-needs">
        <p className="label" style={{ color: '#C9D0DE' }}>{today} · {brandName}</p>
        <h1 className="d-lg" id="h-home" style={{ color: '#fff' }}>
          {needsYou.length
            ? <><span className="w9">{t(needsYou.length === 1 ? 'home.needsOne' : 'home.needsN', { n: needsYou.length })}</span> {t('home.restMoving')}</>
            : <><span className="w9">{t('home.nothingNeeds')}</span><br />{t('home.possibleSub')}</>}
        </h1>
        {shown.length > 0 && <div className="col g12">{shown.map((r) => <NeedItem key={`${r.brandId}/${r.id}`} r={r} />)}</div>}
        {needsYou.length > 3 && <Link to="/requests" className="t-sm w7" style={{ color: '#fff' }}>{t('home.moreToReview', { n: needsYou.length - 3 })}</Link>}
      </div>
      <div className="col g16 min-w-0 justify-end" data-tour="home-brains">
        <div className="widget col g16" style={{ position: 'static' }}>
          <div className="row g12">
            <img src="/brand/proposal/nicolas-face.jpg" alt="" className="h-14 w-14 flex-none rounded-full object-cover" />
            <div className="col grow"><span className="w7">{t('sig.card')}</span><span className="t-xs muted">{t('home.orchestrator')}</span></div>
            <a className="btn btn-white btn-sm" href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noreferrer">{t('home.talk')}</a>
          </div>
          <p className="t-sm" style={{ color: '#E6EAF2' }}>
            {next ? t('home.nicoNowDue', { title: next.title, day: dayLabel(next.dueDate, lang) })
              : current ? t('home.nicoNow', { title: current.title }) : <TypedNext />}
          </p>
          <div className="row g12 wrap" style={{ borderTop: '1px solid rgba(255,255,255,.12)', paddingTop: 12 }}>
            <span className="row" aria-label={BRAINS.map(brainName).join(', ')}>
              {BRAINS.map((b, i) => (
                <span key={b} title={`${brainName(b)}${working(b) ? ` · ${t('team.state.working')}` : ''}`} className="relative" style={{ marginLeft: i ? -8 : 0 }}>
                  <img src={`/brand/brains/${b}.png`} alt="" className="h-9 w-9 rounded-full" style={{ background: '#0B1020', boxShadow: '0 0 0 2px #0B1020' }} />
                  {working(b) && <i className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full" style={{ background: '#8FA0FF', boxShadow: '0 0 0 2px #0B1020' }} />}
                </span>
              ))}
            </span>
            <span className="t-xs muted">{t('home.withBrains')}</span>
          </div>
        </div>
      </div>
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
    <div className="widget row g16" style={{ position: 'static', padding: 14 }}>
      <div className="flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-xl" style={{ background: 'rgba(255,255,255,.1)' }}>
        {url && isImage(v?.files?.[0]?.contentType) ? <img src={url} alt="" className="h-full w-full object-cover" /> : <span className="t-xs muted">{v?.n ?? ''}</span>}
      </div>
      <div className="col g4 grow" style={{ minWidth: 0 }}>
        <span className="w7 truncate">{r.title}</span>
        <span className="t-xs muted">{v?.n ? `${t('home.version', { n: v.n })} · ` : ''}{r.approvalLevel === 'nicolas' ? t('req.madeByReviewed') : t('req.madeBy', { brain: brainName(r.leadBrain) })}</span>
      </div>
      <Link className="btn btn-white btn-sm flex-none" to={`/requests/${r.id}`} onClick={() => current?.id !== r.brandId && select(r.brandId)}>{t('home.review')}</Link>
    </div>
  );
}
