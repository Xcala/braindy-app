import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import type { AdStats, Outlook } from './useAdStats';

type Zone = 'acid' | 'mid' | 'best';
const ZONES: Zone[] = ['acid', 'mid', 'best'];
const MONEY = new Set(['cpr', 'cpc']);

/** The whole run since the campaign started: results come per campaign when Meta gives none per day. */
function current(stats: AdStats, o: Outlook) {
  const rows = stats.daily.filter((d) => (!o.since || d.d >= o.since) && ((d.spend ?? 0) > 0 || (d.impressions ?? 0) > 0));
  if (!rows.length) return null;
  const add = (k: 'spend' | 'clicks' | 'impressions' | 'results') => rows.reduce((n, d) => n + (d[k] ?? 0), 0);
  const camps = stats.campaigns['365'] ?? stats.campaigns['90'] ?? stats.campaigns['30'] ?? stats.campaigns.month ?? [];
  const results = add('results') || camps.reduce((n, c) => n + (c.results ?? 0), 0);
  const spend = add('spend'), clicks = add('clicks'), shown = add('impressions');
  const v = o.metric === 'cpr' ? (results ? spend / results : null) : o.metric === 'cpc' ? (clicks ? spend / clicks : null) : shown ? clicks / shown : null;
  const days = Math.round((+new Date(`${rows.at(-1)!.d}T12:00:00`) - +new Date(`${rows[0]!.d}T12:00:00`)) / 864e5) + 1;
  return v == null ? null : { v, days };
}

/** Which scenario the number is closest to, and where it sits on a bar that reads worst → best. */
function place(v: number, o: Outlook) {
  const lower = o.best < o.acid;
  const beats = (a: number, b: number) => (lower ? a <= b : a >= b);
  const zone: Zone = beats(v, (o.best + o.mid) / 2) ? 'best' : beats(v, (o.mid + o.acid) / 2) ? 'mid' : 'acid';
  const f = (v - o.acid) / (o.mid - o.acid || 1);
  const pos = f <= 1 ? 16.7 + f * 33.3 : 50 + ((v - o.mid) / (o.best - o.mid || 1)) * 33.3;
  return { zone, pos: Math.min(97, Math.max(3, pos)), lower };
}

/** Results › Ads: how the campaign is doing against the three scenarios it was projected with and against public industry references. A general read, never a promise. */
export function AdOutlook({ stats }: { stats: AdStats }) {
  const { t, lang } = useI18n();
  const o = stats.outlook;
  const now = o ? current(stats, o) : null;
  if (!o || !now) return null;
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const fmt = (n: number) => MONEY.has(o.metric)
    ? new Intl.NumberFormat(locale, { style: 'currency', currency: stats.currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: n < 10 ? 2 : 0 }).format(n)
    : new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(n);
  const { zone, pos, lower } = place(now.v, o);
  const refState = (low: number, high: number) => (now.v >= low && now.v <= high ? 'in' : (now.v < low) === lower ? 'better' : 'worse');
  return (
    <section className="card card-tight col g16" aria-label={t('ads.o.title')}>
      <div className="row between g12 wrap">
        <div className="col g4" style={{ minWidth: 0 }}>
          <h2 className="h3">{t('ads.o.title')}</h2>
          <p className="t-xs t-mute">{t(now.days < 7 ? 'ads.o.early' : 'ads.o.days', { n: now.days })}</p>
        </div>
        <span className={`chip chip-plain outlook-${zone}`}>{t(`ads.o.z.${zone}` as StringKey)}</span>
      </div>

      <div className="col g8">
        <div className="row g8 wrap" style={{ alignItems: 'baseline' }}>
          <span className="h2">{fmt(now.v)}</span>
          <span className="t-sm t-mute">{o.label || t(`ads.k.${o.metric}` as StringKey)}</span>
        </div>
        <div className="outlook-bar" role="img" aria-label={t(`ads.o.z.${zone}` as StringKey)}>
          {ZONES.map((z) => <span key={z} className={`outlook-seg outlook-${z}${z === zone ? ' is-on' : ''}`} />)}
          <span className="outlook-pin" style={{ left: `${pos}%` }} />
        </div>
        <div className="grid grid-cols-3 t-xs">
          {ZONES.map((z, i) => (
            <span key={z} className="col" style={{ textAlign: i === 0 ? 'left' : i === 1 ? 'center' : 'right' }}>
              <b>{t(`ads.o.s.${z}` as StringKey)}</b><span className="t-mute">{fmt(o[z])}</span>
            </span>
          ))}
        </div>
      </div>

      {o.note && <p className="t-sm">{o.note}</p>}

      {!!o.refs?.length && (
        <div className="col g8">
          <h3 className="t-sm w7">{t('ads.o.refs')}</h3>
          <ul className="col">
            {o.refs.map((r) => {
              const s = refState(r.low, r.high);
              return (
                <li key={r.name} className="row between g12 wrap" style={{ padding: '0.5rem 0', borderTop: '1px solid var(--line)' }}>
                  <div className="col" style={{ minWidth: 0, flex: '1 1 180px' }}>
                    <span className="t-sm w7">{r.name}</span>
                    {r.source && <span className="t-xs t-mute">{r.source}</span>}
                  </div>
                  <div className="row g8 t-sm" style={{ alignItems: 'center' }}>
                    <span>{fmt(r.low)} – {fmt(r.high)}</span>
                    <span className={`chip chip-plain outlook-${s === 'better' ? 'best' : s === 'in' ? 'mid' : 'acid'}`}>{t(`ads.o.r.${s}` as StringKey)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="t-xs t-mute">{t('ads.o.disclaimer')}</p>
    </section>
  );
}
