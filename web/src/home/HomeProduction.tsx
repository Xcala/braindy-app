import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { useBrands } from '../brands/BrandProvider';
import { TeamAtWork } from '../requests/TeamAtWork';
import type { ScopedRequest } from '../requests/useBrandsRequests';
import { SLA_HOURS, addBusinessHours, businessMsBetween } from '../lib/businessHours';

/** When it is due: the plan's date when NickMark set a later one (big projects), otherwise 48 business hours from the request. */
function clock(r: ScopedRequest, now: number) {
  const asked = r.createdAt?.toMillis?.() ?? now;
  const sla = addBusinessHours(asked, SLA_HOURS);
  const planned = r.dueDate ? Date.parse(`${r.dueDate}T18:00:00-05:00`) : NaN;
  const due = Number.isFinite(planned) && planned > sla ? planned : sla;
  const total = Math.max(1, businessMsBetween(asked, due));
  const used = businessMsBetween(asked, now);
  return { asked, due, share: Math.min(1, used / total), late: now > due, leftH: Math.max(0, Math.ceil((total - used) / 3600_000)) };
}

/** In production: the 48-business-hour promise up top, then one card per piece with its own clock (the first four; the rest in Requests). */
const FIRST = 4;

export function HomeProduction({ items }: { items: ScopedRequest[] }) {
  const { t, lang } = useI18n();
  const { current, select } = useBrands();
  const now = Date.now();
  const fmt = (ms: number) => new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' }).format(ms);

  return (
    <section className="col g16" aria-labelledby="h-prod" data-tour="home-prod">
      <div className="col g4">
        <h2 className="h3" id="h-prod">{t('hg.prod')}</h2>
        <p className="t-sm t-mute">{t('hg.prodSub')}</p>
      </div>
      {items.length === 0 && <div className="card t-mute">{t('hg.nothingProd')}</div>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.slice(0, FIRST).map((r) => {
          const c = clock(r, now);
          const tone = c.late ? 'late' : c.share > 0.75 ? 'near' : 'ok';
          return (
            <Link key={`${r.brandId}/${r.id}`} to={`/requests/${r.id}`} onClick={() => current?.id !== r.brandId && select(r.brandId)} className="card col g12 hg-prod min-w-0" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
              <div className="row g12">
                <div className="col grow" style={{ minWidth: 0 }}>
                  <span className="w7 truncate">{r.title}</span>
                  <TeamAtWork r={r} compact />
                </div>
                <span className={`hg-left is-${tone}`}>{c.late ? '!' : t('hg.left', { h: c.leftH })}</span>
              </div>
              <div className={`hg-bar is-${tone}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(c.share * 100)} aria-label={t('hg.dueBy', { when: fmt(c.due) })}>
                <i style={{ width: `${Math.max(4, c.share * 100)}%` }} />
              </div>
              <div className="row between g8 wrap t-xs">
                <span className="t-mute">{t('hg.asked', { when: fmt(c.asked) })}</span>
                <span className="w7" style={c.late ? { color: 'var(--danger)' } : undefined}>{t(c.late ? 'hg.late' : 'hg.dueBy', { when: fmt(c.due) })}</span>
              </div>
            </Link>
          );
        })}
      </div>
      {items.length > FIRST && <Link to="/requests" className="t-sm w7 self-start" style={{ color: 'var(--azul)' }}>{t('home.seeAll')} ({items.length}) →</Link>}
    </section>
  );
}
