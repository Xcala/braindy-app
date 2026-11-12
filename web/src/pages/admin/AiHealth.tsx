import { useState } from 'react';
import { useBrands } from '../../brands/BrandProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { errorLabel, secs, useAiHealth, type Group } from '../../costs/useAiHealth';

const COLS = 'minmax(0,1.4fr) 80px 80px 80px 80px 90px';
const usd = (v: number) => `US$ ${v.toFixed(2)}`;

/** Admin · AI health: is the AI working, where does it fail, how fast and how much. Read from the API (aiCalls). */
export function AdminAiHealth() {
  const { t, lang } = useI18n();
  const { brands } = useBrands();
  const [days, setDays] = useState(7);
  const { data: h, error } = useAiHealth(days);
  const brandName = (id: string | null) => (!id || id === '—' ? t('aih.noBrand') : brands.find((b) => b.id === id)?.name ?? id);
  const when = (ms: number) => new Date(ms).toLocaleString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

  const table = (rows: Group[], label: (k: string) => string) => (
    <div className="table overflow-x-auto">
      <div className="trow head label min-w-[35rem]" style={{ gridTemplateColumns: COLS }}>
        <span>{t('aih.c.what')}</span><span>{t('aih.c.calls')}</span><span>{t('aih.c.failed')}</span><span>{t('aih.c.retried')}</span><span>{t('aih.c.time')}</span><span>{t('aih.c.cost')}</span>
      </div>
      {rows.map((g) => (
        <div key={g.key} className="trow min-w-[35rem] t-sm" style={{ gridTemplateColumns: COLS }}>
          <span className="w7 truncate" title={label(g.key)}>{label(g.key)}</span><span>{g.calls}</span>
          <span style={{ color: g.failed ? '#C0362C' : undefined, fontWeight: g.failed ? 700 : 400 }}>{g.failed}</span>
          <span>{g.retried}</span><span>{g.p50 ? secs(g.p50) : '—'}</span><span>{usd(g.usd)}</span>
        </div>
      ))}
    </div>
  );

  const maxDay = Math.max(1, ...(h?.byDay ?? []).map((d) => d.calls));
  return (
    <div className="col g24">
      <div className="row between g12 wrap">
        <div className="col g8"><p className="label">{t('bill.a.only')}</p><h1 className="h1">{t('aih.nav')}</h1><p className="t-mute">{t('aih.sub')}</p></div>
        <div className="field" style={{ minWidth: '10.625rem' }}>
          <label htmlFor="aih-days">{t('aih.period')}</label>
          <select id="aih-days" className="input" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={1}>{t('aih.d1')}</option><option value={7}>{t('aih.d7')}</option><option value={30}>{t('aih.d30')}</option>
          </select>
        </div>
      </div>

      {error && <div className="card" role="alert">{t('aih.error')}</div>}
      {!h && !error && <div className="skel" style={{ height: '15rem' }} />}
      {h && (
        <>
          {!h.configured && <div className="card" role="status" style={{ background: '#FFF7E3', border: 0 }}>⚠ {t('aih.off')}</div>}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <div className="card col g4"><span className="t-sm t-mute w7">{t('aih.calls')}</span><span className="h1">{h.totals.calls}</span></div>
            <div className="card col g4"><span className="t-sm t-mute w7">{t('aih.failed')}</span><span className="h1" style={{ color: h.totals.failed ? '#C0362C' : undefined }}>{h.totals.failed}</span>
              <span className="t-xs t-mute">{t('aih.failedSub', { pct: `${h.totals.calls ? Math.round((h.totals.failed / h.totals.calls) * 100) : 0}%` })}</span></div>
            <div className="card col g4"><span className="t-sm t-mute w7">{t('aih.retried')}</span><span className="h1">{h.totals.retried}</span><span className="t-xs t-mute">{t('aih.retriedSub')}</span></div>
            <div className="card col g4"><span className="t-sm t-mute w7">{t('aih.speed')}</span><span className="h1">{h.totals.p50 ? secs(h.totals.p50) : '—'}</span>
              {h.totals.p95 ? <span className="t-xs t-mute">{t('aih.speedSub', { s: secs(h.totals.p95) })}</span> : null}</div>
            <div className="card col g4"><span className="t-sm t-mute w7">{t('aih.cost')}</span><span className="h1">{usd(h.totals.usd)}</span><span className="t-xs t-mute">{t('aih.costSub')}</span></div>
          </div>

          {h.totals.calls === 0 ? <div className="card t-mute">{t('aih.empty')}</div> : (
            <>
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
              <section className="col g12"><h2 className="h3">{t('aih.byKind')}</h2>{table(h.byKind, (k) => k)}</section>
              <section className="col g12"><h2 className="h3">{t('aih.byBrand')}</h2>{table(h.byBrand, brandName)}</section>
              <section className="card col g8" aria-label={t('aih.errors')}>
                <h2 className="h3">{t('aih.errors')}</h2>
                {h.errors.length === 0 ? <p className="t-sm t-mute">{t('aih.none')}</p> : h.errors.map((e, i) => (
                  <div key={i} className="row between g8 wrap t-sm" style={{ borderTop: i ? '1px solid var(--line)' : undefined, paddingTop: i ? 8 : 0 }}>
                    <span className="col" style={{ minWidth: 0 }}><span className="w7">{t(errorLabel(e.error))}</span><span className="t-xs t-mute truncate">{e.kind} · {brandName(e.brandId)}</span></span>
                    <span className="t-xs t-mute">{when(e.at)} · {t('aih.tries', { n: e.attempts })}</span>
                  </div>
                ))}
              </section>
            </>
          )}

          <section className="card col g8" aria-label={t('aih.tasks')}>
            <h2 className="h3">{t('aih.tasks')}</h2>
            <p className="t-sm t-mute">{t('aih.tasksSub', { n: h.tasks.total, f: h.tasks.fallback })}</p>
            <p className="t-sm w7">{t('aih.stuck')}</p>
            {h.tasks.stuck.length === 0 ? <p className="t-sm t-mute">{t('aih.noStuck')}</p> : h.tasks.stuck.map((s) => (
              <div key={s.id} className="row between g8 t-sm"><span className="truncate">{s.brain} · {s.title}</span><span className="t-xs t-mute">{brandName(s.brandId)} · {when(s.at)}</span></div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
