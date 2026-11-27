import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { PeriodPick } from '../../components/PeriodPick';
import { MIN_DAYS, useUsage, type View } from './usage/useUsage';
import { pageName, sectionName } from './usage/names';
import { SplitLegend, UsageRows } from './usage/UsageRows';
import { BrandList, DecideLists } from './usage/UsageLists';
import './adminStats.css';

/** Admin · Usage: which sections clients open and which they don't, to decide what stays in view (first-party counts). */
export function AdminUsage() {
  const { t, lang } = useI18n();
  // Starts on Clients: your own visits are 60 % of the total and would hide how they use the app (decided 2026-11-27).
  const [view, setView] = useState<View>('client');
  const [period, setPeriod] = useState(30);
  const { data: u, error, retry } = useUsage(view, period);
  const pct = (a: number, b: number) => `${b ? Math.round((a / b) * 100) : 0} %`;

  return (
    <div className="col g24">
      <div className="ast-head">
        <div className="col g8"><p className="label">{t('bill.a.only')}</p><h1 className="h1">{t('pv.nav')}</h1></div>
        <div className="ast-ctrls">
          <PeriodPick label={t('pv.who')} value={view} onChange={setView}
            options={[{ value: 'client', label: t('pv.w.client') }, { value: 'admin', label: t('pv.w.admin') }, { value: 'all', label: t('pv.w.all') }]} />
          <PeriodPick label={t('pv.period')} value={period} onChange={setPeriod} options={[{ value: 7, label: t('pv.d7') }, { value: 30, label: t('pv.d30') }]} />
        </div>
      </div>

      {error && (
        <div className="card row between g12 wrap" role="alert">
          <span>{t('pv.error')}</span><button type="button" className="btn btn-secondary btn-sm" onClick={retry}>{t('pv.retry')}</button>
        </div>
      )}
      {!u && !error && <div className="skel" style={{ height: '15rem' }} />}
      {u && (
        <>
          <div className="col g4">
            <p className="ast-sum">{t(`pv.sum.${view}`, { n: u.total.total, pct: pct(u.total.phone, u.total.total) })}</p>
            <p className="t-sm t-mute">{t('pv.sumSub', { d: period })}</p>
          </div>
          {u.days < MIN_DAYS && <div className="ast-note is-warn" role="status">⚠ {t('pv.few', { n: u.days })}</div>}

          {u.total.total === 0 ? <div className="card t-mute">{t('pv.empty')}</div> : (
            <section className="col g12">
              <div className="row between g8 wrap"><h2 className="h3">{t('pv.bySection')} · {t(`pv.ofView.${view}`)}</h2><SplitLegend /></div>
              <UsageRows rows={u.bySection} view={view} label={(k) => sectionName(k, lang)} />
            </section>
          )}

          <DecideLists topPhone={u.topPhone} nobody={u.nobody} period={period} />

          {u.total.total > 0 && (
            <>
              <BrandList rows={u.byBrand} view={view} />
              <details className="ast-fold">
                <summary>{t('pv.byPage', { n: u.byPage.length })}</summary>
                <div style={{ marginTop: '0.75rem' }}><UsageRows rows={u.byPage} view={view} label={(k) => pageName(k, lang, t('pv.detail'))} /></div>
              </details>
            </>
          )}
        </>
      )}
    </div>
  );
}
