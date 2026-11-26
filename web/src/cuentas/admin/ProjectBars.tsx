import { useI18n } from '../../i18n/I18nProvider';
import { money, type Agreement, type Progress } from '../api';
import '../cuentas.css';

const pct = (n: number, total: number) => (total > 0 ? Math.min(100, Math.round((n / total) * 100)) : 0);

/** Paid vs work done on one project, side by side. Work done comes from the schedule's contract deliveries; with no
 *  schedule, from the requests approved within the project's service period. A mark on the work bar shows how much of
 *  the schedule's time has gone by, and one line says which runs ahead. */
export function ProjectBars({ agreement: a, paid, progress }: { agreement: Agreement; paid: number; progress: Progress | null | undefined }) {
  const { t } = useI18n();
  const p = pct(paid, a.totalAmount);
  const s = progress?.schedule;
  const months = Object.entries(progress?.requests ?? {}).filter(([m]) => (!a.servicePeriod?.from || m >= a.servicePeriod.from) && (!a.servicePeriod?.to || m <= a.servicePeriod.to));
  const asked = months.reduce((n, [, v]) => n + v[0], 0), approved = months.reduce((n, [, v]) => n + v[1], 0);
  const w = s ? pct(s.done, s.total) : asked ? pct(approved, asked) : null;
  const gap = w === null ? 0 : p - w;
  const verdict = w === null ? null : gap > 10 ? 'cc.pb.payAhead' : gap < -10 ? 'cc.pb.workAhead' : 'cc.pb.even';

  return (
    <div className="col g8">
      <div className="cc-pb">
        <span className="t-xs w7">{t('cc.pb.paid')}</span>
        <div className="cc-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p} aria-label={t('cc.pr.label', { p: String(p) })}><span className="is-paid" style={{ width: `${p}%` }} /></div>
        <span className="t-xs t-mute">{p}% · {t('cc.pb.left', { v: money(Math.max(0, a.totalAmount - paid), a.currency) })}</span>
      </div>
      <div className="cc-pb">
        <span className="t-xs w7">{t('cc.pb.work')}</span>
        {w === null ? <span className="t-xs t-mute" style={{ gridColumn: '2 / -1' }}>{t('cc.pb.noData')}</span> : (
          <>
            <div className="cc-bar is-work" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={w} aria-label={t('cc.pb.workLabel', { p: String(w) })}>
              <span className="is-paid" style={{ width: `${w}%` }} />
              {s && s.elapsed > 0 && s.elapsed < 1 && <i className="cc-today" style={{ left: `${Math.round(s.elapsed * 100)}%` }} title={t('cc.pb.time', { p: String(Math.round(s.elapsed * 100)) })} />}
            </div>
            <span className="t-xs t-mute">{w}% · {s ? t('cc.pb.deliveries', { d: String(s.done), n: String(s.total) }) : t('cc.pb.requests', { d: String(approved), n: String(asked) })}</span>
          </>
        )}
      </div>
      <p className="t-xs t-mute" style={{ margin: 0 }}>
        {verdict && <b>{t(verdict as never)}</b>}
        {s ? ` ${t('cc.pb.time', { p: String(Math.round(s.elapsed * 100)) })}` : ''}
        {s && asked ? ` · ${t('cc.pb.requests', { d: String(approved), n: String(asked) })}` : ''}
      </p>
    </div>
  );
}
