import { useI18n } from '../i18n/I18nProvider';
import type { Schedule, ScheduleRow } from './types';
import { weekDate } from './text';

type Point = ScheduleRow & { state: 'done' | 'doing' | 'due' | 'next' | 'later' };

/** The schedule at a glance: % delivered, a line from start to end with each delivery as a node (filled once delivered),
 *  where we are today, and what is done vs what is left with the next delivery called out. */
export function ScheduleTrack({ schedule: s }: { schedule: Schedule }) {
  const { t, lang } = useI18n();
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const all = s.groups.flatMap((g) => g.rows);
  // Contract deliveries are the milestones; a schedule without them follows every activity.
  const rows = (all.some((r) => r.milestone) ? all.filter((r) => r.milestone) : all).slice().sort((a, b) => a.to - b.to);
  if (!rows.length || s.weeks <= 0) return null;

  const raw = (Date.now() - Date.parse(`${s.start}T00:00:00Z`)) / (7 * 864e5);
  const now = Math.min(Math.max(raw, 0), s.weeks);
  const firstOpen = rows.find((r) => r.status !== 'done');
  const points: Point[] = rows.map((r) => ({
    ...r,
    state: r.status === 'done' ? 'done' : r.status === 'doing' ? 'doing' : r.to + 1 < raw ? 'due' : r === firstOpen ? 'next' : 'later',
  }));
  const done = points.filter((p) => p.state === 'done');
  const left = points.filter((p) => p.state !== 'done');
  const pct = Math.round((done.length / points.length) * 100);
  const next = left.find((p) => p.state !== 'due') ?? left[0];
  const date = (w: number) => weekDate(s.start, w, 4).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const where = raw < 0 ? t('trk.before', { date: date(0) }) : raw >= s.weeks ? t('trk.after') : t('trk.week', { w: Math.floor(raw) + 1, n: s.weeks });
  const at = (w: number) => `${Math.min(100, (w / s.weeks) * 100)}%`;
  const list = (items: Point[]) => (
    <ul>
      {items.slice(0, 4).map((p) => <li key={p.id} className={`is-${p.state}`}><i />{p.title}</li>)}
      {items.length > 4 && <li className="trk-more">{t('trk.more', { n: items.length - 4 })}</li>}
    </ul>
  );

  return (
    <section className="trk" aria-label={t('trk.label')}>
      <div className="trk-top">
        <div className="trk-pct" role="img" aria-label={`${pct}% ${t('trk.pct')}`}><b>{pct}<small>%</small></b><span>{t('trk.pct')} · {done.length}/{points.length}</span></div>
        <span className="trk-where">{where}</span>
      </div>

      <div className="trk-line" aria-hidden="true">
        <span className="trk-rail" />
        <span className="trk-fill" style={{ width: at(now) }} />
        {raw >= 0 && raw < s.weeks && <span className="trk-today" style={{ left: at(now) }}><em>{t('trk.today')}</em></span>}
        {points.map((p, i) => (
          // Deliveries due the same week sit side by side instead of on top of each other.
          <span key={p.id} className={`trk-node is-${p.state}`} style={{ left: at(p.to + 1), marginLeft: `${(-11 + points.slice(0, i).filter((q) => q.to === p.to).length * 16) / 16}rem` }} title={`${p.title} · ${date(p.to)}`}>
            {p.state === 'done' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>}
          </span>
        ))}
      </div>
      <div className="trk-ends" aria-hidden="true"><span>{date(0)}</span><span>{date(s.weeks - 1)}</span></div>

      {next ? (
        <div className="trk-next">
          <span className="trk-lbl">{t('trk.next')}</span>
          <b>{next.title}</b>
          <span className="t-sm t-mute">{t('trk.by', { date: date(next.to) })}</span>
        </div>
      ) : <div className="trk-next is-all"><b>{t('trk.all')}</b></div>}

      <div className="trk-cols">
        <div className="trk-col"><span className="trk-lbl">{t('trk.done')} · {done.length}</span>{done.length ? list(done) : <p className="t-sm t-mute">—</p>}</div>
        <div className="trk-col"><span className="trk-lbl">{t('trk.left')} · {left.length}</span>{left.length ? list(left) : <p className="t-sm t-mute">—</p>}</div>
      </div>
    </section>
  );
}
