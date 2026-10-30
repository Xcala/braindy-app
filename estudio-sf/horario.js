// NicoMarca works from the San Francisco studio: Monday to Friday, 7:00 to 19:00 San Francisco time, except US federal holidays.
// The Brains work 24/7. Simulate any moment with ?hora=2026-11-26T10:00 (read as San Francisco time).
(() => {
  // UTC offset of San Francisco at a moment, in ms (it changes with daylight saving).
  const sfOffset = (t) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
      .formatToParts(t).map((x) => [x.type, Number(x.value)]));
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - Math.floor(t / 6e4) * 6e4;
  };
  const OPEN = 7, CLOSE = 19;

  // Clock offset so the whole page (wall clocks included) runs at the simulated time.
  const sim = new URLSearchParams(location.search).get('hora');
  const wall = sim ? Date.parse(sim + (sim.length <= 16 ? ':00' : '') + 'Z') : NaN;
  const simMs = Number.isNaN(wall) ? NaN : wall - sfOffset(wall);
  const offset = Number.isNaN(simMs) ? 0 : simMs - Date.now();
  const now = () => new Date(Date.now() + offset);

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
      [observed(ymd(y, 0, 1)), 'Año Nuevo'],
      [nth(y, 0, 1, 3), 'Día de Martin Luther King'],
      [nth(y, 1, 1, 3), 'Día de los Presidentes'],
      [last(y, 4, 1), 'Memorial Day'],
      [observed(ymd(y, 5, 19)), 'Juneteenth'],
      [observed(ymd(y, 6, 4)), 'Día de la Independencia'],
      [nth(y, 8, 1, 1), 'Labor Day'],
      [nth(y, 9, 1, 2), 'Columbus Day'],
      [observed(ymd(y, 10, 11)), 'Día de los Veteranos'],
      [nth(y, 10, 4, 4), 'Thanksgiving'],
      [observed(ymd(y, 11, 25)), 'Navidad'],
    ]));
  }
  const dayStart = (b) => ymd(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  const holiday = (b) => holidays(b.getUTCFullYear()).get(dayStart(b)) ?? (b.getUTCMonth() === 11 && b.getUTCDate() === 31 ? holidays(b.getUTCFullYear() + 1).get(dayStart(b)) : undefined);
  const workday = (b) => b.getUTCDay() !== 0 && b.getUTCDay() !== 6 && !holiday(b);

  // { open, holiday?, back: San Francisco-time Date of the next opening, days: whole days until it }
  function estado(d = now()) {
    const b = sf(d), h = b.getUTCHours();
    if (workday(b) && h >= OPEN && h < CLOSE) return { open: true };
    let day = dayStart(b) + (workday(b) && h < OPEN ? 0 : 864e5);
    while (!workday(new Date(day))) day += 864e5;
    return { open: false, holiday: holiday(b), back: new Date(day + OPEN * 3600e3), days: Math.round((day - dayStart(b)) / 864e5) };
  }

  const dia = () => sf(now()).getUTCDay(); // 0 = Sunday, in San Francisco

  // The studio's light follows the real sun in San Francisco: night once it is 4° below the horizon.
  function sol(d = now()) {
    const r = Math.PI / 180, n = d.getTime() / 864e5 - 10957.5, lat = 37.77 * r;
    const g = (357.528 + 0.9856003 * n) * r;
    const l = (280.46 + 0.9856474 * n + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * r;
    const e = (23.439 - 0.0000004 * n) * r;
    const ra = Math.atan2(Math.cos(e) * Math.sin(l), Math.cos(l)), dec = Math.asin(Math.sin(e) * Math.sin(l));
    const ha = ((18.697374558 + 24.06570982441908 * n) * 15 - 122.42) * r - ra;
    return Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha)) / r;
  }
  const luz = () => (sol() < -4 ? 'noche' : 'dia');

  window.HORARIO = { now, estado, dia, luz, OPEN };
})();
