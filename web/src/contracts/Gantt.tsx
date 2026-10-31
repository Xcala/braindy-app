import { useI18n } from '../i18n/I18nProvider';
import type { RowStatus, Schedule } from './types';
import { weekDate } from './text';

const COLOR: Record<RowStatus, string> = { pending: '#9FB1F5', doing: '#2F4DE0', done: '#0E7A4E', blocked: '#D23B3B' };
const LABEL_W = 230, COL_W = 38;

/** The schedule as a Gantt by week: groups, bars by status, diamonds for contract deliveries, today's week. */
export function Gantt({ schedule }: { schedule: Schedule }) {
  const { t, lang } = useI18n();
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const day = (d: Date) => d.toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const today = Math.floor((Date.now() - Date.parse(`${schedule.start}T00:00:00Z`)) / (7 * 864e5));
  const cols = `${LABEL_W}px repeat(${schedule.weeks}, ${COL_W}px)`;
  const week = (w: number) => ({ gridColumn: `${w + 2} / span 1` });

  return (
    <div style={{ overflowX: 'auto' }} role="region" aria-label={t('ctr.gantt')} tabIndex={0}>
      <div style={{ display: 'grid', gridTemplateColumns: cols, rowGap: 4, minWidth: LABEL_W + schedule.weeks * COL_W, position: 'relative' }}>
        <span />
        {Array.from({ length: schedule.weeks }, (_, w) => (
          <span key={w} className="t-xs" style={{ ...week(w), textAlign: 'center', color: w === today ? '#2F4DE0' : 'var(--mute, #6B7385)', fontWeight: w === today ? 800 : 600, lineHeight: 1.2 }}>
            {t('ctr.weekShort', { n: w + 1 })}<br /><span style={{ fontWeight: 400, fontSize: 10 }}>{day(weekDate(schedule.start, w))}</span>
          </span>
        ))}
        {schedule.groups.map((g) => [
          <span key={`${g.id}-t`} className="t-xs w9" style={{ gridColumn: '1 / -1', color: '#2F4DE0', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 10 }}>{g.title}</span>,
          ...g.rows.flatMap((r) => [
            <span key={`${r.id}-l`} className={`t-sm truncate ${r.milestone ? 'w7' : ''}`} title={r.note || r.title} style={{ gridColumn: 1, paddingRight: 8 }}>{r.title}</span>,
            r.milestone
              ? <span key={`${r.id}-b`} aria-label={`${r.title}: ${t('ctr.weekShort', { n: r.from + 1 })}`} style={{ ...week(r.from), justifySelf: 'center', alignSelf: 'center', width: 12, height: 12, transform: 'rotate(45deg)', background: r.status === 'done' ? COLOR.done : '#F07319', borderRadius: 2 }} />
              : <span key={`${r.id}-b`} aria-label={`${r.title}: ${t(`ctr.st.${r.status}`)}`} style={{ gridColumn: `${r.from + 2} / ${r.to + 3}`, alignSelf: 'center', height: 12, borderRadius: 6, background: COLOR[r.status], margin: '0 2px' }} />,
          ]),
        ])}
        {today >= 0 && today < schedule.weeks && (
          <span aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: LABEL_W + today * COL_W + COL_W / 2, width: 2, background: 'rgba(47,77,224,.25)' }} />
        )}
      </div>
      <div className="row g16 wrap t-xs t-mute" style={{ marginTop: 12 }}>
        {(['pending', 'doing', 'done', 'blocked'] as const).map((s) => <span key={s} className="row g4"><span style={{ width: 14, height: 8, borderRadius: 4, background: COLOR[s] }} />{t(`ctr.st.${s}`)}</span>)}
        <span className="row g4"><span style={{ width: 9, height: 9, transform: 'rotate(45deg)', background: '#F07319' }} />{t('ctr.milestone')}</span>
      </div>
    </div>
  );
}
