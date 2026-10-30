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
    hint: 'Toca a cualquiera para acercarte a su puesto', back: 'Ver todo el estudio', nothing: 'Sin trabajo en curso.', queue: 'En su cola', signQueue: 'Esperan tu firma',
    state: { working: 'Trabajando', withClient: 'Con el cliente', toSign: 'Esperan tu firma', free: 'Libre' },
    role: { nico: 'Dirige y firma', researcher: 'Investiga', marketer: 'Comunica', creator: 'Crea', builder: 'Construye' },
  },
  en: {
    hint: 'Tap anyone to zoom into their desk', back: 'See the whole studio', nothing: 'Nothing in progress.', queue: 'In their queue', signQueue: 'Waiting for your signature',
    state: { working: 'Working', withClient: 'With the client', toSign: 'Waiting for your signature', free: 'Free' },
    role: { nico: 'Directs and signs', researcher: 'Research', marketer: 'Communicate', creator: 'Create', builder: 'Build' },
  },
};

const D = window.ESTUDIO_DATOS;
const t = T[D.idioma] ?? T.es;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pct = ([x, y]) => `left:${x / 20}%;top:${y / 11.16}%`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const scene = document.querySelector('.sd-scene');
const cam = scene.querySelector('.sd-cam');
const close = scene.querySelector('.sd-closeup');
const focus = scene.querySelector('.sd-focus');
let focused = null;

// Hotspots, screen glows and bubbles.
for (const id of ORDER) {
  const s = SEATS[id], v = D.puestos[id];
  cam.insertAdjacentHTML('beforeend',
    `<button type="button" class="sd-hot" data-id="${id}" aria-label="${NAME[id]}: ${t.state[v.state]}" style="${pct(s.hot)};width:${s.hot[2] / 20}%;height:${s.hot[3] / 11.16}%"></button>` +
    `<div class="sd-glow" style="${pct(s.screen)};background:radial-gradient(ellipse, ${s.c}55 0%, ${s.c}00 65%);opacity:${v.state === 'free' ? 0.15 : v.state === 'toSign' ? 0.9 : 0.5}"></div>`);
  scene.querySelector('.sd-bubbles').insertAdjacentHTML('beforeend',
    `<div class="sd-bubble" style="${pct(s.bub)}"><div class="who"><i style="background:${s.c}"></i>${NAME[id]}</div><div class="st">${t.state[v.state]}</div><div>${esc(v.now || t.nothing)}</div></div>`);
}
scene.querySelector('.sd-hint').textContent = t.hint;
scene.querySelector('.sd-back').textContent = `← ${t.back}`;

// Live SF and Bogotá times over the wall clock digits.
const fmt = (tz) => new Intl.DateTimeFormat('es-CO', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
const tick = () => { document.getElementById('sf').textContent = fmt('America/Los_Angeles'); document.getElementById('bog').textContent = fmt('America/Bogota'); };
tick(); setInterval(tick, 20000);

// The loop video starts only when the studio is on screen.
if (!reduce) {
  const loop = cam.querySelector('video');
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (!loop.src) loop.src = 'media/loop.mp4'; loop.play().catch(() => {}); } else loop.pause();
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
  const v = D.puestos[id], isNico = id === 'nico';
  focus.innerHTML =
    `<div class="hd"><i style="background:${SEATS[id].c}"></i><div><h3>${NAME[id]}</h3><span class="lbl">${t.role[id]}</span></div></div>` +
    (isNico ? '' : `<div class="now"><span class="lbl">${t.state[v.state]}</span><div>${esc(v.now || t.nothing)}</div></div>`) +
    `<span class="lbl">${isNico ? t.signQueue : t.queue}</span>` +
    (v.queue.length ? v.queue.map((q) => `<div class="row">${esc(q)}</div>`).join('') : `<span style="color:#8F98B2">${t.nothing}</span>`);
  scene.classList.add('zoomed');
  place();
  close.classList.remove('on');
  if (!reduce) { close.src = `media/${CLOSEUP[id]}.mp4`; close.play().catch(() => {}); setTimeout(() => focused === id && close.classList.add('on'), 800); }
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
