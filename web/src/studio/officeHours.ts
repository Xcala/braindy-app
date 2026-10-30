/** NicoMarca's office hours: Monday to Friday, 7:00 to 19:00 Bogotá time, off on US federal holidays. The Brains work 24/7.
 *  Any moment can be simulated with ?hora=2026-11-26T21:30 (read as Bogotá time). */
const BOG = -5; // Bogotá is UTC-5 all year (no daylight saving)
export const OPEN_HOUR = 7;
const CLOSE_HOUR = 19;

const sim = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('hora') : null;
const simMs = sim ? Date.parse(sim + (sim.length <= 16 ? ':00' : '') + '-05:00') : NaN;
const offset = Number.isNaN(simMs) ? 0 : simMs - Date.now();
/** True when ?hora= is simulating another moment (the studio shows a notice so nobody mistakes it for the real time). */
export const isSimulated = offset !== 0;
/** Now, or the simulated moment when the page has ?hora=. */
export const studioNow = () => new Date(Date.now() + offset);

// A Date whose UTC fields read as Bogotá wall time.
const bog = (d: Date) => new Date(d.getTime() + BOG * 3600e3);
const ymd = (y: number, m: number, d: number) => Date.UTC(y, m, d);
const nth = (y: number, m: number, wd: number, n: number) => { const first = new Date(ymd(y, m, 1)).getUTCDay(); return ymd(y, m, 1 + ((wd - first + 7) % 7) + (n - 1) * 7); };
const last = (y: number, m: number, wd: number) => { const end = new Date(ymd(y, m + 1, 0)); return ymd(y, m, end.getUTCDate() - ((end.getUTCDay() - wd + 7) % 7)); };
// Fixed-date holidays move to Friday when they fall on Saturday and to Monday on Sunday.
const observed = (t: number) => { const wd = new Date(t).getUTCDay(); return t + (wd === 6 ? -1 : wd === 0 ? 1 : 0) * 864e5; };

const cache: Record<number, Map<number, string>> = {};
function holidays(y: number) {
  return (cache[y] ??= new Map([
    [observed(ymd(y, 0, 1)), 'New Year'],
    [nth(y, 0, 1, 3), 'Martin Luther King Jr. Day'],
    [nth(y, 1, 1, 3), 'Presidents Day'],
    [last(y, 4, 1), 'Memorial Day'],
    [observed(ymd(y, 5, 19)), 'Juneteenth'],
    [observed(ymd(y, 6, 4)), 'Independence Day'],
    [nth(y, 8, 1, 1), 'Labor Day'],
    [nth(y, 9, 1, 2), 'Columbus Day'],
    [observed(ymd(y, 10, 11)), 'Veterans Day'],
    [nth(y, 10, 4, 4), 'Thanksgiving'],
    [observed(ymd(y, 11, 25)), 'Christmas'],
  ]));
}
const dayStart = (b: Date) => ymd(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
const holiday = (b: Date) => holidays(b.getUTCFullYear()).get(dayStart(b))
  ?? (b.getUTCMonth() === 11 && b.getUTCDate() === 31 ? holidays(b.getUTCFullYear() + 1).get(dayStart(b)) : undefined);
const workday = (b: Date) => b.getUTCDay() !== 0 && b.getUTCDay() !== 6 && !holiday(b);

export type Office = { open: true } | { open: false; holiday?: string; back: Date; days: number };

/** Whether NicoMarca is in the office; if not, when he is back (`back` reads as Bogotá time in its UTC fields). */
export function officeState(d = studioNow()): Office {
  const b = bog(d), h = b.getUTCHours();
  if (workday(b) && h >= OPEN_HOUR && h < CLOSE_HOUR) return { open: true };
  let day = dayStart(b) + (workday(b) && h < OPEN_HOUR ? 0 : 864e5);
  while (!workday(new Date(day))) day += 864e5;
  return { open: false, holiday: holiday(b), back: new Date(day + OPEN_HOUR * 3600e3), days: Math.round((day - dayStart(b)) / 864e5) };
}

/** NicoMarca wears a different outfit each weekday (Bogotá); photo, loop and his close-up share the file suffix. */
export const outfit = (d = studioNow()) => ['', '', '-mar', '-mie', '-jue', '-vie', ''][bog(d).getUTCDay()];
