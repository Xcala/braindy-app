// NicoMarca's office hours: Monday to Friday, 7:00 to 19:00 Bogotá time, except US federal holidays.
// The Brains work 24/7. Simulate any moment with ?hora=2026-11-26T10:00 (read as Bogotá time).
(() => {
  const BOG = -5; // Bogotá is UTC-5 all year (no daylight saving)
  const OPEN = 7, CLOSE = 19;

  // Clock offset so the whole page (wall clocks included) runs at the simulated time.
  const sim = new URLSearchParams(location.search).get('hora');
  const simMs = sim ? Date.parse(sim + (sim.length <= 16 ? ':00' : '') + '-05:00') : NaN;
  const offset = Number.isNaN(simMs) ? 0 : simMs - Date.now();
  const now = () => new Date(Date.now() + offset);

  // A Date whose UTC fields read as Bogotá wall time.
  const bog = (d) => new Date(d.getTime() + BOG * 3600e3);
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

  // { open, holiday?, back: Bogotá-time Date of the next opening, days: whole days until it }
  function estado(d = now()) {
    const b = bog(d), h = b.getUTCHours();
    if (workday(b) && h >= OPEN && h < CLOSE) return { open: true };
    let day = dayStart(b) + (workday(b) && h < OPEN ? 0 : 864e5);
    while (!workday(new Date(day))) day += 864e5;
    return { open: false, holiday: holiday(b), back: new Date(day + OPEN * 3600e3), days: Math.round((day - dayStart(b)) / 864e5) };
  }

  const dia = () => bog(now()).getUTCDay(); // 0 = Sunday, in Bogotá

  window.HORARIO = { now, estado, dia, OPEN };
})();
