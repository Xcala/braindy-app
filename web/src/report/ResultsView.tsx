import { useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { NetBadge, netInfo } from '../calendar/PostBits';
import type { NetStats } from './useSocialStats';
import type { WebStats } from './useWebStats';
import { combine, rangeOf, type Period } from './socialMath';
import { NetBody } from './SocialResults';
import { WebBody, WebKpis } from './WebResults';

const PERIODS: Period[] = ['30', '90', 'month', 'lastMonth', '365', 'all'];
/** Page ids, YouTube channel ids and LinkedIn urns are not handles people recognise. */
const realHandle = (h?: string | null) => !!h && !/^\d|urn:|^UC[\w-]{20,}$/.test(h);

/** Results: one row of tabs — the summary of website and social media first, then the website, then each network — and one period for all of them. */
export function ResultsView({ social, web }: { social: NetStats[]; web: WebStats | null }) {
  const { t, lang } = useI18n();
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const all = useMemo(() => (social.length > 1 ? combine(social) : social[0] ?? null), [social]);
  const tabs = [
    ...((web && social.length) || social.length > 1 ? ['sum'] : []),
    ...(web ? ['web'] : []),
    ...social.map((n) => n.network),
  ];
  const [tab, setTab] = useState(tabs[0]!);
  const [period, setPeriod] = useState<Period>('30');
  const cur = tabs.includes(tab) ? tab : tabs[0]!;
  const net = social.find((n) => n.network === cur);
  const base = cur === 'web' || !all ? web!.daily : (net ?? all).daily;
  const range = useMemo(() => rangeOf(period, base as NetStats['daily']).cur, [period, base]);
  const day = (s: string) => new Date(`${s.slice(0, 10)}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: range.from.slice(0, 4) !== range.to.slice(0, 4) ? 'numeric' : undefined });
  const updated = [...social.map((n) => n.updatedAt), web?.updatedAt].filter(Boolean).sort((a, b) => +b! - +a!)[0];
  const label = (p: Period) => t(`${p === '365' ? 'web' : 'soc'}.p.${p}` as StringKey);

  return (
    <section className="col g16" aria-label={t('rep.title')}>
      <div className="row between g12 wrap">
        <p className="t-sm t-mute">{t('soc.sub', { from: day(range.from), to: day(range.to) })}{updated ? ` · ${t('soc.updated', { d: updated.toLocaleDateString(locale, { day: 'numeric', month: 'short' }) })}` : ''}</p>
        <select className="input print:hidden" style={{ width: 'auto' }} value={period} onChange={(e) => setPeriod(e.target.value as Period)} aria-label={t('soc.period')}>
          {PERIODS.map((p) => <option key={p} value={p}>{label(p)}</option>)}
        </select>
      </div>

      {tabs.length > 1 && (
        <div className="row g8 wrap" role="tablist" aria-label={t('rep.title')}>
          {tabs.map((id) => {
            const n = social.find((x) => x.network === id);
            return (
              <button key={id} role="tab" aria-selected={id === cur} onClick={() => setTab(id)}
                className={`btn btn-sm ${id === cur ? 'btn-primary' : 'btn-secondary'}`}>
                {id === 'sum' ? t('res.sum') : id === 'web' ? t('web.title') : <><NetBadge network={id} /> {netInfo(id).label}</>}
                {n && realHandle(n.handle) ? ` · @${n.handle}` : ''}
              </button>
            );
          })}
        </div>
      )}

      {cur === 'sum' ? (
        <>
          {web && <h2 className="h3">{t('web.title')}</h2>}
          {web && <WebKpis stats={web} period={period} short />}
          {all && <h2 className="h3">{t('soc.title')}</h2>}
          {all && <NetBody key={`sum-${period}`} net={all} period={period} chart={false} />}
        </>
      ) : cur === 'web' ? <WebBody stats={web!} period={period} /> : net && <NetBody key={net.network} net={net} period={period} />}

      <p className="t-xs t-mute">{cur === 'web' ? t('web.note') : cur === 'sum' && web ? `${t('web.note')} ${t('soc.note')}` : t('soc.note')}</p>
    </section>
  );
}
