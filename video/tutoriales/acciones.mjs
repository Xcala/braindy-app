// What happens on screen in each scene, keyed '<video>.<n>' like the catalog. Each scene: { url, pasos, prep?, keep?,
// logged?, mobile? }. pasos run in order while the voice line plays:
//   ['ve', x]            scroll to x, point at it and ring it        ['toca', x]   the same, then click it
//   ['pasa', x]          only point at it                             ['escribe', x, text]   click the field and type
//   ['baja', px]         scroll the page by px                        ['caja', x]   scroll the side panel holding x to its end
//   ['espera', ms]       pause                                        async (p) => {}   anything else
// x is a Spanish label (English comes from the app's own strings), a [es, en] pair, or a RegExp. Labels inside <main> win
// over the side menu. Nothing is ever sent: Send/Approve buttons are only pointed at.
import { clic, desliza, deslizaCaja, escribe, foco, mueve, sinFoco, wait } from './rec.mjs';

const REQ = '/requests/brief-zxT1IfpfccLZTih3ULQm';   // «Campaña Tu Voz, Nuestra Evolución»: 4 versions, waiting for approval

/** The visible element for x: buttons, links, headings, fields, then any text; inside <main> first. */
export async function busca(p, x, L, lang) {
  if (typeof x === 'string' && /^[#.]|\[/.test(x)) return p.locator(x).first();
  const name = x instanceof RegExp ? x : Array.isArray(x) ? (lang === 'es' ? x[0] : x[1]) : L(x);
  for (const root of [p.locator('main'), p.locator('body')]) {
    for (const l of [root.getByRole('button', { name }), root.getByRole('link', { name }), root.getByRole('heading', { name }),
      root.getByRole('tab', { name }), root.getByLabel(name), root.getByPlaceholder(name), root.getByText(name)]) {
      const n = await l.count().catch(() => 0);
      for (let i = 0; i < n; i++) if (await l.nth(i).isVisible().catch(() => false)) return l.nth(i);
    }
  }
  throw new Error(`no encuentro «${name}»`);
}

/** Brings an element to about a third of the screen, smoothly (window or the box that scrolls it). */
async function acerca(p, loc) {
  const r = await loc.evaluate((el) => { const b = el.getBoundingClientRect(); return { top: b.top, h: innerHeight, inBox: (() => { let c = el.parentElement; while (c && c !== document.body) { if (c.scrollHeight > c.clientHeight + 10 && /auto|scroll/.test(getComputedStyle(c).overflowY)) return true; c = c.parentElement; } return false; })() }; });
  if (r.top > 90 && r.top < r.h * 0.72) return;
  if (r.inBox) { await loc.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' })); await wait(700); return; }
  const y = await p.evaluate((d) => scrollY + d, r.top - r.h * 0.32);
  await desliza(p, Math.max(0, y), 900);
}

export async function corre(p, pasos, L, lang) {
  for (const s of pasos) {
    if (typeof s === 'function') { await s(p, L, lang); continue; }
    const [op, x, arg] = s;
    if (op === 'espera') { await wait(x); continue; }
    if (op === 'baja') { await desliza(p, await p.evaluate((d) => scrollY + d, x), arg ?? 1100); continue; }
    const loc = await busca(p, x, L, lang);
    if (op === 'caja') { await deslizaCaja(loc, arg ?? 1600); continue; }
    await acerca(p, loc);
    if (op === 'pasa') { await mueve(p, loc, 25); await wait(arg ?? 700); continue; }
    if (op === 've') { await mueve(p, loc, 25); await foco(loc); await wait(arg ?? 1300); await sinFoco(p); continue; }
    if (op === 'toca') { await clic(p, loc, 25); await wait(arg ?? 1100); continue; }
    if (op === 'escribe') { await clic(p, loc, 25); await escribe(p, lang === 'es' ? arg[0] : arg[1], 45); await wait(500); continue; }
    throw new Error('paso? ' + op);
  }
}

const panelPedido = [['toca', 'Nuevo pedido', 1200]];
const redes = [...panelPedido, ['toca', /Algo para redes|Something for social/, 900]];
// the site's own cookie notice is closed first ("only necessary"), so it does not cover the page
const sitio = [['toca', /^quimiolab\.com/, 3500], async (p) => { await p.frameLocator('iframe').first().getByText(/Solo necesarias|Only necessary/).click({ timeout: 5000 }).catch(() => {}); await wait(800); }];
const clicSitio = (fy) => async (p) => { const f = await p.locator('iframe').first().boundingBox(); if (f) { await p.mouse.move(f.x + f.width * 0.45, f.y + f.height * fy, { steps: 25 }); await wait(300); await p.mouse.down(); await p.mouse.up(); await wait(900); } };

export const ESCENAS = {
  // ---------- Inicio ----------
  'inicio.1': { url: '/login', logged: false, pasos: [['espera', 600], ['escribe', 'input[type=email]', ['tu@empresa.com', 'you@company.com']], ['espera', 600], ['ve', /Google/, 2200]] },
  'inicio.2': { url: '/home', pasos: [['espera', 700], ['ve', 'Contacta a Nico', 1800], ['pasa', 'Contacta a Nico', 2500]] },
  'inicio.3': { url: '/home', pasos: [['ve', /Entregado · espera|Delivered · waiting/, 1600], ['baja', 160], ['pasa', /^Revisar$|^Review$/, 1500]] },
  'inicio.4': { url: '/home', pasos: [['ve', 'En producción', 1500], ['baja', 220, 1600], ['espera', 1200]] },
  'inicio.5': { url: '/home', pasos: [['ve', 'Siguiente reunión', 1800], ['ve', 'Historial de reuniones', 1800]] },
  // ---------- Mi marca ----------
  'mi-marca.1': { url: '/brand/visual', pasos: [['ve', 'Logos', 1500], ['toca', /Cambiar fondo|Change background/, 1200], ['toca', /Cambiar fondo|Change background/, 1200], ['toca', /Cambiar fondo|Change background/, 1200], ['pasa', /^Descargar Principal$|^Download Primary$/, 800]] },
  'mi-marca.2': { url: '/brand/visual', pasos: [['ve', 'Colores', 1200], ['toca', /^Copiar$|^Copy$/, 1400], ['baja', -2000, 1200], ['pasa', '#0097D6', 1200], ['pasa', 'Poppins', 800]] },
  'mi-marca.3': { url: '/brand/visual', pasos: [['ve', 'Tipografía', 1400], ['ve', '↓ Descargar fuente', 1600]] },
  'mi-marca.4': { url: '/brand', pasos: [['ve', 'Primal Branding', 1200], ['ve', 'Estrategia', 1200], ['ve', 'Voz', 1300]] },
  // ---------- Cerebro ----------
  'cerebro.1': { url: '/brand/brain', pasos: [['espera', 800], ['ve', /Cerebro\.|Brain\./, 3000]] },
  'cerebro.2': { url: '/brand/brain', pasos: [['ve', 'Así está creciendo', 1200], ['toca', 'Ver cómo creció', 3000]] },
  'cerebro.3': { url: '/brand/brain', pasos: [['ve', 'Lo que aprendió', 1400], ['pasa', 'Campaña Tu Voz, Nuestra Evolución', 1200], ['pasa', 'Calendario de escritorio 2027', 1200]] },
  'cerebro.4': { url: '/brand/brain', pasos: [['ve', 'Reglas que nunca olvida', 1500], ['ve', 'Lo que aún no sabe', 1500]] },
  // ---------- Investigación ----------
  'investigacion.1': { url: '/research', pasos: [['espera', 700], ['ve', /Mi investigación|My research/, 2400]] },
  'investigacion.2': { url: '/research', pasos: [['ve', 'Market maps', 1200], ['pasa', /CAIC Quimiolab/, 1200], ['pasa', /Quimiolab Marketcap/, 1200]] },
  'investigacion.3': { url: '/research', pasos: [['ve', /CAIC Quimiolab/, 1800], ['pasa', /Quimiolab Marketcap/, 1200]] },
  // ---------- Pedir ----------
  'pedir.1': { url: '/requests', pasos: [['espera', 600], ['ve', 'Nuevo pedido', 1200], ['toca', 'Nuevo pedido', 800]] },
  'pedir.2': { url: '/requests', prep: (p, L, lang) => corre(p, panelPedido, L, lang), keep: true, pasos: [['ve', /Algo para redes|Something for social/, 1100], ['pasa', /Una pieza puntual|A single piece/, 900], ['pasa', /Algo para mi web|Something for my web/, 900], ['pasa', /Una campaña|A campaign/, 900], ['ve', /No sé, ayúdame|Help me choose/, 1500], ['toca', /Algo para redes|Something for social/, 800]] },
  'pedir.3': { keep: true, pasos: [['escribe', /¿Necesitas algo\?|Need something\?/, ['Carrusel del nuevo kit para el congreso', 'Carousel for the new kit at the congress']], ['toca', 'Carrusel', 600], ['toca', 'Instagram', 600], ['toca', /^Esta semana|^This week/, 600]] },
  'pedir.4': { keep: true, pasos: [['ve', 'Nota de voz', 1400], ['ve', 'No tengo material: que lo propongan', 1600]] },
  'pedir.5': { pasos: [['caja', /Tipo exacto de pieza|Exact piece type/, 1400], ['ve', /Así lo entendió|How NickMark read it/, 1600], ['pasa', /^Enviar|^Send/, 1500]] },
  // ---------- Revisar ----------
  'revisar.1': { url: REQ, pasos: [['espera', 600], ['ve', /Tu aprobación|Your approval/, 2200], ['baja', 120]] },
  'revisar.2': { url: REQ, pasos: [['toca', /^v3/, 900], ['toca', /^v4/, 900], ['toca', 'Comparar', 1000], ['toca', 'Lado a lado', 1200], ['toca', 'Solo cambios', 1200]] },
  'revisar.3': { url: REQ, pasos: [['toca', 'Marcar en la pieza', 900], async (p) => { const b = await p.locator('main .relative.select-none').first().boundingBox(); if (!b) return; const x = b.x + b.width * 0.3, y = b.y + b.height * 0.3; await p.mouse.move(x, y, { steps: 15 }); await p.mouse.down(); await p.mouse.move(x + b.width * 0.35, y + b.height * 0.25, { steps: 25 }); await p.mouse.up(); await wait(700); }, ['escribe', /Escribe, o marca primero|Write, or mark/, ['Logo un poco más grande', 'Logo a little bigger']]] },
  'revisar.4': { url: REQ, pasos: [['ve', 'Aprobar esta versión', 1700], ['ve', 'Pedir cambios', 1700]] },
  'revisar.5': { url: '/requests', pasos: [['ve', /Aprobar \d+ de una vez|Approve \d+ at once/, 1300], ['toca', /Aprobar \d+ de una vez|Approve \d+ at once/, 2500]] },
  // ---------- Archivos ----------
  'archivos.1': { url: '/assets', pasos: [['espera', 600], ['ve', /^Subidos por tu equipo|^Uploaded by your team/, 1300], ['pasa', /^Redes sociales|^Social media/, 900], ['toca', /^Redes sociales|^Social media/, 1500]] },
  'archivos.2': { url: '/assets', pasos: [['escribe', 'Buscar archivos', ['logo', 'logo']], ['espera', 900], ['toca', 'Imágenes', 900], ['ve', 'Ordenar', 1200]] },
  'archivos.3': { url: '/assets', pasos: [['toca', /^Manual de marca|^Brand manual/, 1500], async (p) => { const f = p.locator('main [data-file], main [role=checkbox], main input[type=checkbox]'); const n = Math.min(3, await f.count()); for (let i = 0; i < n; i++) { await clic(p, f.nth(i), 15); await wait(400); } await wait(600); }, ['ve', /\.zip/, 1200]] },
  'archivos.4': { url: '/assets', pasos: [['espera', 500], ['ve', 'Subir', 2400]] },
  // ---------- Apps y sitio ----------
  'apps-sitio.1': { url: '/apps', pasos: [...sitio, ['toca', 'Tableta', 1300], ['toca', 'Celular', 1300], ['toca', 'Computador', 900]] },
  'apps-sitio.2': { url: '/apps', prep: (p, L, lang) => corre(p, sitio, L, lang), keep: true, pasos: [['ve', /Ajustes del sitio|Website adjustments/, 1000], ['toca', /Pedir un ajuste|Ask for an adjustment/, 900], ['escribe', 'textarea[placeholder]', ['Cambiar la foto del inicio por la del equipo', 'Swap the home photo for the team photo']], ['pasa', /^Enviar$|^Send$/, 900]] },
  'apps-sitio.3': { url: '/apps', prep: (p, L, lang) => corre(p, sitio, L, lang), keep: true, pasos: [async (p) => { const it = p.locator('main li, [class*=sp-] li'); for (let i = 0; i < Math.min(3, await it.count()); i++) { await mueve(p, it.nth(i), 20); await wait(900); } }, ['toca', /^Entregado|^Delivered/, 1500]] },
  'apps-sitio.4': { pasos: [['toca', /^Comentar$|^Comment$/, 1000], clicSitio(0.4), ['escribe', /Escribe tu comentario|Write your comment/, ['Esta foto más grande', 'Make this photo bigger']]] },
  // ---------- Calendario ----------
  'calendario.1': { url: '/calendar', pasos: [['espera', 600], ['ve', /de 2026|2026/, 1300], ['toca', '›', 1000], ['toca', '‹', 900], ['toca', 'Hoy', 800]] },
  'calendario.2': { url: '/calendar', pasos: [['ve', /Publicada|Published/, 1300], ['toca', /IG Instagram/, 1100], ['toca', /in LinkedIn/, 1100], ['toca', /^Todas$|^All$/, 900]] },
  'calendario.3': { url: '/calendar', pasos: [['toca', /Programada|Scheduled/, 1800]] },
  // ---------- Resultados ----------
  'resultados.1': { url: '/report', pasos: [['espera', 700], ['ve', /^Resultados$|^Results$/, 2000], ['baja', 200]] },
  'resultados.2': { url: '/report', pasos: [['baja', 300, 1400], ['espera', 1200], ['baja', 300, 1400]] },
  'resultados.3': { url: '/report', pasos: [['ve', /Lo que mejor funcionó|What worked best/, 1600], ['baja', 250]] },
  'resultados.4': { url: '/report', pasos: [['ve', /Ver las \d+ publicaciones|See all \d+ posts/, 1400]] },
  // ---------- Accesos ----------
  'accesos.1': { url: '/accesses', pasos: [['espera', 600], ['pasa', /^Mover Google Ads|^Move Google Ads/, 900], ['pasa', /^Mover Hosting|^Move Hosting/, 900], ['pasa', /^Mover Instagram|^Move Instagram/, 900]] },
  'accesos.2': { url: '/accesses', pasos: [['toca', 'Agregar app', 1000], ['escribe', '#acc-platform', ['Canva', 'Canva']], ['escribe', '#acc-pass', ['••••••••••', '••••••••••']], ['ve', '#acc-pass', 1200]] },
  'accesos.3': { url: '/accesses', pasos: [['ve', 'Ver contraseña', 2000], ['ve', /30 segundos|30 seconds/, 2200]] },
  'accesos.4': { url: '/accesses', pasos: [['ve', 'Registro de accesos', 1800], ['baja', 200]] },
  // ---------- Mi plan ----------
  'plan.1': { url: '/plan', pasos: [['espera', 600], ['ve', 'Resumen', 1000], ['baja', 300, 1500]] },
  'plan.2': { url: '/plan', pasos: [['ve', /Tu proyecto, de principio a fin|Your project, start to finish/, 1500], ['baja', 300, 1400]] },
  'plan.3': { url: '/plan', pasos: [['toca', 'Sitio y apps', 1300], ['baja', 380, 1500]] },
  'plan.4': { url: '/plan', pasos: [['toca', 'Pagos', 1500], ['baja', 250, 1300]] },
  // ---------- Ajustes ----------
  'ajustes.1': { url: '/home', pasos: [['toca', /^Cuenta$|^Account$/, 1800], ['espera', 2500]] },
  'ajustes.2': { url: '/settings', pasos: [['toca', 'Equipo y aprobadores', 1500], ['baja', 200]] },
  'ajustes.3': { url: '/settings', pasos: [['toca', 'WhatsApp y avisos', 1100], ['ve', 'Avisos', 1600]] },
  'ajustes.4': { url: '/account', pasos: [['ve', /^ES$/, 1000], ['pasa', /^EN$/, 1500]] },
  // ---------- Novedades ----------
  // contrato-un-paso: 1–3 with the demo contract to sign (server/scripts/seed-contrato-tut.ts poner), 4 after «quitar»
  'contrato-un-paso.1': { url: '/plan', pasos: [['espera', 600], ['ve', /Reglas claras|Clear rules/, 2600]] },
  'contrato-un-paso.2': { url: '/plan', pasos: [['caja', /PRIMERA. Objeto|FIRST. Purpose/, 1400], ['toca', /Anexos 2 y 3|Annexes 2 and 3/, 900]] },
  'contrato-un-paso.3': { url: '/plan', pasos: [['escribe', /^NIT|^Tax ID/, ['000000000', '000000000']],     async (p) => { const c = p.locator('main canvas').first(); await c.scrollIntoViewIfNeeded(); const b = await c.boundingBox(); if (!b) return; const x = b.x + b.width * 0.2, y = b.y + b.height * 0.6; await p.mouse.move(x, y, { steps: 10 }); await p.mouse.down(); for (let i = 1; i <= 24; i++) await p.mouse.move(x + i * b.width * 0.025, y - Math.sin(i / 2.2) * b.height * 0.22, { steps: 2 }); await p.mouse.up(); await wait(300); },
    ['pasa', /Firmar el contrato|Sign the contract/, 900]] },
  'contrato-un-paso.4': { url: '/plan', pasos: [['ve', /Contrato firmado|Contract signed/, 1600], ['ve', /PDF/, 1600]] },
  // instalar-app: Chrome offers install only on the real site, so scene 2 hands the page the same event the browser
  // would fire; scene 4 shows the app's own update notice (pwa-pill), which needs a deployed service worker.
  'instalar-app.1': { url: '/home', mobile: true, pasos: [['espera', 900], ['baja', 300, 1600], ['espera', 600], ['baja', -300, 1200]] },
  'instalar-app.2': { url: '/account', prep: (p) => p.evaluate(() => { const e = new Event('beforeinstallprompt'); e.prompt = async () => {}; e.userChoice = Promise.resolve({ outcome: 'dismissed' }); dispatchEvent(e); }), pasos: [['ve', 'Instalar la app', 2600]] },
  'instalar-app.3': { url: '/account', mobile: true, ios: true, pasos: [['toca', 'Instalar la app', 1500], ['ve', /En Safari, toca Compartir|In Safari, tap Share/, 1600]] },
  'instalar-app.4': { url: '/home', prep: (p, L) => p.evaluate(([msg, btn]) => { const d = document.createElement('div'); d.className = 'pwa-bar'; d.innerHTML = '<span class="pwa-pill">' + msg + '<button type="button">' + btn + '</button></span>'; document.body.append(d); }, [L('Hay una versión nueva de Braindy.'), L('Actualizar')]), pasos: [['espera', 500], ['ve', /^Actualizar$|^Update$/, 1800]] },
  'filtros-pedidos.1': { url: '/requests', pasos: [['escribe', 'Buscar por título o tipo', ['calendario', 'calendar']], ['espera', 900], ['toca', /^Por aprobar|^To approve/, 1200]] },
  'filtros-pedidos.2': { url: '/requests', pasos: [['toca', 'Filtros', 2600]] },
  'filtros-pedidos.3': { url: '/requests', pasos: [['toca', 'Tablero', 1500], ['toca', 'Calendario', 1500], ['toca', 'Lista', 700]] },
  'filtros-pedidos.4': { url: '/requests', pasos: [['toca', 'Más', 2400]] },
  'comentar-sitio.1': { url: '/apps', pasos: [...sitio] },
  'comentar-sitio.2': { url: '/apps', prep: (p, L, lang) => corre(p, sitio, L, lang), keep: true, pasos: [['ve', /Ajustes del sitio|Website adjustments/, 1200], ['toca', /^Comentar$|^Comment$/, 1500], clicSitio(0.35)] },
  'comentar-sitio.3': { keep: true, pasos: [['escribe', /Escribe tu comentario|Write your comment/, ['Este título más corto', 'Shorter title here']], ['pasa', /^Comentar$|^Comment$/, 1200]] },
  'comentar-sitio.4': { pasos: [['toca', /^Entregado|^Delivered/, 1300], async (p) => { const it = p.locator('main li'); if (await it.count()) { await mueve(p, it.first(), 20); await wait(1500); } }] },
};
