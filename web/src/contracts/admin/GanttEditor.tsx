import { useI18n } from '../../i18n/I18nProvider';
import type { StringKey } from '../../i18n/strings';
import { Gantt } from '../Gantt';
import type { RowStatus, Schedule, ScheduleGroup, ScheduleRow } from '../types';

const STATUSES: RowStatus[] = ['pending', 'doing', 'done', 'blocked'];
const uid = () => Math.random().toString(36).slice(2, 8);

/** Edit the schedule: start, weeks, weekly meeting, groups (stages) and rows (activities or deliveries). */
export function GanttEditor({ schedule, onChange }: { schedule: Schedule; onChange: (s: Schedule) => void }) {
  const { t } = useI18n();
  const weeks = Array.from({ length: schedule.weeks }, (_, w) => w);
  const setGroup = (gi: number, g: ScheduleGroup) => onChange({ ...schedule, groups: schedule.groups.map((x, i) => (i === gi ? g : x)) });
  const setRow = (gi: number, ri: number, r: Partial<ScheduleRow>) => {
    const g = schedule.groups[gi];
    const rows = g.rows.map((x, i) => (i === ri ? { ...x, ...r } : x)).map((x) => ({ ...x, to: x.milestone ? x.from : Math.max(x.from, x.to) }));
    setGroup(gi, { ...g, rows });
  };
  const weekSelect = (value: number, onPick: (w: number) => void, label: string) => (
    <select className="input" style={{ width: 76 }} value={value} onChange={(e) => onPick(Number(e.target.value))} aria-label={label}>
      {weeks.map((w) => <option key={w} value={w}>{t('ctr.weekShort', { n: w + 1 })}</option>)}
    </select>
  );

  return (
    <div className="col g16">
      <div className="row g12 wrap t-sm">
        <label className="col g4"><span className="w7">{t('ctr.g.start')}</span><input className="input" type="date" value={schedule.start} onChange={(e) => onChange({ ...schedule, start: e.target.value })} /></label>
        <label className="col g4"><span className="w7">{t('ctr.g.weeks')}</span><input className="input" type="number" min={1} max={52} style={{ width: 90 }} value={schedule.weeks} onChange={(e) => onChange({ ...schedule, weeks: Math.max(1, Math.min(52, Number(e.target.value) || 1)) })} /></label>
        <label className="col g4"><span className="w7">{t('ctr.g.meetingDay')}</span>
          <select className="input" value={schedule.meeting.weekday} onChange={(e) => onChange({ ...schedule, meeting: { ...schedule.meeting, weekday: Number(e.target.value) } })}>
            {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{t(`ctr.wd.${d}` as StringKey)}</option>)}
          </select></label>
        <label className="col g4"><span className="w7">{t('ctr.g.meetingTime')}</span><input className="input" type="time" value={schedule.meeting.time} onChange={(e) => onChange({ ...schedule, meeting: { ...schedule.meeting, time: e.target.value } })} /></label>
      </div>

      {schedule.groups.map((g, gi) => (
        <div key={g.id} className="col g8" style={{ background: '#F7F8FB', borderRadius: 14, padding: 14 }}>
          <div className="row g8">
            <input className="input w7" value={g.title} placeholder={t('ctr.g.stage')} aria-label={t('ctr.g.stage')} onChange={(e) => setGroup(gi, { ...g, title: e.target.value })} />
            <button className="btn btn-ghost btn-sm" onClick={() => onChange({ ...schedule, groups: schedule.groups.filter((_, i) => i !== gi) })}>{t('ctr.g.removeStage')}</button>
          </div>
          {g.rows.map((r, ri) => (
            <div key={r.id} className="row g8 wrap" style={{ alignItems: 'center' }}>
              <input className="input" style={{ flex: '1 1 220px' }} value={r.title} placeholder={t('ctr.g.activity')} aria-label={t('ctr.g.activity')} onChange={(e) => setRow(gi, ri, { title: e.target.value })} />
              {weekSelect(r.from, (w) => setRow(gi, ri, { from: w }), t('ctr.g.from'))}
              {!r.milestone && weekSelect(r.to, (w) => setRow(gi, ri, { to: w }), t('ctr.g.to'))}
              <label className="row g4 t-xs"><input type="checkbox" checked={r.milestone} onChange={(e) => setRow(gi, ri, { milestone: e.target.checked })} />{t('ctr.milestone')}</label>
              <select className="input" style={{ width: 130 }} value={r.status} aria-label={t('ctr.g.status')} onChange={(e) => setRow(gi, ri, { status: e.target.value as RowStatus })}>
                {STATUSES.map((s) => <option key={s} value={s}>{t(`ctr.st.${s}`)}</option>)}
              </select>
              <button className="btn btn-ghost btn-sm" aria-label={t('ctr.g.removeRow')} onClick={() => setGroup(gi, { ...g, rows: g.rows.filter((_, i) => i !== ri) })}>×</button>
            </div>
          ))}
          <div className="row g8">
            <button className="btn btn-secondary btn-sm" onClick={() => setGroup(gi, { ...g, rows: [...g.rows, { id: uid(), title: '', note: '', from: 0, to: 0, milestone: false, status: 'pending' }] })}>{t('ctr.g.addRow')}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setGroup(gi, { ...g, rows: [...g.rows, { id: uid(), title: '', note: '', from: 0, to: 0, milestone: true, status: 'pending' }] })}>{t('ctr.g.addDelivery')}</button>
          </div>
        </div>
      ))}
      <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => onChange({ ...schedule, groups: [...schedule.groups, { id: uid(), title: '', rows: [] }] })}>{t('ctr.g.addStage')}</button>
      <Gantt schedule={schedule} />
    </div>
  );
}
