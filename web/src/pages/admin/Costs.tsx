import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { money } from '../../billing/useBilling';
import { MAX_USD, useCosts } from '../../costs/useCosts';
import { PeriodPick } from '../../components/PeriodPick';
import { Fold } from '../../components/Fold';
import { CostBrands } from './CostBrands';
import './costs.css';

const lastMonths = (n: number) => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - i); return d.toISOString().slice(0, 7); });
/** Periods in whole months (costs are kept per month): presets first, then any single month of the last year. */
const PRESETS = { this: () => lastMonths(1), last: () => lastMonths(2).slice(1), m3: () => lastMonths(3), m6: () => lastMonths(6), m12: () => lastMonths(12),
  year: () => lastMonths(new Date().getUTCMonth() + 1) } as const;
type Preset = keyof typeof PRESETS;
const SHORT = ['this', 'last', 'm3'] as const;
const monthsOf = (p: string) => (p in PRESETS ? PRESETS[p as Preset]() : [p]);
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const mtok = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));
const MODEL_COLS = 'minmax(170px,1.3fr) 110px 80px 80px 100px 100px 100px 64px';
/** Fixed tools outside the AI total (decision CI-B): Magnific US$45 + other tools US$543,20 a month. */
const MAGNIFIC_USD = 45;
const FIXED_USD = 543.2;

/** Admin · AI costs (Brand OS): real cost per brand (Claude Max prorated + Claude API), per piece, against what it pays.
 *  UX audit 27 nov 2026: one summary on top (CI1), brands by margin (CI2), honest loading/error/empty and technical blocks folded (CI3). */
export function AdminCosts() {
  const { t, lang } = useI18n();
  const [period, setPeriod] = useState<string>('this');
  const [retry, setRetry] = useState(0);
  const c = useCosts(monthsOf(period), retry);
  const loc = lang === 'es' ? 'es-CO' : 'en-US';
  const monthName = (m: string) => new Date(`${m}-15`).toLocaleDateString(loc, { month: 'long', year: 'numeric' });
  const usd = (v: number | null) => money(v === null ? null : Math.round(v * 100) / 100, 'usd', lang);
  const usdc = (v: number) => new Intl.NumberFormat(loc, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v);
  // The period in words: one month by its name (never «this month» over a 6-month total), presets by their label.
  const periodName = period === 'this' || period === 'last' ? monthName(monthsOf(period)[0]) : period in PRESETS ? t(`cost.p.${period as Preset}`).toLowerCase() : monthName(period);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const inMore = !(SHORT as readonly string[]).includes(period);
  const maxPart = c ? c.brands.reduce((n, b) => n + b.max, 0) : 0;
  const saved = c ? c.eq - maxPart : 0;
  const tokWords = (n: number) => (n >= 1e6 ? t('cost.million', { n: Math.round(n / 1e6).toLocaleString(loc) }) : n.toLocaleString(loc));

  return (
    <div className="col g24">
      <div className="cx-head">
        <h1 className="h1">{t('cost.nav')}</h1>
        <div className="cx-period">
          <PeriodPick label={t('cost.period')} value={period} onChange={setPeriod}
            options={SHORT.map((p) => ({ value: p as string, label: t(p === 'm3' ? 'cost.p.m3short' : `cost.p.${p}`) }))} />
          <select className={`input cx-more${inMore ? ' is-on' : ''}`} aria-label={t('cost.more')} value={inMore ? period : ''} onChange={(e) => e.target.value && setPeriod(e.target.value)}>
            <option value="">{t('cost.more')} ▾</option>
            {(['m6', 'm12', 'year'] as const).map((p) => <option key={p} value={p}>{t(`cost.p.${p}`)}</option>)}
            <optgroup label={t('cost.month')}>
              {lastMonths(12).map((m) => <option key={m} value={m}>{cap(monthName(m))}</option>)}
            </optgroup>
          </select>
        </div>
      </div>

      {!c ? (
        <div className="col g16" aria-busy="true" aria-label={t('common.loading')}>
          <div className="skel" style={{ height: '8.5rem' }} />
          <div className="skel" style={{ height: '3.5rem' }} /><div className="skel" style={{ height: '3.5rem' }} /><div className="skel" style={{ height: '3.5rem' }} />
        </div>
      ) : c.failed ? (
        <div className="card cx-err" role="alert">
          <b>{t('cost.err')}</b>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRetry((n) => n + 1)}>{t('cost.retry')}</button>
        </div>
      ) : (
        <>
          <section className="card col g8 cx-sum" aria-label={cap(periodName)}>
            <span className="t-sm t-mute w7">{cap(periodName)}</span>
            <span className="cx-total">{t('cost.inAi', { v: usd(c.real) })}</span>
            <span className="t-sm">{t('cost.split', { max: usd(maxPart), api: usd(c.api) })}</span>
            {saved > 0 && <span className="t-sm w7 cx-saved">{t('cost.saved', { v: usd(saved) })}</span>}
            <span className="t-xs t-mute">{t('cost.outside', { v: usdc(MAGNIFIC_USD + FIXED_USD) })}</span>
          </section>

          {c.brands.length === 0 ? (
            <div className="card col g4"><b>{t('cost.emptyIn', { period: periodName })}</b><span className="t-sm t-mute">{t('cost.emptyHow')}</span></div>
          ) : <CostBrands c={c} usd={usd} />}

          {c.models.length > 0 && (
            <Fold title={t('cost.byModel')} sub={t('cost.byModelSub', { tokens: tokWords(c.tokens), cache: String(c.cachePct) })}>
              <div className="table cost-table">
                <div className="trow head label min-w-[61.25rem]" style={{ gridTemplateColumns: MODEL_COLS }}>
                  <span className="cost-name">{t('cost.c.model')}</span><span>{t('cost.c.source')}</span><span>{t('cost.c.input')}</span><span>{t('cost.c.output')}</span>
                  <span>{t('cost.c.cacheW')}</span><span>{t('cost.c.cacheR')}</span><span>{t('cost.c.eq')}</span><span>{t('cost.c.share')}</span>
                </div>
                {c.models.map((m) => (
                  <div key={m.key} className="trow min-w-[61.25rem] t-sm" style={{ gridTemplateColumns: MODEL_COLS }}>
                    <span className="w7 cost-name"><b>{m.model}</b></span><span>{t(m.source === 'api' ? 'cost.src.api' : 'cost.src.session')}</span>
                    <span>{mtok(m.input)}</span><span>{mtok(m.output)}</span><span>{mtok(m.cacheW)}</span><span>{mtok(m.cacheR)}</span>
                    <span>{usd(m.usd)}</span><span>{pct(m.share)}</span>
                  </div>
                ))}
              </div>
            </Fold>
          )}

          <Fold title={t('cost.subsTitle', { v: usdc(MAX_USD + MAGNIFIC_USD + FIXED_USD) })} sub={t('cost.subsSub')}>
            <div className="col g8">
              <p className="t-sm"><b>{usd(MAX_USD)}</b> · {t('cost.subsMax')}</p>
              <p className="t-sm"><b>{usd(MAGNIFIC_USD)}</b> · {t('cost.subsMagnific')}</p>
              <p className="t-sm t-mute">{t('cost.subsHiggs')}</p>
              <p className="t-sm t-mute"><b>{usdc(FIXED_USD)}</b> · {t('cost.subsFixed')}</p>
              <p className="t-xs t-mute">{t('cost.note')}</p>
            </div>
          </Fold>
        </>
      )}
    </div>
  );
}
