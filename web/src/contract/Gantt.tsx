import { Fragment, type CSSProperties } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { MILESTONE, TONE_COLOR, todayIndex, type GanttRow, type Schedule, type Tone } from './types';

// The activity column stays visible while the bars scroll; on phones it shrinks so the bars keep room.
const LABEL_W = 'min(240px, 40vw)';
const COL_MIN = 76;
const cell: CSSProperties = { borderBottom: '1px solid var(--line)', padding: '10px 12px' };

/** Block 2 · The work plan as a Gantt: one column per period, a bar per activity, contract deliverables in orange.
 *  Delivered milestones show a check. Scrolls sideways on phones; the activity column stays put. */
export function Gantt({ s, onToggle }: { s: Schedule; onToggle?: (section: number, row: number, done: boolean) => void }) {
  const { t } = useI18n();
  const n = s.periods.length;
  const today = todayIndex(s);
  const tones = [...new Set(s.sections.flatMap((x) => x.rows.filter((r) => !r.milestone).map((r) => r.tone)))] as Tone[];
  const grid: CSSProperties = { display: 'grid', gridTemplateColumns: `${LABEL_W} repeat(${n}, minmax(${COL_MIN}px, 1fr))`, minWidth: `calc(${LABEL_W} + ${n * COL_MIN}px)` };
  const sticky: CSSProperties = { position: 'sticky', left: 0, zIndex: 2, background: 'var(--white)', borderRight: '1px solid var(--line)' };

  return (
    <section className="col g16" aria-labelledby="plan-gantt">
      <div className="col g4">
        <p className="label">{t('plan.b2')}</p>
        <h2 id="plan-gantt" className="h2">{s.title || t('plan.ganttTitle')}</h2>
        {s.note && <p className="t-sm t-mute" style={{ margin: 0, maxWidth: 720 }}>{s.note}</p>}
      </div>
      <div className="row g16 t-sm" style={{ flexWrap: 'wrap' }} aria-label={t('plan.legend')}>
        {tones.map((k) => <span key={k} className="row g8"><i style={{ width: 22, height: 10, borderRadius: 4, background: TONE_COLOR[k] }} />{t(`plan.tone.${k}`)}</span>)}
        <span className="row g8"><i style={{ width: 22, height: 10, borderRadius: 4, background: MILESTONE }} />{t('plan.deliverable')}</span>
        {today >= 0 && <span className="row g8"><i style={{ width: 2, height: 14, background: '#E0428A' }} />{t('plan.today')}</span>}
      </div>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <div role="table" aria-label={s.title || t('plan.ganttTitle')} style={grid}>
          <div role="row" style={{ display: 'contents' }}>
            <div role="columnheader" className="label" style={{ ...cell, ...sticky, background: 'var(--niebla)' }}>{t('plan.activity')}</div>
            {s.periods.map((p, i) => (
              <div key={i} role="columnheader" style={{ ...cell, textAlign: 'center', background: i === today ? '#FDEFF5' : 'var(--niebla)' }}>
                <div className="w9 t-sm" style={{ color: i === today ? '#C2185B' : 'var(--azul)' }}>{p.label}</div>
                {p.sub && <div className="t-mute" style={{ fontSize: 11 }}>{p.sub}</div>}
              </div>
            ))}
          </div>
          {s.meetings && (
            <div role="row" style={{ display: 'contents' }}>
              <div role="rowheader" style={{ ...cell, ...sticky }}><div className="w7 t-sm">{s.meetings.label}</div>{s.meetings.detail && <div className="t-mute" style={{ fontSize: 12 }}>{s.meetings.detail}</div>}</div>
              {s.periods.map((_, i) => (
                <div key={i} role="cell" style={{ ...cell, padding: '10px 4px' }}>
                  <div className="t-sm" style={{ border: '1px solid #C9D3FF', background: '#F3F6FF', borderRadius: 6, textAlign: 'center', fontSize: 11, padding: '3px 2px', color: 'var(--azul)' }}>{s.meetings!.cells?.[i] ?? '·'}</div>
                </div>
              ))}
            </div>
          )}
          {s.sections.map((sec, si) => (
            <Fragment key={si}>
              <div role="row" style={{ display: 'contents' }}>
                <div role="rowheader" className="label" style={{ ...cell, ...sticky, background: '#F8F9FC', color: 'var(--azul)' }}>{sec.title}</div>
                <div style={{ ...cell, gridColumn: `span ${n}`, background: '#F8F9FC' }} />
              </div>
              {sec.rows.map((r, ri) => <Bar key={ri} r={r} n={n} today={today} sticky={sticky} onToggle={onToggle && ((d) => onToggle(si, ri, d))} />)}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function Bar({ r, n, today, sticky, onToggle }: { r: GanttRow; n: number; today: number; sticky: CSSProperties; onToggle?: (done: boolean) => void }) {
  const { t } = useI18n();
  const late = r.milestone && !r.done && today > r.to;
  const fill = r.milestone ? MILESTONE : TONE_COLOR[r.tone];
  const text = r.milestone ? `${r.done ? '✓ ' : ''}${r.label ?? ''}` : r.label ?? '';
  return (
    <div role="row" style={{ display: 'contents' }}>
      <div role="rowheader" style={{ ...cell, ...sticky }}>
        <div className="row g8" style={{ alignItems: 'flex-start' }}>
          {r.milestone && <span aria-hidden="true" style={{ color: '#F26B1D' }}>⚡</span>}
          <div className="col" style={{ minWidth: 0 }}>
            <span className="w7 t-sm">{r.name}</span>
            {r.detail && <span className="t-mute" style={{ fontSize: 12, lineHeight: '16px' }}>{r.detail}</span>}
            {r.milestone && (onToggle ? (
              <label className="row g4" style={{ fontSize: 12, marginTop: 4, cursor: 'pointer' }}>
                <input type="checkbox" checked={r.done} onChange={(e) => onToggle(e.target.checked)} />{t('plan.markDelivered')}
              </label>
            ) : (r.done || late) && <span className="w7" style={{ fontSize: 12, marginTop: 4, color: r.done ? '#0E8A5F' : '#B45309' }}>{r.done ? t('plan.st.delivered') : t('plan.inReview')}</span>)}
          </div>
        </div>
      </div>
      <div role="cell" style={{ ...cell, gridColumn: `span ${n}`, display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, alignItems: 'center', padding: '10px 0', position: 'relative' }}>
        {today >= 0 && <i aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: `${((today + 0.5) / n) * 100}%`, width: 2, background: '#E0428A', opacity: 0.55 }} />}
        <div title={`${r.name}${r.done ? ` · ${t('plan.st.delivered')}` : ''}`} style={{
          gridColumn: `${r.from + 1} / ${r.to + 2}`, height: 26, margin: '0 4px', borderRadius: 6, background: fill, opacity: r.done || !r.milestone ? 1 : 0.85,
          color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: r.milestone ? '0 4px 14px rgba(242,107,29,.35)' : undefined, whiteSpace: 'nowrap', overflow: 'hidden',
        }}>{text}</div>
        {r.ready !== undefined && (
          <div style={{ gridColumn: `${r.to + 2} / ${r.ready + 2}`, height: 26, margin: '0 4px', borderRadius: 6, border: '1px solid #9DB0FF', background: '#F3F6FF', color: 'var(--azul)', fontSize: 11, fontWeight: 800, letterSpacing: '.06em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {t('plan.ready').toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
