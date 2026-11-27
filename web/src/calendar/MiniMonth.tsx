import { useI18n } from '../i18n/I18nProvider';

export const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** Phones: the month as a small grid with a colored dot per item; tapping a day narrows the agenda below to it.
 *  `count`: the number of items in the first item's color instead of dots, in a compact grid (requests, audit K1). */
export function MiniMonth({ days, month, dots, selected, onSelect, count = false }: {
  days: Date[]; month: Date; dots: Map<string, string[]>; selected: string | null; onSelect: (k: string | null) => void; count?: boolean;
}) {
  const { t, lang } = useI18n();
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const today = dayKey(new Date());
  // Spanish uses X for miércoles so it does not read like martes (M M).
  const weekdays = lang === 'es' ? ['L', 'M', 'X', 'J', 'V', 'S', 'D'] : Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'narrow' }));
  return (
    <div className={`cal-mini-wrap${count ? ' is-count' : ''}`}>
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
              {count ? <span className="cal-mini-n" style={{ color: list[0] }}>{list.length || ''}</span>
                : <span className="cal-mini-dots">{list.slice(0, 3).map((c, i) => <i key={i} style={{ background: c }} />)}</span>}
            </button>
          );
        })}
      </div>
      {selected && <button type="button" className="btn btn-ghost btn-sm self-start" onClick={() => onSelect(null)}>{t('cal.allMonth')}</button>}
    </div>
  );
}
