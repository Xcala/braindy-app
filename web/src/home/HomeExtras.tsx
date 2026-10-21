import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useReports } from '../report/useReports';
import { IparkCase } from '../proposals/public/Sections';
import { PUBLIC_COPY } from '../proposals/public/copy';

/** Home · results this month (from the latest published report), design 12. */
export function ResultsCard({ brandId }: { brandId: string }) {
  const { t, lang } = useI18n();
  const r = useReports(brandId, false)[0];
  const money = (v: number | null | undefined) => v == null ? '—' : new Intl.NumberFormat(lang === 'es' ? 'es-CO' : 'en-US', { style: 'currency', currency: r?.currency || 'COP', maximumFractionDigits: 0, notation: 'compact' }).format(v);
  return (
    <Link to="/report" className="card col g12" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
      <div className="row between"><h2 className="h3">{t('home.results')}</h2><span className="chip chip-plain">Marketer</span></div>
      {r ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="col"><span className="h2">{r.leads ?? '—'}</span><span className="t-xs t-mute">{t('rep.leads')}</span></div>
          <div className="col"><span className="h2">{money(r.salesAttributed)}</span><span className="t-xs t-mute">{t('rep.sales')}</span></div>
        </div>
      ) : <p className="t-sm t-mute">{t('rep.none')}</p>}
      <span className="t-xs t-mute">{t('home.salesNotLikes')}</span>
    </Link>
  );
}

/** Home · "Approvals by WhatsApp are on" when the brand has a review number. */
export function WhatsappCard({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const s = useBrandDoc(brandId, 'settings/notices');
  const n = s.data as { whatsapp?: string; notices?: { delivery?: boolean } } | null;
  const on = !!n?.whatsapp && n.notices?.delivery !== false;
  return (
    <Link to="/settings" data-tour="home-wa" className="card row g12" style={{ textDecoration: 'none', color: 'var(--ink)', background: on ? '#E9F7EF' : undefined, border: on ? 0 : undefined }}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={on ? '#0E7A4E' : 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 5h14v10H10l-4 4v-4H5z" /></svg>
      <span className="col"><span className="t-sm w7">{t(on ? 'home.waOn' : 'home.waOff')}</span><span className="t-xs t-mute">{t(on ? 'home.waOnSub' : 'home.waOffSub')}</span></span>
    </Link>
  );
}

/** Home · what one brief can do: the iPark case. */
export function BriefCase() {
  const { t, lang } = useI18n();
  return (
    <section className="col g16" aria-labelledby="h-case">
      <div className="row between g8 wrap"><h2 className="h3" id="h-case">{t('home.caseTitle')}</h2><Link to="/ask" className="t-sm w7">{t('home.askLikeThis')}</Link></div>
      <IparkCase c={PUBLIC_COPY[lang]} />
    </section>
  );
}

/** Day 11 (design 17): for two weeks after going live, Home opens with "your brand system is live". */
export function LiveBanner({ liveAt }: { liveAt?: Date | null }) {
  const { t } = useI18n();
  if (!liveAt || Date.now() - liveAt.getTime() > 14 * 864e5) return null;
  return (
    <section className="stage col g12 rounded-[20px] p-6 sm:p-9" aria-labelledby="h-live">
      <p className="label">{t('home.liveKicker')}</p>
      <h1 className="d-lg" id="h-live" style={{ color: '#fff' }}><span className="w9">{t('home.live1')}</span> {t('home.live2')}</h1>
      <p className="t-lg muted">{t('home.liveSub')}</p>
    </section>
  );
}
