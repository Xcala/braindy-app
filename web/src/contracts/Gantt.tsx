import { Fragment, type CSSProperties } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import type { RowStatus, Schedule, ScheduleRow, Tone } from './types';
import { weekDate } from './text';

/** Bar colors by kind of work: the Brains' palette, so the schedule reads like the rest of the app. */
export const TONE_COLOR: Record<Tone, string> = {
  strategy: '#F5B301', brand: '#06B6D4', content: '#8B5CF6', web: '#2A7FFF', agents: '#2F4DE0', ads: '#E0428A', knowledge: '#10B981',
};
const BY_GROUP: Tone[] = ['brand', 'agents', 'strategy', 'web', 'content', 'knowledge', 'ads'];
const MILESTONE = 'linear-gradient(90deg,#F26B1D,#F7943C)';
const TODAY = '#E0428A';
// The activity column stays put while the weeks scroll; on phones it shrinks so the bars keep room.
const LABEL_W = 'min(240px, 40vw)';
const COL_MIN = 44;
const cell: CSSProperties = { borderBottom: '1px solid var(--line)', padding: '8px 10px' };

/** Week (0-based) that contains today, or -1 outside the schedule. */
export const todayWeek = (s: Schedule) => {
  const w = Math.floor((Date.now() - Date.parse(`${s.start}T00:00:00Z`)) / (7 * 864e5));
  return w >= 0 && w < s.weeks ? w : -1;
};

/** Contract deliveries done vs total. */
export const deliveries = (s: Schedule) => {
  const ms = s.groups.flatMap((g) => g.rows.filter((r) => r.milestone));
  return { done: ms.filter((r) => r.status === 'done').length, total: ms.length };
};

/** The schedule by week (Anexo 2 of the contract, then the live one): a band of months, one column per week, a bar per
 *  activity colored by kind of work, contract deliveries in orange with ⚡ and a check once delivered, and today's week.
 *  With onStatus (admin) each delivery can be ticked as delivered. */
export function Gantt({ schedule: s, onStatus }: { schedule: Schedule; onStatus?: (group: number, row: number, status: RowStatus) => void }) {
  const { t, lang } = useI18n();
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const n = s.weeks;
  const today = todayWeek(s);
  const toneOf = (r: ScheduleRow, gi: number) => r.tone ?? BY_GROUP[gi % BY_GROUP.length];
  const tones = [...new Set(s.groups.flatMap((g, gi) => g.rows.filter((r) => !r.milestone).map((r) => toneOf(r, gi))))];
  const months: Array<{ label: string; span: number }> = [];
  for (let w = 0; w < n; w++) {
    const label = weekDate(s.start, w).toLocaleDateString(locale, { month: 'short', year: '2-digit', timeZone: 'UTC' });
    if (months.at(-1)?.label === label) months.at(-1)!.span++; else months.push({ label, span: 1 });
  }
  const grid: CSSProperties = { display: 'grid', gridTemplateColumns: `${LABEL_W} repeat(${n}, minmax(${COL_MIN}px, 1fr))`, minWidth: `calc(${LABEL_W} + ${n * COL_MIN}px)` };
  const sticky: CSSProperties = { position: 'sticky', left: 0, zIndex: 2, background: 'var(--white)', borderRight: '1px solid var(--line)' };
  const head: CSSProperties = { ...cell, background: 'var(--niebla)', textAlign: 'center', padding: '6px 2px' };
  const wd = t(`ctr.wd.${s.meeting.weekday}` as StringKey);

  return (
    <div className="col g12">
      <div className="row g16 t-sm" style={{ flexWrap: 'wrap' }} aria-label={t('plan.legend')}>
        {tones.map((k) => <span key={k} className="row g8"><i style={{ width: '1.375rem', height: '0.625rem', borderRadius: '0.25rem', background: TONE_COLOR[k] }} />{t(`plan.tone.${k}`)}</span>)}
        <span className="row g8"><i style={{ width: '1.375rem', height: '0.625rem', borderRadius: '0.25rem', background: MILESTONE }} />{t('ctr.milestone')}</span>
        {today >= 0 && <span className="row g8"><i style={{ width: 2, height: '0.875rem', background: TODAY }} />{t('plan.today')}</span>}
      </div>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }} role="region" aria-label={t('ctr.gantt')} tabIndex={0}>
        <div role="table" aria-label={t('ctr.gantt')} style={grid}>
          <div role="row" style={{ display: 'contents' }}>
            <div role="columnheader" className="label" style={{ ...cell, ...sticky, background: 'var(--niebla)', gridRow: 'span 2', display: 'flex', alignItems: 'flex-end' }}>{t('plan.activity')}</div>
            {months.map((m, i) => <div key={i} role="columnheader" className="label" style={{ ...head, gridColumn: `span ${m.span}`, color: 'var(--azul)', borderLeft: i ? '1px solid var(--line)' : undefined }}>{m.label}</div>)}
          </div>
          <div role="row" style={{ display: 'contents' }}>
            {Array.from({ length: n }, (_, w) => (
              <div key={w} role="columnheader" style={{ ...head, background: w === today ? '#FDEFF5' : 'var(--niebla)' }}>
                <div className="w9" style={{ fontSize: '0.75rem', color: w === today ? '#C2185B' : 'var(--ink)' }}>{t('ctr.weekShort', { n: w + 1 })}</div>
                <div className="t-mute" style={{ fontSize: '0.625rem' }}>{weekDate(s.start, w).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' })}</div>
              </div>
            ))}
          </div>
          <div role="row" style={{ display: 'contents' }}>
            <div role="rowheader" style={{ ...cell, ...sticky }}><div className="w7 t-sm">{t('plan.meeting', { minutes: s.meeting.minutes })}</div><div className="t-mute" style={{ fontSize: '0.75rem' }}>{wd} · {s.meeting.time}</div></div>
            {Array.from({ length: n }, (_, w) => <div key={w} role="cell" style={{ ...cell, padding: '0.5rem 0.1875rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><i aria-hidden="true" style={{ width: '0.5rem', height: '0.5rem', borderRadius: '6.1875rem', background: w < today ? '#9DB0FF' : '#C9D3FF', border: w === today ? `2px solid ${TODAY}` : undefined }} /></div>)}
          </div>
          {s.groups.map((g, gi) => (
            <Fragment key={g.id}>
              <div role="row" style={{ display: 'contents' }}>
                <div role="rowheader" className="label" style={{ ...cell, ...sticky, background: '#F8F9FC', color: 'var(--azul)' }}>{g.title}</div>
                <div style={{ ...cell, gridColumn: `span ${n}`, background: '#F8F9FC' }} />
              </div>
              {g.rows.map((r, ri) => <Bar key={r.id} r={r} n={n} today={today} fill={r.milestone ? MILESTONE : TONE_COLOR[toneOf(r, gi)]} sticky={sticky}
                onDone={onStatus && r.milestone ? (d) => onStatus(gi, ri, d ? 'done' : 'pending') : undefined} />)}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function Bar({ r, n, today, fill, sticky, onDone }: { r: ScheduleRow; n: number; today: number; fill: string; sticky: CSSProperties; onDone?: (done: boolean) => void }) {
  const { t } = useI18n();
  const done = r.status === 'done';
  const late = r.milestone && !done && today > r.to;
  const text = r.milestone ? `${done ? '✓ ' : ''}${r.label ?? ''}` : r.label ?? (done ? '✓' : '');
  const status = r.status === 'blocked' ? { color: '#B42318', text: t('ctr.st.blocked') } : done ? { color: '#0E8A5F', text: t('ctr.delivered') } : late ? { color: '#B45309', text: t('plan.inReview') } : null;
  return (
    <div role="row" style={{ display: 'contents' }}>
      <div role="rowheader" style={{ ...cell, ...sticky }}>
        <div className="row g8" style={{ alignItems: 'flex-start' }}>
          {r.milestone && <span aria-hidden="true" style={{ color: '#F26B1D' }}>⚡</span>}
          <div className="col" style={{ minWidth: 0 }}>
            <span className={`t-sm ${r.milestone ? 'w9' : 'w7'}`}>{r.title}</span>
            {r.note && <span className="t-mute" style={{ fontSize: '0.75rem', lineHeight: '16px' }}>{r.note}</span>}
            {onDone ? (
              <label className="row g4" style={{ fontSize: '0.75rem', marginTop: '0.25rem', cursor: 'pointer' }}><input type="checkbox" checked={done} onChange={(e) => onDone(e.target.checked)} />{t('ctr.delivered')}</label>
            ) : status && <span className="w7" style={{ fontSize: '0.75rem', marginTop: 2, color: status.color }}>{status.text}</span>}
          </div>
        </div>
      </div>
      <div role="cell" style={{ ...cell, gridColumn: `span ${n}`, display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, alignItems: 'center', padding: '0.5rem 0', position: 'relative' }}>
        {today >= 0 && <i aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: `${((today + 0.5) / n) * 100}%`, width: 2, background: TODAY, opacity: 0.5 }} />}
        <div title={`${r.title} · ${t(`ctr.st.${r.status}`)}`} style={{
          gridColumn: `${r.from + 1} / ${r.to + 2}`, height: '1.5rem', margin: '0 0.1875rem', borderRadius: '0.375rem', background: fill,
          opacity: r.status === 'pending' && !r.milestone ? 0.75 : 1, outline: r.status === 'blocked' ? '2px solid #B42318' : undefined,
          color: '#fff', fontSize: '0.625rem', fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: r.milestone ? '0 4px 14px rgba(242,107,29,.35)' : undefined, whiteSpace: 'nowrap', overflow: 'hidden',
        }}>{text}</div>
      </div>
    </div>
  );
}
