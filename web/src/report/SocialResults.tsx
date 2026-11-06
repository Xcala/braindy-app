import { useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { NetBadge, netInfo } from '../calendar/PostBits';
import type { DailyKey, NetStats } from './useSocialStats';
import { change, combine, followersAt, keysOf, postsIn, rangeOf, total, type Period } from './socialMath';
import { SocialChart } from './SocialChart';
import { SocialPosts } from './SocialPosts';
import { SocialAudience } from './SocialAudience';

const PERIODS: Period[] = ['30', '90', 'month', 'lastMonth', 'all'];
/** The numbers on top, in this order; a network only shows the ones it has. */
const KPIS: DailyKey[] = ['followers', 'views', 'reach', 'interactions', 'engaged', 'pageViews'];

/** Results › Social media: what Metricool measures, all networks added up first, then each network on its own tab; by period, with the posts that worked best and the audience. */
export function SocialResults({ list }: { list: NetStats[] }) {
  const { t, lang } = useI18n();
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const all = useMemo(() => (list.length > 1 ? combine(list) : null), [list]);
  const tabs = all ? [all, ...list] : list;
  const [netId, setNetId] = useState(tabs[0]!.network);
  const [period, setPeriod] = useState<Period>('30');
  const net = tabs.find((n) => n.network === netId) ?? tabs[0]!;
  const { cur, prev } = useMemo(() => rangeOf(period, net.daily), [period, net]);
  const keys = useMemo(() => keysOf(net.daily), [net]);
  const fmt = (v: number | null) => (v == null ? '—' : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(v));
  const day = (s: string) => new Date(`${s.slice(0, 10)}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: cur.from.slice(0, 4) !== cur.to.slice(0, 4) ? 'numeric' : undefined });
  const posts = postsIn(net.posts, cur);
  const published = posts.filter((p) => p.type !== 'story').length;
  const stories = posts.length - published;
  const kpis = KPIS.filter((k) => keys.has(k));
  const startF = followersAt(net.daily, cur);
  const updated = list.map((n) => n.updatedAt).filter(Boolean).sort((a, b) => +b! - +a!)[0];

  return (
    <section className="col g16" aria-labelledby="soc-title">
      <div className="row between g12 wrap">
        <div className="col g4">
          <h2 id="soc-title" className="h2">{t('soc.title')}</h2>
          <p className="t-sm t-mute">{t('soc.sub', { from: day(cur.from), to: day(cur.to) })}{updated ? ` · ${t('soc.updated', { d: updated.toLocaleDateString(locale, { day: 'numeric', month: 'short' }) })}` : ''}</p>
        </div>
        <select className="input print:hidden" style={{ width: 'auto' }} value={period} onChange={(e) => setPeriod(e.target.value as Period)} aria-label={t('soc.period')}>
          {PERIODS.map((p) => <option key={p} value={p}>{t(`soc.p.${p}` as StringKey)}</option>)}
        </select>
      </div>

      {list.length > 1 && (
        <div className="row g8 wrap" role="tablist" aria-label={t('cal.networks')}>
          {tabs.map((n) => (
            <button key={n.network} role="tab" aria-selected={n.network === net.network} onClick={() => setNetId(n.network)}
              className={`btn btn-sm ${n.network === net.network ? 'btn-primary' : 'btn-secondary'}`}>
              {n.network === 'all' ? t('soc.allNets') : <><NetBadge network={n.network} /> {netInfo(n.network).label}</>}{n.handle && !/^\d|urn:/.test(n.handle) ? ` · @${n.handle}` : ''}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const now = total(net.daily, k, cur);
          const before = k === 'followers' ? startF : prev ? total(net.daily, k, prev) : null;
          const diff = k === 'followers' && now != null && before != null ? now - before : null;
          const pct = k === 'followers' ? null : change(now, before);
          return (
            <div key={k} className="card col g4">
              <span className="t-sm t-mute w7">{t(`soc.k.${k}` as StringKey)}</span>
              <span className="h1">{fmt(now)}</span>
              <span className="t-xs t-mute">
                {diff != null ? t('soc.fDiff', { n: `${diff >= 0 ? '+' : ''}${fmt(diff)}` }) : pct != null ? t('soc.vsPrev', { n: `${pct >= 0 ? '+' : ''}${pct}%` }) : t(`soc.h.${k}` as StringKey)}
              </span>
            </div>
          );
        })}
        <div className="card col g4">
          <span className="t-sm t-mute w7">{t('soc.k.posts')}</span>
          <span className="h1">{fmt(published)}</span>
          <span className="t-xs t-mute">{stories ? t('soc.plusStories', { n: fmt(stories) }) : t('soc.h.posts')}</span>
        </div>
      </div>

      <SocialChart net={net} range={cur} keys={keys} />
      <SocialPosts posts={posts} network={net.network} />
      {net.audience && <SocialAudience audience={net.audience} />}
      <p className="t-xs t-mute">{t('soc.note')}</p>
    </section>
  );
}
