import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { toDay } from '../lib/dates';
import { isLate } from './requestFilters';
import type { BrandRequest, RequestStatus } from './types';
import { MiniMonth, dayKey } from '../calendar/MiniMonth';
import '../calendar/calendar.css';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const COLOR: Record<RequestStatus, string> = { in_production: 'var(--azul)', to_approve: '#E0A100', approved: 'var(--success)', published: 'var(--ink)' };
const LATE = '#D93025';
const color = (r: BrandRequest) => (isLate(r) ? LATE : COLOR[r.status]);
const isDone = (r: BrandRequest) => r.status === 'approved' || r.status === 'published';
/** Pending first in each day (late, to approve, in production); what is already delivered goes last. */
const rank = (r: BrandRequest) => (isLate(r) ? 0 : r.status === 'to_approve' ? 1 : r.status === 'in_production' ? 2 : 3);

/**
 * Deliveries by due date, the same month grid as the social calendar (a small month and the agenda on phones).
 * Audit K1/K2 (2026-11-26): a color legend; the requests without a date (most of the ones being worked on) get a card
 * that opens the list filtered to them; the agenda goes in date order (what is coming first, then what was delivered);
 * on the grid what is delivered reads faded with ✓, what is pending keeps its box, and «+N more» opens the day.
 */
export function DueCalendar({ shown }: { shown: BrandRequest[] }) {
  const { t, lang } = useI18n();
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [sel, setSel] = useState<string | null>(null);
  const [open, setOpen] = useState<string[]>([]);
  const start = useMemo(() => { const d = new Date(month); d.setDate(1 - ((d.getDay() + 6) % 7)); return d; }, [month]);
  const end = useMemo(() => { const d = new Date(month.getFullYear(), month.getMonth() + 1, 1); d.setDate(d.getDate() + ((8 - d.getDay()) % 7)); return d; }, [month]);

  const byDay = new Map<string, BrandRequest[]>();
  for (const r of shown) { const d = toDay(r.dueDate); if (d) byDay.set(dayKey(d), [...(byDay.get(dayKey(d)) ?? []), r]); }
  for (const l of byDay.values()) l.sort((a, b) => rank(a) - rank(b));
  const days: Date[] = [];
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) days.push(new Date(d));
  const inMonth = shown.filter((r) => { const d = toDay(r.dueDate); return d && d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear(); });
  const noDate = shown.filter((r) => !r.dueDate);
  const noDateWorking = noDate.filter((r) => r.status === 'in_production').length;
  const todayD = new Date(); todayD.setHours(0, 0, 0, 0);
  const today = dayKey(todayD);
  const move = (n: number) => { setSel(null); setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1)); };
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'short' }));
  // Agenda: from today on, soonest first; then the month's past days, most recent first.
  const agendaDays = [...new Set(inMonth.map((r) => dayKey(toDay(r.dueDate)!)))].map((k) => toDay(byDay.get(k)![0].dueDate)!);
  const coming = agendaDays.filter((d) => d >= todayD).sort((a, b) => +a - +b);
  const past = agendaDays.filter((d) => d < todayD).sort((a, b) => +b - +a);
  const delivered = inMonth.filter(isDone).length;

  const item = (r: BrandRequest, big = false) => (
    <Link key={r.id} to={`/requests/${r.id}`} className={big ? 'card cal-row' : `cal-post${isDone(r) ? ' is-done' : ''}`}
      style={{ '--c': color(r), textDecoration: 'none', padding: big ? undefined : '0.25rem 0.375rem' } as React.CSSProperties}
      title={`${r.title} · ${t(`req.status.${r.status}`)}`}>
      {!big && isDone(r) ? <span className="t-xs truncate">✓ {r.title}</span> : (
        <span className="col min-w-0" style={{ gap: 2 }}>
          <span className={`${big ? 't-sm' : 't-xs'} w7 truncate`}>{r.title}</span>
          <span className="t-xs t-mute truncate">{isLate(r) ? t('rf.tab.late') : t(`req.status.${r.status}`)}</span>
        </span>
      )}
    </Link>
  );
  const legend: Array<[string, string]> = [[COLOR.in_production, t('req.status.in_production')], [COLOR.to_approve, t('req.status.to_approve')],
    [COLOR.approved, t('req.status.approved')], [LATE, t('rf.tab.late')]];

  return (
    <div className="col g16">
      <div className="cal-bar">
        <div className="row g8">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => move(-1)} aria-label={t('cal.prev')}>‹</button>
          <h3 className="h3 cal-month" aria-live="polite">{cap(month.toLocaleDateString(locale, { month: 'long', year: 'numeric' }))}</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => move(1)} aria-label={t('cal.next')}>›</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSel(null); setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); }}>{t('cal.today')}</button>
        </div>
        <p className="t-sm t-mute" style={{ margin: 0 }}>{t('rv.withDate', { n: inMonth.length })}{delivered ? ` · ${t('rv.deliveredN', { n: delivered })}` : ''}</p>
      </div>
      <p className="cal-legend t-xs t-mute">{legend.map(([c, l]) => <span key={l}><i className="cal-dot" style={{ '--c': c } as React.CSSProperties} />{l}</span>)}</p>
      {noDate.length > 0 && (
        <Link to="/requests?view=list&due=none" className="card cal-nodate">
          <span className="col" style={{ gap: 2 }}><b>{t('rv.noDateCard', { n: noDate.length })}</b>{noDateWorking > 0 && <span className="t-xs t-mute">{t('rv.noDateSub', { n: noDateWorking })}</span>}</span>
          <span className="btn btn-secondary btn-sm">{t('rv.see')} ›</span>
        </Link>
      )}
      <div className="cal-grid" role="grid">
        {weekdays.map((w) => <div key={w} className="cal-wd" role="columnheader">{w}</div>)}
        {days.map((d) => {
          const k = dayKey(d);
          const list = byDay.get(k) ?? [];
          const all = open.includes(k);
          return (
            <div key={+d} role="gridcell" className={`cal-day${d.getMonth() !== month.getMonth() ? ' is-out' : ''}${k === today ? ' is-today' : ''}`}>
              <span className="cal-num">{d.getDate()}</span>
              {(all ? list : list.slice(0, 3)).map((r) => item(r))}
              {list.length > 3 && (
                <button type="button" className="cal-more" aria-expanded={all} onClick={() => setOpen((o) => (all ? o.filter((x) => x !== k) : [...o, k]))}>
                  {all ? t('cal.less') : t('cal.moreN', { n: list.length - 3 })}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <MiniMonth days={days} month={month} selected={sel} onSelect={setSel} count
        dots={new Map([...byDay].map(([k, l]) => [k, l.map(color)]))} />
      <div className="cal-agenda">
        {!sel && inMonth.length === 0 && <div className="card t-mute">{t('rv.noneThisMonth')}</div>}
        {(sel ? [sel] : [...coming, ...past].map(dayKey)).map((k) => {
          const list = byDay.get(k) ?? [];
          if (!list.length) return null;
          return (
            <section key={k} className="col g8">
              <h4 className="label" style={{ margin: 0 }}>{toDay(list[0].dueDate)!.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })} · {list.length}</h4>
              {list.map((r) => item(r, true))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
