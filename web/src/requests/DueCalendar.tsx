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
const color = (r: BrandRequest) => (isLate(r) ? '#D93025' : COLOR[r.status]);

/** Deliveries by due date, the same month grid as the social calendar (a small month and the agenda on phones). */
export function DueCalendar({ shown }: { shown: BrandRequest[] }) {
  const { t, lang } = useI18n();
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [sel, setSel] = useState<string | null>(null);
  const start = useMemo(() => { const d = new Date(month); d.setDate(1 - ((d.getDay() + 6) % 7)); return d; }, [month]);
  const end = useMemo(() => { const d = new Date(month.getFullYear(), month.getMonth() + 1, 1); d.setDate(d.getDate() + ((8 - d.getDay()) % 7)); return d; }, [month]);

  const byDay = new Map<string, BrandRequest[]>();
  for (const r of shown) { const d = toDay(r.dueDate); if (d) byDay.set(dayKey(d), [...(byDay.get(dayKey(d)) ?? []), r]); }
  const days: Date[] = [];
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) days.push(new Date(d));
  const inMonth = shown.filter((r) => { const d = toDay(r.dueDate); return d && d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear(); });
  const noDate = shown.filter((r) => !r.dueDate).length;
  const today = dayKey(new Date());
  const move = (n: number) => { setSel(null); setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1)); };
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'short' }));
  const item = (r: BrandRequest, big = false) => (
    <Link key={r.id} to={`/requests/${r.id}`} className={big ? 'card cal-row' : 'cal-post'} style={{ '--c': color(r), textDecoration: 'none', padding: big ? undefined : '4px 6px' } as React.CSSProperties}
      title={`${r.title} · ${t(`req.status.${r.status}`)}`}>
      <span className="col min-w-0" style={{ gap: 2 }}>
        <span className={`${big ? 't-sm' : 't-xs'} w7 truncate`}>{r.title}</span>
        <span className="t-xs t-mute truncate">{isLate(r) ? t('rf.tab.late') : t(`req.status.${r.status}`)}</span>
      </span>
    </Link>
  );

  return (
    <div className="col g16">
      <div className="cal-bar">
        <div className="row g8">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => move(-1)} aria-label={t('cal.prev')}>‹</button>
          <h3 className="h3 cal-month" aria-live="polite">{cap(month.toLocaleDateString(locale, { month: 'long', year: 'numeric' }))}</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => move(1)} aria-label={t('cal.next')}>›</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSel(null); setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); }}>{t('cal.today')}</button>
        </div>
        <p className="t-sm t-mute" style={{ margin: 0 }}>{t('rv.dueThisMonth', { n: inMonth.length })}{noDate ? ` · ${t('rv.noDate', { n: noDate })}` : ''}</p>
      </div>
      <div className="cal-grid" role="grid">
        {weekdays.map((w) => <div key={w} className="cal-wd" role="columnheader">{w}</div>)}
        {days.map((d) => {
          const list = byDay.get(dayKey(d)) ?? [];
          return (
            <div key={+d} role="gridcell" className={`cal-day${d.getMonth() !== month.getMonth() ? ' is-out' : ''}${dayKey(d) === today ? ' is-today' : ''}`}>
              <span className="cal-num">{d.getDate()}</span>
              {list.slice(0, 3).map((r) => item(r))}
              {list.length > 3 && <span className="cal-more">+{list.length - 3}</span>}
            </div>
          );
        })}
      </div>
      <MiniMonth days={days} month={month} selected={sel} onSelect={setSel}
        dots={new Map([...byDay].map(([k, l]) => [k, l.map(color)]))} />
      <div className="cal-agenda">
        {!sel && inMonth.length === 0 && <div className="card t-mute">{t('rv.noneThisMonth')}</div>}
        {(sel ? [sel] : [...new Set(inMonth.map((r) => dayKey(toDay(r.dueDate)!)))]).map((k) => {
          const list = byDay.get(k) ?? [];
          return (
            <section key={k} className="col g8">
              <h4 className="label" style={{ margin: 0 }}>{toDay(list[0].dueDate)!.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
              {list.map((r) => item(r, true))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
