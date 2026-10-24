// Human dates for people, not machines: "hoy", "mañana", "jueves", "30 oct". ISO day strings (YYYY-MM-DD)
// are read as local noon so the day never shifts with the time zone.
type Lang = 'es' | 'en';

const WORDS = {
  es: { today: 'hoy', tomorrow: 'mañana', yesterday: 'ayer' },
  en: { today: 'today', tomorrow: 'tomorrow', yesterday: 'yesterday' },
};

export function toDay(v?: string | Date | null): Date | null {
  if (!v) return null;
  const d = typeof v === 'string' ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T12:00:00` : v) : v;
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Whole days from today (negative = past). */
export function daysFrom(v?: string | Date | null) {
  const d = toDay(v);
  if (!d) return null;
  const a = new Date(); a.setHours(12, 0, 0, 0);
  const b = new Date(d); b.setHours(12, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 864e5);
}

export function dayLabel(v: string | Date | null | undefined, lang: Lang) {
  const d = toDay(v);
  const n = daysFrom(d);
  if (!d || n == null) return '';
  const w = WORDS[lang];
  if (n === 0) return w.today;
  if (n === 1) return w.tomorrow;
  if (n === -1) return w.yesterday;
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  if (n > 1 && n < 7) return d.toLocaleDateString(locale, { weekday: 'long' });
  return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '');
}

export const isOverdue = (v?: string | Date | null) => (daysFrom(v) ?? 0) < 0;
