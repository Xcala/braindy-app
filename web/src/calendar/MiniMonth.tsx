import { useI18n } from '../i18n/I18nProvider';

export const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** Phones: the month as a small grid with a colored dot per item; tapping a day narrows the agenda below to it. */
export function MiniMonth({ days, month, dots, selected, onSelect }: {
  days: Date[]; month: Date; dots: Map<string, string[]>; selected: string | null; onSelect: (k: string | null) => void;
}) {
  const { t, lang } = useI18n();
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const today = dayKey(new Date());
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'narrow' }));
  return (
    <div className="cal-mini-wrap">
      <div className="cal-mini" role="grid">
        {weekdays.map((w, i) => <span key={i} className="cal-mini-wd" role="columnheader">{w}</span>)}
        {days.map((d) => {
          const k = dayKey(d);
          const list = dots.get(k) ?? [];
          const out = d.getMonth() !== month.getMonth();
          return (
            <button key={k} type="button" role="gridcell" disabled={!list.length} aria-pressed={selected === k}
              className={`cal-mini-day${out ? ' is-out' : ''}${k === today ? ' is-today' : ''}${selected === k ? ' is-sel' : ''}`}
              aria-label={`${d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}${list.length ? ` · ${list.length}` : ''}`}
              onClick={() => onSelect(selected === k ? null : k)}>
              <span className="cal-mini-num">{d.getDate()}</span>
              <span className="cal-mini-dots">{list.slice(0, 3).map((c, i) => <i key={i} style={{ background: c }} />)}</span>
            </button>
          );
        })}
      </div>
      {selected && <button type="button" className="btn btn-ghost btn-sm self-start" onClick={() => onSelect(null)}>{t('cal.allMonth')}</button>}
    </div>
  );
}
