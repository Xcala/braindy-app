import { useMemo } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import type { DailyKey, NetStats } from './useSocialStats';
import { change, followersAt, keysOf, postsIn, rangeOf, total, type Period } from './socialMath';
import { SocialChart } from './SocialChart';
import { SocialPosts } from './SocialPosts';
import { SocialAudience } from './SocialAudience';

/** The numbers on top, in this order; a network only shows the ones it has. */
const KPIS: DailyKey[] = ['followers', 'views', 'reach', 'interactions', 'engaged', 'pageViews'];

/** One network (or all of them added up) for the period: numbers vs the period before, a chart, the posts that worked best and the audience. */
/** part: the numbers alone (a column of the summary), what comes after them (posts, audience), or both. */
export function NetBody({ net, period, chart = true, part = 'all' }: { net: NetStats; period: Period; chart?: boolean; part?: 'all' | 'kpis' | 'rest' }) {
  const { t, lang } = useI18n();
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const { cur, prev } = useMemo(() => rangeOf(period, net.daily), [period, net]);
  const keys = useMemo(() => keysOf(net.daily), [net]);
  const fmt = (v: number | null) => (v == null ? '—' : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(v));
  const posts = postsIn(net.posts, cur);
  const published = posts.filter((p) => p.type !== 'story').length;
  const stories = posts.length - published;
  const startF = followersAt(net.daily, cur);

  return (
    <>
      {part !== 'rest' && <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {KPIS.filter((k) => keys.has(k)).map((k) => {
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
      </div>}
      {part !== 'kpis' && chart && <SocialChart key={net.network} net={net} range={cur} keys={keys} />}
      {part !== 'kpis' && <SocialPosts posts={posts} network={net.network} />}
      {part !== 'kpis' && net.audience && <SocialAudience audience={net.audience} />}
    </>
  );
}
