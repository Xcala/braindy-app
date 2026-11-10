/** NicoMarca works from the San Francisco studio: Monday to Friday, 7:00 to 19:00 San Francisco time, off on US federal holidays.
 *  The Brains work 24/7. Any moment can be simulated with ?hora=2026-11-26T21:30 (read as San Francisco time). */
const SF = 'America/Los_Angeles';
// UTC offset of San Francisco at a moment, in ms (it changes with daylight saving).
const sfOffset = (t) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: SF, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
        .formatToParts(t).map((x) => [x.type, Number(x.value)]));
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - Math.floor(t / 6e4) * 6e4;
};
export const OPEN_HOUR = 7;
const CLOSE_HOUR = 19;
const sim = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('hora') : null;
const simWall = sim ? Date.parse(sim + (sim.length <= 16 ? ':00' : '') + 'Z') : NaN;
const simMs = Number.isNaN(simWall) ? NaN : simWall - sfOffset(simWall);
const offset = Number.isNaN(simMs) ? 0 : simMs - Date.now();
/** True when ?hora= is simulating another moment (the studio shows a notice so nobody mistakes it for the real time). */
export const isSimulated = offset !== 0;
/** Now, or the simulated moment when the page has ?hora=. */
export const studioNow = () => new Date(Date.now() + offset);
// A Date whose UTC fields read as San Francisco wall time.
const sf = (d) => new Date(d.getTime() + sfOffset(d.getTime()));
const ymd = (y, m, d) => Date.UTC(y, m, d);
const nth = (y, m, wd, n) => { const first = new Date(ymd(y, m, 1)).getUTCDay(); return ymd(y, m, 1 + ((wd - first + 7) % 7) + (n - 1) * 7); };
const last = (y, m, wd) => { const end = new Date(ymd(y, m + 1, 0)); return ymd(y, m, end.getUTCDate() - ((end.getUTCDay() - wd + 7) % 7)); };
// Fixed-date holidays move to Friday when they fall on Saturday and to Monday on Sunday.
const observed = (t) => { const wd = new Date(t).getUTCDay(); return t + (wd === 6 ? -1 : wd === 0 ? 1 : 0) * 864e5; };
const cache = {};
function holidays(y) {
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
const dayStart = (b) => ymd(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
const holiday = (b) => holidays(b.getUTCFullYear()).get(dayStart(b))
    ?? (b.getUTCMonth() === 11 && b.getUTCDate() === 31 ? holidays(b.getUTCFullYear() + 1).get(dayStart(b)) : undefined);
const workday = (b) => b.getUTCDay() !== 0 && b.getUTCDay() !== 6 && !holiday(b);
/** Whether NicoMarca is in the office; if not, when he is back (`back` reads as San Francisco time in its UTC fields). */
export function officeState(d = studioNow()) {
    const b = sf(d), h = b.getUTCHours();
    if (workday(b) && h >= OPEN_HOUR && h < CLOSE_HOUR)
        return { open: true };
    let day = dayStart(b) + (workday(b) && h < OPEN_HOUR ? 0 : 864e5);
    while (!workday(new Date(day)))
        day += 864e5;
    return { open: false, holiday: holiday(b), back: new Date(day + OPEN_HOUR * 3600e3), days: Math.round((day - dayStart(b)) / 864e5) };
}
/** NicoMarca wears a different outfit each weekday (San Francisco); photo, loop and his close-up share the file suffix. */
export const outfit = (d = studioNow()) => ['', '', '-mar', '-mie', '-jue', '-vie', ''][sf(d).getUTCDay()];
