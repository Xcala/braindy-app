import { useI18n } from '../i18n/I18nProvider';
import type { AdNumbers } from './usePauta';

/** Spend, results (named by the campaign), cost per result, reach and clicks. Blank values are left out. */
export function Numbers({ n, currency, compact }: { n: AdNumbers; currency: string; compact?: boolean }) {
  const { t, lang } = useI18n();
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const money = (v: number) => new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: v < 100 ? 2 : 0 }).format(v);
  const int = (v: number) => new Intl.NumberFormat(locale, { notation: v >= 10000 ? 'compact' : 'standard' }).format(v);
  const cpr = n.spend != null && n.results ? n.spend / n.results : null;
  const rows: Array<[string, string]> = [];
  if (n.spend != null) rows.push([t('pa.n.spend'), money(n.spend)]);
  if (n.results != null) rows.push([n.resultLabel || t('pa.n.results'), int(n.results)]);
  if (cpr != null) rows.push([t('pa.n.cpr'), money(cpr)]);
  if (n.reach != null) rows.push([t('pa.n.reach'), int(n.reach)]);
  if (!compact && n.impressions != null) rows.push([t('pa.n.impressions'), int(n.impressions)]);
  if (n.clicks != null) rows.push([t('pa.n.clicks'), int(n.clicks)]);
  if (!rows.length) return null;
  return (
    <dl className={`pa-nums${compact ? ' is-compact' : ''}`}>
      {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
    </dl>
  );
}
