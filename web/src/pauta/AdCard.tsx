import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { useRequest } from '../requests/useRequests';
import { AdPiece } from './AdPiece';
import { Numbers } from './Numbers';
import type { Ad, AdNumbers } from './usePauta';

/** One ad: the piece, its texts, whether the client approved it in Braindy, and its numbers (where Results is on). */
export function AdCard({ brandId, ad, urls, numbers, currency }: { brandId: string; ad: Ad; urls: Record<string, string>; numbers?: AdNumbers; currency: string }) {
  const { t } = useI18n();
  return (
    <article className="pa-ad">
      <AdPiece ad={ad} urls={urls} />
      <div className="col g8 min-w-0">
        <div className="row g8 wrap" style={{ alignItems: 'center' }}>
          <b className="t-sm">{ad.name || t('pa.ad')}</b>
          <span className={`pa-state is-${ad.state}`}>{t(`pa.st.${ad.state}`)}</span>
        </div>
        {ad.requestId && <Approval brandId={brandId} requestId={ad.requestId} />}
        {ad.text.primary && <p className="pa-copy">{ad.text.primary}</p>}
        {(ad.text.headline || ad.text.description || ad.text.cta) && (
          <dl className="pa-fields">
            {ad.text.headline && <><dt>{t('pa.headline')}</dt><dd>{ad.text.headline}</dd></>}
            {ad.text.description && <><dt>{t('pa.description')}</dt><dd>{ad.text.description}</dd></>}
            {ad.text.cta && <><dt>{t('pa.cta')}</dt><dd>{ad.text.cta}</dd></>}
          </dl>
        )}
        {numbers && <Numbers n={numbers} currency={currency} compact />}
      </div>
    </article>
  );
}

/** «Approved in Braindy» with the date, or «Waiting for your approval», linking to the request. */
function Approval({ brandId, requestId }: { brandId: string; requestId: string }) {
  const { t, lang } = useI18n();
  const r = useRequest(brandId, requestId);
  if (!r) return null;
  const ok = r.status === 'approved' || r.status === 'published';
  const at = (r as { updatedAt?: { toDate: () => Date } }).updatedAt?.toDate();
  const day = at ? at.toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short' }) : '';
  return (
    <Link to={`/requests/${requestId}`} className={`pa-approved${ok ? ' is-ok' : ''}`}>
      {ok ? `✓ ${t('pa.approved', { day })}` : t('pa.toApprove')}
    </Link>
  );
}
