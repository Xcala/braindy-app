import { useState } from 'react';
import { Link } from 'react-router';
import { PeriodPick } from '../../components/PeriodPick';
import { useAiHealth } from '../../costs/useAiHealth';
import { useFmt, type Health } from './aiHealth/kit';
import { Failures } from './aiHealth/Failures';
import { GroupTabs } from './aiHealth/GroupTabs';
import { Tasks } from './aiHealth/Tasks';
import './adminStats.css';

/** Admin · AI health: first whether something is failing and what to do, then where. Read from the API (aiCalls). */
export function AdminAiHealth() {
  const f = useFmt();
  const { t } = f;
  const [days, setDays] = useState(7);
  const [tick, setTick] = useState(0);
  // A retry remounts the hook with the same period (key on the inner component keeps useAiHealth untouched).
  return (
    <div className="col g24">
      <div className="ast-head">
        <div className="col g8"><p className="label">{t('bill.a.only')}</p><h1 className="h1">{t('aih.nav')}</h1></div>
        <PeriodPick label={t('aih.period')} value={days} onChange={setDays} options={[{ value: 1, label: t('aih.p1') }, { value: 7, label: t('aih.p7') }, { value: 30, label: t('aih.p30') }]} />
      </div>
      <Body key={tick} days={days} retry={() => setTick((n) => n + 1)} />
    </div>
  );
}

function Body({ days, retry }: { days: number; retry: () => void }) {
  const f = useFmt();
  const { t } = f;
  const { data, error } = useAiHealth(days);
  const h = data as Health | null;
  const period = t(days === 1 ? 'aih.in1' : days === 30 ? 'aih.in30' : 'aih.in7');

  if (error) return (
    <div className="card row between g12 wrap" role="alert">
      <span>{t('aih.error')}</span><button type="button" className="btn btn-secondary btn-sm" onClick={retry}>{t('aih.retry')}</button>
    </div>
  );
  if (!h) return <div className="skel" style={{ height: '15rem' }} />;
  const lastHour = h.totals.failedLastHour;
  const maxDay = Math.max(1, ...h.byDay.map((d) => d.calls));
  return (
    <>
      {!h.configured && <div className="ast-note is-warn" role="status">⚠ {t('aih.off')}</div>}
      <div className="col g4">
        <div className={`ast-note ${lastHour ? 'is-bad' : 'is-ok'}`} role="status">
          <b>{lastHour ? `⚠ ${t('aih.badNow', { n: lastHour })}` : `✓ ${t('aih.okNow')}`}</b>
        </div>
        {h.totals.calls > 0 && (
          <p className="t-sm t-mute">
            {t('aih.line', { calls: h.totals.calls, failed: h.totals.failed, pct: f.pct(h.totals.failed, h.totals.calls), p50: f.secs(h.totals.p50) })}
            {h.totals.p95 ? ` · ${t('aih.lineP95', { s: f.secs(h.totals.p95) })}` : ''}
            {' · '}<Link to="/admin/costs" style={{ color: 'var(--azul)' }} className="w7">{t('aih.seeCosts')} ›</Link>
          </p>
        )}
      </div>

      {h.totals.calls === 0 ? <div className="card t-mute">{t('aih.empty')}</div> : (
        <>
          <Failures errors={h.errors} failed={h.totals.failed} calls={h.totals.calls} period={period} />
          <Tasks tasks={h.tasks} period={period} />
          <GroupTabs byKind={h.byKind} byBrand={h.byBrand} />
          {h.byDay.length > 1 && (
            <section className="card col g12" aria-label={t('aih.byDay')}>
              <h2 className="h3">{t('aih.byDay')}</h2>
              <div className="aih-days" role="list">
                {h.byDay.map((d) => (
                  <div key={d.key} role="listitem" className="aih-day" title={`${d.key} · ${d.calls} ${t('aih.calls').toLowerCase()} · ${d.failed} ${t('aih.failed').toLowerCase()}`}>
                    <div className="aih-bar" style={{ height: `${(d.calls / maxDay) * 100}%` }}>
                      {d.failed > 0 && <i style={{ height: `${(d.failed / d.calls) * 100}%` }} />}
                    </div>
                    <span className="t-xs t-mute">{d.key.slice(8)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
      {h.totals.calls === 0 && <Tasks tasks={h.tasks} period={period} />}
    </>
  );
}
