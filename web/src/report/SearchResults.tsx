import { useMemo } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import type { NetStats } from './useSocialStats';
import type { WebPeriod } from './useWebStats';
import type { SearchDay, SearchStats } from './useSearchStats';
import { change, inRange, rangeOf, type Period, type Range } from './socialMath';
import { SocialChart } from './SocialChart';
import { Bars } from './SocialAudience';

type Kpi = 'clicks' | 'impr' | 'ctr' | 'pos';
const asNet = (s: SearchStats) => s.daily as unknown as NetStats['daily'];

/** Clicks and impressions add up by day; the click rate follows from them and the position is weighted by impressions. */
function sum(daily: SearchDay[], r: Range | null) {
  if (!r) return null;
  const rows = daily.filter((x) => inRange(x.d, r));
  if (!rows.length) return null;
  const clicks = rows.reduce((n, x) => n + (x.clicks ?? 0), 0), impr = rows.reduce((n, x) => n + (x.impr ?? 0), 0);
  const pos = impr ? rows.reduce((n, x) => n + (x.pos ?? 0) * (x.impr ?? 0), 0) / impr : null;
  return { clicks, impr, ctr: impr ? clicks / impr : null, pos } as Record<Kpi, number | null>;
}

/** Google search numbers for the period vs the period before; short = clicks and impressions, for the summary. */
export function SearchKpis({ stats, period, short }: { stats: SearchStats; period: Period; short?: boolean }) {
  const { t, lang } = useI18n();
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const { cur, prev } = useMemo(() => rangeOf(period, asNet(stats)), [period, stats]);
  const now = sum(stats.daily, cur), before = sum(stats.daily, prev);
  const show = (k: Kpi, v: number | null) => v == null ? '—'
    : k === 'ctr' ? new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(v)
    : new Intl.NumberFormat(locale, { maximumFractionDigits: k === 'pos' ? 1 : 0 }).format(v);
  const kpis: Kpi[] = short ? ['clicks', 'impr'] : ['clicks', 'impr', 'ctr', 'pos'];
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {kpis.map((k) => {
        const v = now?.[k] ?? null, b = before?.[k] ?? null;
        // A lower position is better, so it shows where it was instead of a percentage.
        const note = k === 'pos' ? (b != null ? t('gsc.posPrev', { n: show(k, b) }) : null) : (() => { const p = change(v, b); return p != null ? t('soc.vsPrev', { n: `${p >= 0 ? '+' : ''}${p}%` }) : null; })();
        return (
          <div key={k} className="card col g4">
            <span className="t-sm t-mute w7">{t(`gsc.k.${k}` as StringKey)}</span>
            <span className="h1">{show(k, v)}</span>
            <span className="t-xs t-mute">{note ?? t(`gsc.h.${k}` as StringKey)}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Results › Website › Google search: numbers, a chart and what people searched (top lists are Search Console's for 30, 90 or 365 days). */
export function SearchBody({ stats, period }: { stats: SearchStats; period: Period }) {
  const { t, lang } = useI18n();
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const { cur } = useMemo(() => rangeOf(period, asNet(stats)), [period, stats]);
  const keys = useMemo(() => new Set(['clicks', 'impr']), []);
  const lp: WebPeriod = period === '90' || period === '365' ? period : period === 'all' ? '365' : '30';
  const lists = stats.lists[lp] ?? {};
  const int = (v: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(v);
  const sub = t('web.listsSub', { p: t(`${lp === '365' ? 'web' : 'soc'}.p.${lp}` as StringKey).toLowerCase() });
  const page = (u: string) => u.replace(/^https?:\/\/[^/]+/, '') || '/';

  return (
    <section className="col g16" aria-labelledby="gsc-title">
      <div className="col g4"><h2 id="gsc-title" className="h3">{t('gsc.title')}</h2><p className="t-xs t-mute">{t('gsc.sub')}</p></div>
      <SearchKpis stats={stats} period={period} />
      <SocialChart key={`gsc-${period}`} net={{ daily: asNet(stats) }} range={cur} keys={keys} metrics={['clicks', 'impr']} prefix="gsc.k" />
      <div className="grid gap-4 md:grid-cols-2 items-start">
        {(lists.queries?.length ?? 0) > 0 && <Bars card top={3} title={t('gsc.queries')} sub={sub} rows={lists.queries!} fmt={(n) => t('gsc.clicks', { n: int(n) })} />}
        {(lists.pages?.length ?? 0) > 0 && <Bars card top={3} title={t('gsc.pages')} sub={sub} rows={lists.pages!.map((r) => ({ ...r, name: page(r.name) }))} fmt={(n) => t('gsc.clicks', { n: int(n) })} />}
        {(lists.devices?.length ?? 0) > 0 && <Bars card top={3} title={t('gsc.devices')} rows={lists.devices!.map((r) => ({ ...r, name: t(`gsc.dev.${r.name}` as StringKey) ?? r.name }))} fmt={int} />}
      </div>
    </section>
  );
}
