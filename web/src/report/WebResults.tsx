import { useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import type { NetStats } from './useSocialStats';
import type { WebPeriod, WebRow, WebStats, WebTotals } from './useWebStats';
import { change, rangeOf } from './socialMath';
import { SocialChart } from './SocialChart';
import { Bars } from './SocialAudience';

const PERIODS: WebPeriod[] = ['30', '90', '365'];
const CHART = ['users', 'sessions', 'views', 'keyEvents'];
type Kpi = 'users' | 'newUsers' | 'sessions' | 'views' | 'engRate' | 'engTime' | 'keyEvents';
const KPIS: Kpi[] = ['users', 'newUsers', 'sessions', 'views', 'engRate', 'engTime', 'keyEvents'];

/** Engaged share of visits and seconds per visitor come from the totals; the rest are read as they are. */
function value(k: Kpi, x: WebTotals | null | undefined) {
  if (!x) return null;
  if (k === 'engRate') return x.sessions ? (x.engaged ?? 0) / x.sessions : null;
  if (k === 'engTime') return x.users ? (x.engTime ?? 0) / x.users : null;
  return x[k] ?? null;
}

/** Results › Website: what Google Analytics measures, by period, with the period before, a chart and where visitors come from. */
export function WebResults({ stats }: { stats: WebStats }) {
  const { t, lang } = useI18n();
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const [period, setPeriod] = useState<WebPeriod>('30');
  const { cur } = useMemo(() => rangeOf(period, stats.daily as unknown as NetStats['daily']), [period, stats]);
  const keys = useMemo(() => new Set(stats.daily.flatMap((x) => Object.keys(x).filter((k) => k !== 'd' && (x as Record<string, unknown>)[k] != null))), [stats]);
  const tot = stats.totals[period];
  const lists = stats.lists[period] ?? {};
  const int = (v: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(v);
  const show = (k: Kpi, v: number | null) => v == null ? '—'
    : k === 'engRate' ? new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(v)
    : k === 'engTime' ? `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, '0')} min` : int(v);
  const day = (s: string) => new Date(`${s}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: period === '365' ? 'numeric' : undefined });
  // GA names channels and devices in English; known ones are translated, the rest show as GA says.
  const named = (prefix: string, rows: WebRow[] = []) => rows.map((r) => ({ name: (t(`${prefix}.${r.name}` as StringKey) as string | undefined) ?? r.name, n: r.n }));
  const kpis = KPIS.filter((k) => k !== 'keyEvents' || (tot?.cur?.keyEvents ?? 0) > 0);
  const sub = t('web.listsSub', { p: t(`${period === '365' ? 'web' : 'soc'}.p.${period}` as StringKey).toLowerCase() });

  return (
    <section className="col g16" aria-labelledby="web-title">
      <div className="row between g12 wrap">
        <div className="col g4">
          <h2 id="web-title" className="h2">{t('web.title')}</h2>
          <p className="t-sm t-mute">{t('web.sub', { from: day(cur.from), to: day(cur.to) })}{stats.updatedAt ? ` · ${t('soc.updated', { d: stats.updatedAt.toLocaleDateString(locale, { day: 'numeric', month: 'short' }) })}` : ''}</p>
        </div>
        <select className="input print:hidden" style={{ width: 'auto' }} value={period} onChange={(e) => setPeriod(e.target.value as WebPeriod)} aria-label={t('soc.period')}>
          {PERIODS.map((p) => <option key={p} value={p}>{t(`${p === '365' ? 'web' : 'soc'}.p.${p}` as StringKey)}</option>)}
        </select>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const now = value(k, tot?.cur), pct = change(now, value(k, tot?.prev));
          return (
            <div key={k} className="card col g4">
              <span className="t-sm t-mute w7">{t(`web.k.${k}` as StringKey)}</span>
              <span className="h1">{show(k, now)}</span>
              <span className="t-xs t-mute">{pct != null ? t('soc.vsPrev', { n: `${pct >= 0 ? '+' : ''}${pct}%` }) : t(`web.h.${k}` as StringKey)}</span>
            </div>
          );
        })}
      </div>

      <SocialChart key={period} net={{ daily: stats.daily as unknown as NetStats['daily'] }} range={cur} keys={keys} metrics={CHART} prefix="web.k" />

      <div className="card col g16">
        <div className="grid gap-6 md:grid-cols-2">
          {(lists.pages?.length ?? 0) > 0 && <Bars title={t('web.pages')} sub={sub} rows={lists.pages!.slice(0, 8)} fmt={(n) => t('web.views', { n: int(n) })} />}
          {(lists.channels?.length ?? 0) > 0 && <Bars title={t('web.channels')} sub={sub} rows={named('web.ch', lists.channels).slice(0, 8)} fmt={int} />}
          {(lists.sources?.length ?? 0) > 0 && <Bars title={t('web.sources')} rows={lists.sources!.slice(0, 8)} fmt={int} />}
          {(lists.countries?.length ?? 0) > 0 && <Bars title={t('web.countries')} rows={lists.countries!.slice(0, 6)} fmt={int} />}
          {(lists.cities?.length ?? 0) > 0 && <Bars title={t('web.cities')} rows={lists.cities!.slice(0, 6)} fmt={int} />}
          {(lists.devices?.length ?? 0) > 0 && <Bars title={t('web.devices')} rows={named('web.dev', lists.devices)} fmt={int} />}
        </div>
      </div>
      <p className="t-xs t-mute">{t('web.note')}</p>
    </section>
  );
}
