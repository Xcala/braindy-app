// Business hours on Bogotá time (UTC-5, no daylight saving): Monday to Friday count, weekends don't.
// The 48-hour delivery promise runs on this clock from the moment the client asks.
const OFFSET = 5 * 3600_000;
const DAY = 864e5;
export const SLA_HOURS = 48;

const local = (ms: number) => new Date(ms - OFFSET);
const isWeekend = (ms: number) => [0, 6].includes(local(ms).getUTCDay());
const nextMidnight = (ms: number) => { const d = local(ms); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) + DAY + OFFSET; };

/** The moment `hours` business hours after `start`. */
export function addBusinessHours(start: number, hours: number): number {
  let t = start, left = hours * 3600_000;
  while (left > 0) {
    const end = nextMidnight(t);
    if (isWeekend(t)) { t = end; continue; }
    const take = Math.min(left, end - t);
    t += take; left -= take;
  }
  return t;
}

/** Business milliseconds between two moments (0 if `to` is earlier). */
export function businessMsBetween(from: number, to: number): number {
  let t = from, sum = 0;
  while (t < to) {
    const end = Math.min(nextMidnight(t), to);
    if (!isWeekend(t)) sum += end - t;
    t = end;
  }
  return sum;
}
