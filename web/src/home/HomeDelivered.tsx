import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { useBrands } from '../brands/BrandProvider';
import { brainName } from '../components/BrainStack';
import { useVersions } from '../requests/useRequests';
import { useFileUrl, isImage } from '../requests/useFileUrl';
import type { ScopedRequest } from '../requests/useBrandsRequests';

/** Delivered and waiting for the client's approval: the piece itself, big, with one button to review it. Hidden when nothing waits. */
export function HomeDelivered({ items }: { items: ScopedRequest[] }) {
  const { t } = useI18n();
  if (!items.length) return null;
  return (
    <section className="col g16" aria-labelledby="h-delivered" data-tour="home-delivered">
      <div className="row between g8 wrap">
        <div className="col g4">
          <h2 className="h3" id="h-delivered">{t('hg.delivered')} <span className="chip c-group" style={{ verticalAlign: 'middle' }}>{items.length}</span></h2>
          <p className="t-sm t-mute">{t('hg.deliveredSub')}</p>
        </div>
        <Link to="/requests" className="t-sm w7">{t('home.seeAll')}</Link>
      </div>
      {/* Phone: a row that slides, one card and the edge of the next; from 640 px a grid. */}
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible lg:grid-cols-3" style={{ scrollbarWidth: 'none' }}>
        {items.slice(0, 3).map((r) => <Piece key={`${r.brandId}/${r.id}`} r={r} />)}
      </div>
    </section>
  );
}

function Piece({ r }: { r: ScopedRequest }) {
  const { t } = useI18n();
  const { select, current } = useBrands();
  const versions = useVersions(r.brandId, r.id);
  const v = versions.find((x) => x.id === r.latestVersion);
  const url = useFileUrl(r.brandId, r.id, v);
  const type = v?.files?.[0]?.contentType ?? '';
  return (
    <Link to={`/requests/${r.id}`} onClick={() => current?.id !== r.brandId && select(r.brandId)} className="card col g12 min-w-0 w-[85%] flex-none snap-start sm:w-auto" style={{ textDecoration: 'none', color: 'var(--ink)', padding: '0.75rem' }}>
      <div className="overflow-hidden rounded-xl" style={{ aspectRatio: '4 / 3', background: 'var(--niebla)' }}>
        {url && isImage(type) ? <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
          : url && type.startsWith('video/') ? <video src={url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
            : <span className="flex h-full items-center justify-center t-sm t-mute">{v?.n ? t('home.version', { n: v.n }) : ''}</span>}
      </div>
      <div className="row g12">
        <div className="col grow" style={{ minWidth: 0 }}>
          <span className="w7 truncate">{r.title}</span>
          <span className="t-xs t-mute truncate">{v?.n ? `${t('home.version', { n: v.n })} · ` : ''}{r.approvalLevel === 'nicolas' ? t('req.madeByReviewed') : t('req.madeBy', { brain: brainName(r.leadBrain) })}</span>
        </div>
        <span className="btn btn-primary btn-sm flex-none">{t('home.review')}</span>
      </div>
    </Link>
  );
}
