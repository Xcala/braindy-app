import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { AdCard } from './AdCard';
import { Numbers } from './Numbers';
import { PlatformBadge, platformOf } from './platforms';
import { useCampaignStats, type AdCampaign } from './usePauta';

/** One campaign: platform, state in client words, dates and budget, its numbers, then its ads. Ended ones start folded. */
export function CampaignCard({ brandId, c, urls, results }: { brandId: string; c: AdCampaign; urls: Record<string, string>; results: boolean }) {
  const { t, lang } = useI18n();
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const stats = useCampaignStats(brandId, c.id, results);
  const [open, setOpen] = useState(c.state !== 'ended');
  const day = (d: Date) => d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const dates = c.start ? (c.end ? `${day(c.start)} – ${day(c.end)}` : t('pa.since', { day: day(c.start) })) : '';
  const money = (v: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: c.currency || 'USD', maximumFractionDigits: 0 }).format(v);
  const budget = c.budget ? t(c.budget.period === 'daily' ? 'pa.budgetDaily' : 'pa.budgetTotal', { v: money(c.budget.amount) }) : '';

  return (
    <section className="card pa-camp" style={{ borderTopColor: c.color }} aria-labelledby={`pa-${c.id}`}>
      <header className="pa-camp-head">
        <PlatformBadge platform={c.platform} />
        <div className="col g4 min-w-0" style={{ flex: 1 }}>
          <h2 id={`pa-${c.id}`} className="h3" style={{ margin: 0 }}>{c.name}</h2>
          <p className="t-xs t-mute" style={{ margin: 0 }}>{[platformOf(c.platform).label, c.objective, dates, budget].filter(Boolean).join(' · ')}</p>
        </div>
        <span className={`pa-state is-${c.state}`}>{t(`pa.st.${c.state}`)}</span>
      </header>
      {stats?.totals && <Numbers n={stats.totals} currency={c.currency || 'USD'} />}
      {c.ads.length > 0 && (
        <button type="button" className="btn btn-ghost btn-sm self-start" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {t(open ? 'pa.hideAds' : 'pa.showAds', { n: c.ads.length })}
        </button>
      )}
      {open && (
        <div className="pa-ads">
          {c.ads.map((a) => <AdCard key={a.id} brandId={brandId} ad={a} urls={urls} numbers={stats?.ads[a.id]} currency={c.currency || 'USD'} />)}
        </div>
      )}
    </section>
  );
}
