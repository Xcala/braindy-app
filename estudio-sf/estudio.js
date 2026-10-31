// El Estudio (standalone): the SF office photo with its live layer, no app or database behind it.
// Geometry mirrors web/src/studio/geometry.ts (2000 × 1116 frame).
const SEATS = {
  nico: { c: '#FFFFFF', screen: [1240, 745], hot: [1540, 800, 440, 600], bub: [1790, 970] },
  researcher: { c: '#F5B301', screen: [600, 500], hot: [330, 460, 280, 300], bub: [330, 320] },
  marketer: { c: '#8B5CF6', screen: [1340, 500], hot: [1720, 470, 260, 300], bub: [1815, 335] },
  creator: { c: '#06B6D4', screen: [715, 740], hot: [430, 800, 360, 420], bub: [205, 930] },
  builder: { c: '#2A7FFF', screen: [995, 490], hot: [995, 400, 280, 300], bub: [995, 262] },
};
const ORDER = ['researcher', 'marketer', 'nico', 'creator', 'builder'];
const CLOSEUP = { nico: 'cu-nico', researcher: 'cu-res', marketer: 'cu-mkt', creator: 'cu-cre', builder: 'cu-bui' };
const NAME = { nico: 'NicoMarca', researcher: 'Researcher', marketer: 'Marketer', creator: 'Creator', builder: 'Builder' };

const T = {
  es: {
    hint: 'Toca a cualquiera para acercarte a su puesto', back: 'Ver todo el estudio', nothing: 'Trabajando en Braindy y Revista Level.', queue: 'En su cola', signQueue: 'Esperan tu firma',
    state: { working: 'Trabajando', withClient: 'Con el cliente', toSign: 'Esperan tu firma', free: 'Libre', away: 'Fuera de la oficina' },
    back7: (when) => `Vuelve ${when} a las 7:00 a. m. (hora San Francisco)`, today: 'hoy', tomorrow: 'mañana', on: (day) => `el ${day}`, onDesk: 'En su mesa',
    awayNote: 'Sus Brains siguen trabajando. NicoMarca revisa, ajusta y firma cuando vuelve.', holiday: (name) => `Festivo en EE. UU.: ${name}`,
    role: { nico: 'Dirige, diseña, codifica y firma', researcher: 'Investiga', marketer: 'Comunica', creator: 'Crea', builder: 'Construye' },
  },
  en: {
    hint: 'Tap anyone to zoom into their desk', back: 'See the whole studio', nothing: 'Working on Braindy and Revista Level.', queue: 'In their queue', signQueue: 'Waiting for your signature',
    state: { working: 'Working', withClient: 'With the client', toSign: 'Waiting for your signature', free: 'Free', away: 'Out of the office' },
    back7: (when) => `Back ${when} at 7:00 a.m. (San Francisco time)`, today: 'today', tomorrow: 'tomorrow', on: (day) => `on ${day}`, onDesk: 'On his desk',
    awayNote: 'His Brains keep working. NickMark reviews, adjusts and signs when he is back.', holiday: (name) => `US holiday: ${name}`,
    role: { nico: 'Directs, designs, codes and signs', researcher: 'Research', marketer: 'Communicate', creator: 'Create', builder: 'Build' },
  },
};

const D = window.ESTUDIO_DATOS, H = window.HORARIO;
const t = T[D.idioma] ?? T.es;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pct = ([x, y]) => `left:${x / 20}%;top:${y / 11.16}%`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const scene = document.querySelector('.sd-scene');
const cam = scene.querySelector('.sd-cam');
const close = scene.querySelector('.sd-closeup');
// NicoMarca wears a different outfit each weekday (San Francisco): photo, loop and his close-up share the suffix.
const OUTFIT = ['', '', '-mar', '-mie', '-jue', '-vie', ''][H.dia()];
// Out of the office the studio switches to its empty-chair version (photo, loop and close-up), screen off.
// At night in San Francisco a set uses its -night files, where they exist (so far only the empty chair).
const NOCHE = new Set(['-away']);
const NOCHE_CU = new Set(['cu-res', 'cu-mkt', 'cu-cre', 'cu-bui', 'cu-nico-away']);
const litCu = (n) => (H.luz() === 'noche' && NOCHE_CU.has(n) ? n + '-night' : n);
const lit = (m) => (H.luz() === 'noche' && NOCHE.has(m) ? m + '-night' : m);
const media = () => lit(H.estado().open ? OUTFIT : '-away');
let shownMedia = media();
cam.querySelector('img').src = `media/studio${shownMedia}.jpg`;
const focus = scene.querySelector('.sd-focus');
let focused = null;

// The Brains work 24/7; NicoMarca only in office hours (horario.js).
const state = (id) => (id === 'nico' && !H.estado().open ? 'away' : D.puestos[id].state);
function backText() {
  const e = H.estado();
  const day = new Intl.DateTimeFormat(D.idioma === 'en' ? 'en-US' : 'es-CO', { weekday: 'long', timeZone: 'UTC' }).format(e.back);
  return t.back7(e.days === 0 ? t.today : e.days === 1 ? t.tomorrow : t.on(day));
}
// `now` may be a list: it then rotates every few minutes (NicoMarca does many kinds of work).
const current = (now) => (Array.isArray(now) ? now[Math.floor(H.now() / 180e3) % now.length] : now);
const nowText = (id) => (state(id) === 'away' ? backText() : current(D.puestos[id].now) || t.nothing);

// Hotspots once; glows and bubbles are repainted when something changes.
for (const id of ORDER) {
  const s = SEATS[id];
  cam.insertAdjacentHTML('beforeend', `<button type="button" class="sd-hot" data-id="${id}" style="${pct(s.hot)};width:${s.hot[2] / 20}%;height:${s.hot[3] / 11.16}%"></button>`);
}
let painted = '';
function paint() {
  const key = ORDER.map((id) => state(id) + nowText(id)).join('|');
  if (key === painted) return;
  painted = key;
  cam.querySelectorAll('.sd-glow').forEach((g) => g.remove());
  const bubbles = scene.querySelector('.sd-bubbles');
  bubbles.innerHTML = '';
  for (const id of ORDER) {
    const s = SEATS[id], st = state(id);
    cam.querySelector(`.sd-hot[data-id="${id}"]`).setAttribute('aria-label', `${NAME[id]}: ${t.state[st]}`);
    cam.insertAdjacentHTML('beforeend', `<div class="sd-glow" style="${pct(s.screen)};background:radial-gradient(ellipse, ${s.c}55 0%, ${s.c}00 65%);opacity:${st === 'away' ? 0 : st === 'free' ? 0.15 : st === 'toSign' ? 0.9 : 0.5}"></div>`);
    bubbles.insertAdjacentHTML('beforeend',
      `<div class="sd-bubble" style="${pct(s.bub)}"><div class="who"><i style="background:${st === 'away' ? '#5A6280' : s.c}"></i>${NAME[id]}</div><div class="st">${t.state[st]}</div><div>${esc(nowText(id))}</div></div>`);
  }
  // Arriving or leaving swaps the photo and the loop.
  if (media() !== shownMedia) {
    shownMedia = media();
    cam.querySelector('img').src = `media/studio${shownMedia}.jpg`;
    const loop = cam.querySelector('video');
    if (loop.src) { loop.classList.remove('on'); loop.src = `media/loop${shownMedia}.mp4`; loop.play().catch(() => {}); }
  }
}
scene.querySelector('.sd-hint').textContent = t.hint;
// A visible notice while ?hora= simulates another moment, so nobody mistakes it for the real time.
if (new URLSearchParams(location.search).has('hora')) scene.insertAdjacentHTML('beforeend', '<span class="sd-sim">' + (D.idioma === 'en' ? 'Simulated time (?hora= in the address)' : 'Hora simulada (?hora= en la dirección)') + '</span>');
scene.querySelector('.sd-back').textContent = `← ${t.back}`;

// Live SF and Bogotá time and date over the wall clock digits; also repaints the seats.
const fmtT = (tz) => new Intl.DateTimeFormat('es-CO', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(H.now());
const fmtD = (tz) => new Intl.DateTimeFormat(D.idioma === 'en' ? 'en-US' : 'es-CO', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' }).format(H.now()).replace(/\.| de/g, '').replace(',', '');
const clock = (el, tz) => { el.innerHTML = `<span>${fmtT(tz)}</span><small>${fmtD(tz)}</small>`; };
const tick = () => { clock(document.getElementById('sf'), 'America/Los_Angeles'); clock(document.getElementById('bog'), 'America/Bogota'); paint(); };
tick(); setInterval(tick, 20000);

// The loop video starts only when the studio is on screen.
if (!reduce) {
  const loop = cam.querySelector('video');
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (!loop.src) loop.src = `media/loop${shownMedia}.mp4`; loop.play().catch(() => {}); } else loop.pause();
  }, { rootMargin: '200px 0px' }).observe(scene);
  loop.addEventListener('playing', () => loop.classList.add('on'));
}

function zoomTo(id, w, h, s = 2.1) {
  const [hx, hy] = SEATS[id].hot;
  const px = (hx / 2000) * w, py = ((hy - 40) / 1116) * h;
  const cx = w * 0.36; // center of the area left of the card panel
  const tx = Math.min(0, Math.max(w - w * s, cx - px * s));
  const ty = Math.min(0, Math.max(h - h * s, h * 0.5 - py * s));
  return `translate(${tx}px, ${ty}px) scale(${s})`;
}
const place = () => { if (focused) cam.style.transform = zoomTo(focused, scene.clientWidth, scene.clientHeight); };

function open(id) {
  focused = id;
  const v = D.puestos[id], isNico = id === 'nico', st = state(id), away = st === 'away', hol = H.estado().holiday;
  focus.innerHTML =
    `<div class="hd"><i style="background:${SEATS[id].c}"></i><div><h3>${NAME[id]}</h3><span class="lbl">${t.role[id]}</span></div></div>` +
    `<div class="now"><span class="lbl">${t.state[st]}</span><div>${esc(nowText(id))}</div></div>` +
    (away ? (hol ? `<span class="lbl">${esc(t.holiday(hol))}</span>` : '') + `<p class="note">${t.awayNote}</p>` : '') +
    `<span class="lbl">${isNico ? t.onDesk : t.queue}</span>` +
    (v.queue.length ? v.queue.map((q) => `<div class="row">${esc(q)}</div>`).join('') : `<span style="color:#8F98B2">${t.nothing}</span>`);
  scene.classList.add('zoomed');
  place();
  close.classList.remove('on');
  if (!reduce) { close.src = `media/${litCu(CLOSEUP[id] + (id === 'nico' ? (away ? '-away' : OUTFIT) : ''))}.mp4`; close.play().catch(() => {}); setTimeout(() => focused === id && close.classList.add('on'), 800); }
}
function zoomOut() {
  close.classList.remove('on');
  setTimeout(() => { focused = null; cam.style.transform = ''; scene.classList.remove('zoomed'); close.pause(); }, 350);
}

scene.addEventListener('click', (e) => {
  const hot = e.target.closest('.sd-hot');
  if (hot && !focused) return open(hot.dataset.id);
  if (e.target.closest('.sd-back')) return zoomOut();
  if (focused && !e.target.closest('.sd-focus')) zoomOut();
});
addEventListener('keydown', (e) => e.key === 'Escape' && focused && zoomOut());
addEventListener('resize', place);
