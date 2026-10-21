// Recorrido guiado (product tour) sin dependencias.
// Ilumina una parte de la pantalla y explica para qué sirve, paso a paso.
// Teclado: ← → para moverse, Esc para salir, Tab queda dentro de la tarjeta. En móvil la tarjeta va abajo.
// Origen: Level Studio (Revista Level, 2026). Estilos en tour.css (clases .tg-*).

/**
 * @typedef {Object} Paso
 * @property {string} [el]        Selector del elemento a iluminar. Sin él (o si está oculto): tarjeta centrada.
 * @property {string} titulo
 * @property {string} texto       HTML simple: <p>, <b>, y <p class="tg-ej"><span>Mejor</span> … para ejemplos.
 * @property {boolean} [logo]     Muestra opciones.logoHtml arriba (útil en bienvenida y cierre).
 * @property {() => void} [antes] Se ejecuta antes de mostrar el paso (abrir un panel, cambiar de pestaña…).
 */

/**
 * @typedef {Object} Opciones
 * @property {{ texto: string, href: string }} [fin]  Enlace en el último paso (p. ej. «Leer la guía completa →»).
 * @property {string} [logoHtml]                       HTML del logo para los pasos con logo: true.
 * @property {(id: string) => void} [alCerrar]         Se llama al cerrar (terminar o saltar), p. ej. para analítica.
 * @property {(id: string) => void} [alCompletar]      Solo cuando se termina hasta el último paso (no al saltar).
 * @property {boolean} [confeti]                       Confeti en toda la página y felicitación al terminar (por defecto sí).
 * @property {string[]} [colores]                      Colores del confeti (por defecto, los de la marca vía --tg-accent).
 * @property {Partial<typeof TEXTOS>} [textos]         Para traducir los botones.
 */

const TEXTOS = {
  saltar: 'Saltar', atras: 'Atrás', siguiente: 'Siguiente', empezar: 'Empezar el recorrido',
  listo: 'Listo', empezarFin: '¡Empezar!', de: 'de',
  felicitacion: '¡Felicitaciones! Completaste el recorrido', felicitacionSub: 'Ya sabes lo necesario para empezar.',
};

/**
 * Confeti en toda la página + aviso de felicitación. Sin dependencias: un <canvas> fijo que no bloquea clics
 * y se borra solo (~3,5 s). Con «reducir movimiento» no hay confeti: solo el aviso.
 * @param {{ colores?: string[], titulo?: string, sub?: string }} [o]
 */
export function celebrar(o = {}) {
  const css = getComputedStyle(document.documentElement);
  const marca = css.getPropertyValue('--tg-accent').trim();
  const colores = o.colores?.length ? o.colores : [marca || '#3F47E0', '#FCC100', '#FC5323', '#C40043', '#22B07D', '#7C6CF2'];
  // Aviso (lo anuncian los lectores de pantalla).
  const aviso = document.createElement('div');
  aviso.className = 'tg-felicita';
  aviso.setAttribute('role', 'status');
  aviso.innerHTML = '<span class="tg-felicita-ic" aria-hidden="true">🎉</span><div><b class="tg-felicita-t"></b><span class="tg-felicita-s"></span></div>';
  aviso.querySelector('.tg-felicita-t').textContent = o.titulo || TEXTOS.felicitacion;
  aviso.querySelector('.tg-felicita-s').textContent = o.sub || TEXTOS.felicitacionSub;
  document.body.append(aviso);
  requestAnimationFrame(() => aviso.classList.add('in'));
  setTimeout(() => { aviso.classList.remove('in'); setTimeout(() => aviso.remove(), 400); }, 4200);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cv = document.createElement('canvas');
  cv.className = 'tg-confeti';
  cv.setAttribute('aria-hidden', 'true');
  document.body.append(cv);
  const ctx = cv.getContext('2d');
  const dpr = Math.min(2, devicePixelRatio || 1);
  const medir = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  medir(); addEventListener('resize', medir);
  const W = () => innerWidth; const H = () => innerHeight;
  const n = Math.min(260, Math.round(W() / 5) + 90);
  // Dos ráfagas desde las esquinas de abajo + lluvia desde arriba: cubre toda la página.
  const piezas = Array.from({ length: n }, (_, k) => {
    const tipo = k % 3; // 0 izquierda, 1 derecha, 2 arriba
    const ang = tipo === 2 ? Math.PI / 2 + (Math.random() - 0.5) * 0.6 : (tipo === 0 ? -Math.PI / 3 : -2 * Math.PI / 3) + (Math.random() - 0.5) * 0.7;
    const v = tipo === 2 ? 2 + Math.random() * 3 : 11 + Math.random() * 9;
    return {
      x: tipo === 2 ? Math.random() * W() : tipo === 0 ? -10 : W() + 10, y: tipo === 2 ? -20 - Math.random() * H() * 0.5 : H() * 0.85,
      vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, w: 6 + Math.random() * 7, h: 9 + Math.random() * 9,
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3, c: colores[k % colores.length], fase: Math.random() * 6.28, redondo: Math.random() < 0.25,
    };
  });
  // Física por tiempo (no por cuadro): igual en pantallas de 60 y 120 Hz o si el navegador va lento.
  const t0 = performance.now(); const DUR = 3600; let antes = t0;
  (function cuadro(t) {
    const e = t - t0;
    ctx.clearRect(0, 0, W(), H());
    ctx.globalAlpha = e > DUR - 700 ? Math.max(0, (DUR - e) / 700) : 1;
    const k = Math.min(4, (t - antes) / 16.67); antes = t;
    for (const p of piezas) {
      p.vy += 0.22 * k; p.vx *= Math.pow(0.985, k); p.vy = Math.min(p.vy, 6.5);
      p.x += (p.vx + Math.sin((e / 260) + p.fase) * 0.6) * k; p.y += p.vy * k; p.r += p.vr * k;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      if (p.redondo) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, 6.283); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2 * Math.abs(Math.cos(e / 180 + p.fase)), p.w, p.h * Math.abs(Math.cos(e / 180 + p.fase)) + 1);
      ctx.restore();
    }
    if (e < DUR) requestAnimationFrame(cuadro);
    else { removeEventListener('resize', medir); cv.remove(); }
  })(t0);
}

const clave = (id) => `tg-tour-${id}`;

/** true si esta persona ya vio (o saltó) el recorrido `id` en este navegador. */
export const tourVisto = (id) => { try { return localStorage.getItem(clave(id)) === '1'; } catch { return true; } };
const marcar = (id) => { try { localStorage.setItem(clave(id), '1'); } catch {} };

/**
 * Abre el recorrido.
 * @param {string} id        Nombre del recorrido (se recuerda por separado: «editor», «panel»…).
 * @param {Paso[]} pasos
 * @param {Opciones} [op]
 */
export function iniciarTour(id, pasos, op = {}) {
  const T = { ...TEXTOS, ...(op.textos || {}) };
  document.querySelector('.tg-tour')?.remove();
  const capa = document.createElement('div');
  capa.className = 'tg-tour';
  capa.innerHTML = `
    <div class="tg-foco" aria-hidden="true"></div>
    <div class="tg-card" role="dialog" aria-modal="true" aria-labelledby="tg-t" tabindex="-1">
      <div class="tg-logo" hidden></div>
      <p class="tg-n"></p>
      <h2 id="tg-t" class="tg-h"></h2>
      <div class="tg-x"></div>
      <div class="tg-dots" aria-hidden="true">${pasos.map(() => '<span></span>').join('')}</div>
      <div class="tg-acc">
        <button type="button" class="tg-skip"></button>
        <span style="flex:1"></span>
        <button type="button" class="tg-btn tg-btn-o tg-prev"></button>
        <button type="button" class="tg-btn tg-btn-p tg-next"></button>
      </div>
    </div>`;
  document.body.append(capa);
  const foco = capa.querySelector('.tg-foco');
  const card = capa.querySelector('.tg-card');
  const logoBox = capa.querySelector('.tg-logo');
  if (op.logoHtml) logoBox.innerHTML = op.logoHtml;
  const prevBtn = capa.querySelector('.tg-prev');
  const nextBtn = capa.querySelector('.tg-next');
  const skipBtn = capa.querySelector('.tg-skip');
  prevBtn.textContent = T.atras; skipBtn.textContent = T.saltar;
  const anterior = document.activeElement;
  const sinMovimiento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let i = 0;
  let objetivo = null;

  // Ubica el foco sobre el elemento y la tarjeta donde no lo tape: abajo, arriba, a un lado o al fondo.
  function ubicar() {
    const movil = innerWidth < 640;
    if (!objetivo || !objetivo.getClientRects().length) {
      foco.style.cssText = 'top:50%;left:50%;width:0;height:0;';
      capa.classList.add('centro');
      card.style.cssText = '';
      return;
    }
    capa.classList.remove('centro');
    const r = objetivo.getBoundingClientRect();
    const m = 8;
    foco.style.cssText = `top:${r.top - m}px;left:${r.left - m}px;width:${r.width + m * 2}px;height:${r.height + m * 2}px;`;
    // En móvil la fija el CSS al fondo; si el elemento está abajo (barra inferior fija), la tarjeta va arriba.
    if (movil) { card.style.cssText = ''; capa.classList.toggle('arriba', r.top > innerHeight * 0.55); return; }
    const cw = Math.min(380, innerWidth - 32);
    const ch = card.offsetHeight || 260;
    const cabe = {
      abajo: r.bottom + 18 + ch <= innerHeight - 16, arriba: r.top - 18 - ch >= 16,
      der: r.right + 24 + cw <= innerWidth - 16, izq: r.left - 24 - cw >= 16,
    };
    let top; let left;
    if (cabe.abajo) { top = r.bottom + 18; left = r.left + r.width / 2 - cw / 2; }
    else if (cabe.arriba) { top = r.top - ch - 18; left = r.left + r.width / 2 - cw / 2; }
    else if (cabe.der || cabe.izq) {
      // Elemento alto (portada, cuerpo de texto, barra lateral): la tarjeta va al lado, sin taparlo.
      top = Math.max(16, Math.min(innerHeight - ch - 16, r.top + Math.min(r.height, innerHeight) / 2 - ch / 2));
      left = cabe.der ? r.right + 24 : r.left - cw - 24;
    } else { top = innerHeight - ch - 16; left = r.left + r.width / 2 - cw / 2; }
    left = Math.max(16, Math.min(innerWidth - cw - 16, left));
    card.style.cssText = `top:${top}px;left:${left}px;width:${cw}px;`;
  }

  function mostrar(n) {
    i = Math.max(0, Math.min(pasos.length - 1, n));
    const p = pasos[i];
    p.antes?.();
    objetivo = p.el ? document.querySelector(p.el) : null;
    if (objetivo && objetivo.hidden) objetivo = null;
    capa.querySelector('.tg-n').textContent = `${i + 1} ${T.de} ${pasos.length}`;
    capa.querySelector('#tg-t').textContent = p.titulo;
    capa.querySelector('.tg-x').innerHTML = p.texto;
    logoBox.hidden = !(p.logo && op.logoHtml);
    capa.querySelectorAll('.tg-dots span').forEach((d, k) => d.classList.toggle('on', k === i));
    prevBtn.hidden = i === 0;
    const ultimo = i === pasos.length - 1;
    nextBtn.textContent = ultimo ? (op.fin ? T.empezarFin : T.listo) : i === 0 ? T.empezar : T.siguiente;
    skipBtn.hidden = ultimo;
    let finLink = capa.querySelector('.tg-fin');
    if (ultimo && op.fin) {
      if (!finLink) { finLink = document.createElement('a'); finLink.className = 'tg-fin'; capa.querySelector('.tg-x').after(finLink); }
      finLink.href = op.fin.href; finLink.textContent = op.fin.texto;
    } else finLink?.remove();
    const fijo = objetivo && getComputedStyle(objetivo.closest('.fixed, [style*="fixed"]') ?? objetivo).position === 'fixed';
    if (objetivo && innerWidth < 640 && !fijo) {
      // En móvil la tarjeta va abajo: el elemento sube a la parte de arriba de la pantalla.
      window.scrollBy({ top: objetivo.getBoundingClientRect().top - 130, behavior: 'auto' });
    } else if (objetivo) {
      const r = objetivo.getBoundingClientRect();
      if (r.top < 90 || r.bottom > innerHeight - 40) {
        objetivo.scrollIntoView({ block: r.height > innerHeight * 0.6 ? 'start' : 'center', behavior: sinMovimiento() ? 'auto' : 'smooth' });
      }
    }
    ubicar();
    setTimeout(ubicar, 380); // después del scroll suave
    card.focus({ preventScroll: true });
  }

  function cerrar(completo = false) {
    marcar(id);
    removeEventListener('resize', ubicar); removeEventListener('scroll', ubicar, true); removeEventListener('keydown', teclas, true);
    capa.classList.add('sale');
    setTimeout(() => capa.remove(), 220);
    anterior?.focus?.({ preventScroll: true });
    op.alCerrar?.(id);
    // Terminó hasta el final (no saltó): confeti y felicitación en toda la página.
    if (completo) {
      if (op.confeti !== false) setTimeout(() => celebrar({ colores: op.colores, titulo: T.felicitacion, sub: T.felicitacionSub }), 160);
      op.alCompletar?.(id);
    }
  }

  function teclas(e) {
    if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); i === pasos.length - 1 ? cerrar(true) : mostrar(i + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); mostrar(i - 1); }
    else if (e.key === 'Tab') { // el foco no sale de la tarjeta
      const f = [...card.querySelectorAll('button:not([hidden]), a[href]')];
      if (!f.length) return;
      const idx = f.indexOf(document.activeElement);
      if (e.shiftKey && idx <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && idx === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  }

  nextBtn.addEventListener('click', () => (i === pasos.length - 1 ? cerrar(true) : mostrar(i + 1)));
  prevBtn.addEventListener('click', () => mostrar(i - 1));
  skipBtn.addEventListener('click', () => cerrar());
  addEventListener('resize', ubicar); addEventListener('scroll', ubicar, true); addEventListener('keydown', teclas, true);
  requestAnimationFrame(() => { capa.classList.add('in'); mostrar(0); });
}

/**
 * Atajo para conectar un recorrido: se abre solo la primera vez, con ?tour=1 en la URL,
 * y con cualquier botón que tenga [data-tour-ayuda].
 * @param {string} id
 * @param {Paso[] | (() => Paso[])} pasos  Función si los pasos dependen de datos que cargan después.
 * @param {Opciones & { auto?: boolean, retraso?: number }} [op]
 */
export function conectarTour(id, pasos, op = {}) {
  const abrir = () => iniciarTour(id, typeof pasos === 'function' ? pasos() : pasos, op);
  document.querySelectorAll('[data-tour-ayuda]').forEach((b) => b.addEventListener('click', abrir));
  const pedido = new URLSearchParams(location.search).get('tour') === '1';
  if (pedido || (op.auto !== false && !tourVisto(id))) setTimeout(abrir, op.retraso ?? 700);
  return abrir;
}
