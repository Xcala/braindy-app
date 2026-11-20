import { useI18n } from '../i18n/I18nProvider';
import type { ScopedRequest } from '../requests/useBrandsRequests';
import { ago } from '../brain/BrainFeed';
import { brandColors, type Color } from './identity/Colors';
import { useBrandDoc } from './useBrandDoc';
import { useTopResult } from './useTopResult';
import type { Brand } from './BrandProvider';
import './companyCard.css';

const ms = (r: ScopedRequest) => r.updatedAt?.toMillis?.() ?? r.createdAt?.toMillis?.() ?? 0;

/**
 * One company inside a group (2026-11-20): its main photo on top (else its colors), its logo, what it needs (to approve, in production,
 * delivered this month), the latest movement and the next due date, plus shortcuts that open the company right there.
 */
export function CompanyCard({ brand, requests, go }: { brand: Brand; requests: ScopedRequest[]; go: (to: string) => void }) {
  const { t, lang } = useI18n();
  const identity = useBrandDoc(brand.id, 'context/identity').data as { colors?: Color[]; logos?: { primary?: string }; heroImage?: string; concept?: Array<{ kind?: string; url?: string }> } | null;
  const colors = brandColors(identity?.colors ?? []).slice(0, 4).map((c) => c.hex);
  const logo = identity?.logos?.primary ?? brand.logoUrl;
  const accent = colors[0] ?? 'var(--azul)';
  // The brand's main photo; else its hero image; else its colors.
  const cover = brand.coverUrl ?? identity?.heroImage ?? identity?.concept?.find((c) => c.kind === 'hero')?.url ?? null;

  const top = useTopResult(brand.id, brand.resultsOn);
  const approve = requests.filter((r) => r.status === 'to_approve');
  const prod = requests.filter((r) => r.status === 'in_production');
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const done = requests.filter((r) => (r.status === 'approved' || r.status === 'published') && ms(r) >= monthStart).length;
  const last = [...requests].sort((a, b) => ms(b) - ms(a))[0];
  const due = prod.map((r) => r.dueDate).filter((d): d is string => !!d).sort()[0];
  const dueText = due ? new Date(`${due}T12:00:00`).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-CO', { day: 'numeric', month: 'short' }) : null;

  return (
    <article className={`cc${approve.length ? ' is-waiting' : ''}`} style={{ ['--cc-accent' as string]: accent }}>
      <button type="button" className="cc-top" onClick={() => go('/home')} aria-label={t('gh.openName', { name: brand.name })}>
        <span className={`cc-band${cover ? ' has-photo' : ''}`} aria-hidden="true">
          {cover ? <img src={cover} alt="" loading="lazy" /> : colors.length ? colors.map((c) => <i key={c} style={{ background: c }} />) : <i />}
        </span>
        <span className="cc-logo">{logo ? <img src={logo} alt="" /> : <b>{brand.name.slice(0, 2).toUpperCase()}</b>}</span>
        <span className="cc-name">{brand.name}</span>
        {brand.kind === 'group' && <span className="chip c-group">{t('brand.group')}</span>}
      </button>

      <div className="cc-stats">
        <button type="button" className={`cc-stat${approve.length ? ' is-warn' : ''}`} onClick={() => go(approve.length ? '/requests/approve' : '/requests')}>
          <b>{approve.length}</b><span>{t('gh.sApprove')}</span>
        </button>
        <button type="button" className="cc-stat" onClick={() => go('/requests')}><b>{prod.length}</b><span>{t('gh.sProd')}</span></button>
        <button type="button" className="cc-stat" onClick={() => go('/deliveries')}><b>{done}</b><span>{t('gh.sDone')}</span></button>
      </div>

      {top && (
        <button type="button" className="cc-result" onClick={() => go('/report')}>
          <span className="cc-result-k">{t('gh.r.kicker')}</span>
          <span className="cc-result-row">
            <b>{top.value.toLocaleString(lang === 'en' ? 'en-US' : 'es-CO')}</b>
            {top.change !== null && top.change !== 0 && <i className={top.change > 0 ? 'is-up' : 'is-down'}>{top.change > 0 ? '▲' : '▼'} {Math.abs(top.change)}%</i>}
          </span>
          <span className="cc-result-l">{t(`gh.r.${top.key}`)}{top.change !== null ? ` · ${t('gh.r.vs')}` : ''}</span>
        </button>
      )}

      <div className="cc-meta">
        {last ? (
          <button type="button" className="cc-last" onClick={() => go(`/requests/${last.id}`)}>
            <span className="t-xs t-mute">{t('gh.last')} · {ago(new Date(ms(last)), t)}</span>
            <span className="cc-last-title">{last.title || t('gh.untitled')}</span>
          </button>
        ) : <span className="t-sm t-mute">{t('gh.noWork')}</span>}
        {dueText && <span className="cc-due">{t('gh.nextDue', { date: dueText })}</span>}
      </div>

      <div className="cc-actions">
        <button type="button" className="btn btn-sm" onClick={() => go('/requests?new=1')}>+ {t('gh.newReq')}</button>
        <button type="button" className="btn btn-sm" onClick={() => go('/brand/visual')}>{t('gh.brand')}</button>
        <button type="button" className="btn btn-primary btn-sm cc-open" onClick={() => go('/home')}>{t('gh.open')} →</button>
      </div>
    </article>
  );
}
