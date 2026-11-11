import { useMemo } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import type { NetStats } from './useSocialStats';
import type { AdDay, AdKey, AdStats, Campaign } from './useAdStats';
import { change, inRange, rangeOf, type Period, type Range } from './socialMath';
import { SocialChart } from './SocialChart';

type Kpi = 'spend' | 'results' | 'cpr' | 'reach' | 'impressions' | 'clicks' | 'ctr' | 'cpc';
const KPIS: Kpi[] = ['spend', 'results', 'cpr', 'clicks', 'ctr', 'cpc', 'impressions'];
const SHORT: Kpi[] = ['spend', 'results', 'cpr', 'clicks'];
const CHART = ['results', 'clicks', 'impressions', 'reach'];
const MONEY = new Set<Kpi>(['spend', 'cpr', 'cpc']);
const asNet = (s: AdStats) => s.daily as unknown as NetStats['daily'];
/** Campaign totals are stored per period; the closest one stands in for the others. */
const campaignPeriod = (p: Period) => (p === 'all' ? '365' : p);

function sum(daily: AdDay[], r: Range | null) {
  if (!r) return null;
  const rows = daily.filter((x) => inRange(x.d, r));
  if (!rows.length) return null;
  const add = (k: AdKey) => rows.reduce((n, x) => n + (x[k] ?? 0), 0);
  return { spend: add('spend'), results: add('results'), impressions: add('impressions'), reach: add('reach'), clicks: add('clicks') };
}
type Totals = NonNullable<ReturnType<typeof sum>>;
function value(k: Kpi, x: Totals | Partial<Record<AdKey, number | null>> | null) {
  if (!x) return null;
  const n = (v: number | null | undefined) => v ?? 0;
  if (k === 'cpr') return n(x.results) ? n(x.spend) / n(x.results) : null;
  if (k === 'cpc') return n(x.clicks) ? n(x.spend) / n(x.clicks) : null;
  if (k === 'ctr') return n(x.impressions) ? n(x.clicks) / n(x.impressions) : null;
  return x[k] ?? null;
}

function useFmt(currency: string) {
  const { lang } = useI18n();
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  return (k: Kpi, v: number | null) => v == null ? '—'
    : MONEY.has(k) ? new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: v < 10 ? 2 : 0 }).format(v)
    : k === 'ctr' ? new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(v)
    : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(v);
}

/** The ads numbers for the period vs the period before (reach doesn't add up across days, so it stays out of the cards). */
export function AdKpis({ stats, period, short }: { stats: AdStats; period: Period; short?: boolean }) {
  const { t } = useI18n();
  const fmt = useFmt(stats.currency);
  const { cur, prev } = useMemo(() => rangeOf(period, asNet(stats)), [period, stats]);
  const now = sum(stats.daily, cur), before = sum(stats.daily, prev);
  // Meta gives results per campaign, not per day: the period's campaigns stand in when the days carry none.
  const camps = stats.campaigns[campaignPeriod(period)];
  if (now && !now.results && camps) now.results = camps.reduce((n, c) => n + (c.results ?? 0), 0);
  const kpis = (short ? SHORT : KPIS).filter((k) => value(k, now) != null && (k !== 'results' || (now?.results ?? 0) > 0));
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {kpis.map((k) => {
        const v = value(k, now), pct = change(v, value(k, before));
        return (
          <div key={k} className="card col g4">
            <span className="t-sm t-mute w7">{t(`ads.k.${k}` as StringKey)}</span>
            <span className="h1">{fmt(k, v)}</span>
            <span className="t-xs t-mute">{pct != null ? t('soc.vsPrev', { n: `${pct >= 0 ? '+' : ''}${pct}%` }) : t(`ads.h.${k}` as StringKey)}</span>
          </div>
        );
      })}
    </div>
  );
}

function CampaignRow({ c, fmt }: { c: Campaign; fmt: ReturnType<typeof useFmt> }) {
  const { t } = useI18n();
  const status = c.status === 'ACTIVE' || c.status === 'PAUSED' ? t(`ads.c.${c.status}` as StringKey) : '';
  return (
    <li className="row between g12 wrap" style={{ padding: '12px 0', borderTop: '1px solid var(--line)' }}>
      <div className="col g4" style={{ minWidth: 0, flex: '1 1 220px' }}>
        <span className="w7">{c.name}</span>
        <span className="t-xs t-mute">{[status, c.objective].filter(Boolean).join(' · ')}</span>
      </div>
      <div className="row g16 wrap t-sm">
        <span><span className="t-mute">{t('ads.k.spend')} </span><b>{fmt('spend', c.spend ?? null)}</b></span>
        {(c.results ?? 0) > 0 && <span><b>{fmt('results', c.results ?? null)}</b> <span className="t-mute">{c.resultLabel || t('ads.k.results').toLowerCase()}</span></span>}
        {(c.results ?? 0) > 0 && <span><span className="t-mute">{t('ads.k.cpr')} </span><b>{fmt('cpr', value('cpr', c))}</b></span>}
        {value('ctr', c) != null && <span><span className="t-mute">{t('ads.k.ctr')} </span><b>{fmt('ctr', value('ctr', c))}</b></span>}
      </div>
    </li>
  );
}

/** Results › Ads: the numbers, a chart and each campaign for the period. */
export function AdsBody({ stats, period }: { stats: AdStats; period: Period }) {
  const { t } = useI18n();
  const fmt = useFmt(stats.currency);
  const { cur } = useMemo(() => rangeOf(period, asNet(stats)), [period, stats]);
  const keys = useMemo(() => new Set(stats.daily.flatMap((x) => Object.keys(x).filter((k) => k !== 'd' && (x as Record<string, unknown>)[k]))), [stats]);
  const cp = campaignPeriod(period);
  const list = (stats.campaigns[cp] ?? stats.campaigns['30'] ?? []).filter((c) => (c.spend ?? 0) > 0 || (c.impressions ?? 0) > 0);
  const label = t(`${cp === '365' ? 'web' : 'soc'}.p.${stats.campaigns[cp] ? cp : '30'}` as StringKey).toLowerCase();
  return (
    <>
      <AdKpis stats={stats} period={period} />
      <SocialChart key={`ads-${period}`} net={{ daily: asNet(stats) }} range={cur} keys={keys} metrics={CHART} prefix="ads.k" />
      <section className="card col g8">
        <div className="col g4"><h2 className="h3">{t('ads.campaigns')}</h2><p className="t-xs t-mute">{t('ads.campaignsSub', { p: label })}</p></div>
        {list.length ? <ul className="col">{list.map((c) => <CampaignRow key={c.id || c.name} c={c} fmt={fmt} />)}</ul> : <p className="t-sm t-mute">{t('ads.c.none')}</p>}
      </section>
    </>
  );
}
