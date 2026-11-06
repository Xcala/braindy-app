// Storyboard of "Cómo usar Braindy" from catalogo.mjs: one card per scene (vignette of the screen + where the eye goes,
// the ES and EN voice lines, timing), grouped by video. The same scene list drives the voice and the recordings.
//   node video/tutoriales/storyboard.mjs <out.html> [version]
import { writeFileSync } from 'node:fs';
import { TODOS, escenasDe } from './catalogo.mjs';

const out = process.argv[2] ?? 'storyboard.html';
const version = process.argv[3] ?? '1';
const words = (s) => s.trim().split(/\s+/).length;
const secs = (e) => Math.max(words(e.es), words(e.en)) / 2.3 + 1.2; // voice + lead/tail
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const NAV = ['Inicio', 'Mi marca', 'Pedidos', 'Entregas', 'Resultados'];

/** The screen as a wireframe (320×180) with the zone the scene points at lit in blue, plus its UI label and the cursor. */
function vineta(e, nav) {
  const hl = 'fill="var(--hl-soft)" stroke="var(--hl)" stroke-width="1.4"', blk = 'fill="var(--blk)"';
  const label = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="13" rx="6.5" fill="var(--hl)"/><text x="${x + 6}" y="${y + 9}" class="ui">${esc(e.ui).slice(0, Math.floor(w / 4.1))}</text>`;
  const cursor = (x, y) => `<path d="M${x} ${y}l9 5.5-4 1-2 4z" fill="#fff" stroke="var(--ink)" stroke-width="1" stroke-linejoin="round"/>`;
  if (e.zona === 'movil' || e.zona === 'chat') {
    const bubbles = e.zona === 'chat'
      ? `<rect x="128" y="40" width="58" height="16" rx="6" fill="#DCF8C6"/><rect x="134" y="62" width="52" height="12" rx="6" fill="#DCF8C6"/>
         <rect x="134" y="80" width="56" height="26" rx="6" ${hl}/><rect x="140" y="112" width="44" height="12" rx="6" fill="#fff"/>`
      : `<rect x="128" y="40" width="64" height="64" rx="10" ${hl}/><text x="160" y="77" class="big" text-anchor="middle">B</text>`;
    return `<rect width="320" height="180" fill="var(--stage)"/><rect x="120" y="14" width="80" height="156" rx="14" fill="var(--blk2)" stroke="var(--ink)" stroke-width="1.2"/>
      <rect x="124" y="26" width="72" height="140" rx="4" fill="${e.zona === 'chat' ? '#ECE5DD' : 'var(--paper)'}"/>${bubbles}${label(206, 80, 106)}${cursor(176, 98)}`;
  }
  const side = `<rect x="0" y="0" width="56" height="180" fill="var(--paper)"/><text x="9" y="16" class="logo">Braindy</text>`
    + NAV.map((n, i) => `<rect x="6" y="${30 + i * 14}" width="44" height="10" rx="5" fill="${n === nav ? 'var(--hl-soft)' : 'transparent'}"/><text x="11" y="${37.5 + i * 14}" class="nav${n === nav ? ' on' : ''}">${n}</text>`).join('')
    + `<rect x="6" y="150" width="44" height="8" rx="4" ${blk}/><rect x="6" y="162" width="32" height="8" rx="4" ${blk}/>`;
  const top = `<rect x="56" y="0" width="264" height="18" fill="var(--paper)"/><rect x="200" y="5" width="70" height="8" rx="4" ${blk}/><circle cx="306" cy="9" r="5" fill="var(--blk2)"/>`;
  const page = `<rect x="66" y="26" width="120" height="10" rx="3" fill="var(--ink-soft)"/>`;
  let z = '';
  switch (e.zona) {
    case 'hero': z = `<rect x="66" y="42" width="244" height="40" rx="8" ${hl}/><rect x="66" y="90" width="118" height="70" rx="8" ${blk}/><rect x="192" y="90" width="118" height="70" rx="8" ${blk}/>${label(74, 60, 150)}${cursor(230, 70)}`; break;
    case 'lista': z = `<rect x="66" y="42" width="244" height="22" rx="6" ${blk}/>` + [0, 1, 2, 3].map((i) => `<rect x="66" y="${70 + i * 24}" width="244" height="19" rx="6" ${i === 1 ? hl : blk}/>`).join('') + `${label(74, 97, 150)}${cursor(270, 104)}`; break;
    case 'panel': z = `<rect x="66" y="42" width="140" height="120" rx="8" ${blk}/><rect x="0" y="0" width="320" height="180" fill="var(--scrim)"/><rect x="214" y="18" width="106" height="162" fill="var(--paper)"/><rect x="220" y="40" width="94" height="86" rx="6" ${hl}/><rect x="220" y="134" width="94" height="14" rx="7" fill="var(--hl)"/>${label(222, 110, 90)}${cursor(268, 82)}`; break;
    case 'visor': z = `<rect x="66" y="42" width="180" height="122" rx="8" ${hl}/><rect x="254" y="42" width="56" height="122" rx="8" ${blk}/>${label(74, 146, 160)}${cursor(150, 100)}`; break;
    case 'rejilla': z = [0, 1, 2].flatMap((c) => [0, 1].map((r) => `<rect x="${66 + c * 83}" y="${42 + r * 62}" width="77" height="56" rx="7" ${c === 0 && r === 0 ? hl : blk}/>`)).join('') + `${label(70, 84, 150)}${cursor(110, 70)}`; break;
    case 'tarjeta': z = `<rect x="66" y="42" width="244" height="30" rx="8" ${blk}/><rect x="66" y="80" width="244" height="54" rx="8" ${hl}/><rect x="66" y="142" width="244" height="22" rx="8" ${blk}/>${label(74, 115, 170)}${cursor(260, 104)}`; break;
    case 'menu': z = `<rect x="66" y="42" width="244" height="120" rx="8" ${blk}/><rect x="226" y="20" width="88" height="96" rx="8" fill="var(--paper)" stroke="var(--hl)" stroke-width="1.4"/>` + [0, 1, 2, 3, 4].map((i) => `<rect x="232" y="${28 + i * 15}" width="76" height="9" rx="4" ${blk}/>`).join('') + `${label(150, 100, 74)}${cursor(300, 12)}`; break;
    case 'modal': z = `<rect x="66" y="42" width="244" height="120" rx="8" ${blk}/><rect x="0" y="0" width="320" height="180" fill="var(--scrim)"/><rect x="110" y="34" width="156" height="112" rx="10" fill="var(--paper)" stroke="var(--hl)" stroke-width="1.4"/><rect x="122" y="62" width="132" height="12" rx="6" ${blk}/><rect x="122" y="80" width="132" height="12" rx="6" ${blk}/><rect x="122" y="104" width="132" height="14" rx="7" fill="var(--hl)"/>${label(122, 44, 132)}${cursor(200, 112)}`; break;
  }
  return `<rect width="320" height="180" fill="var(--stage)"/>${side}${top}${page}${z}`;
}

const colorDe = { general: 'var(--c-res)', section: 'var(--c-bui)', feature: 'var(--c-cre)' };
const tipo = { general: 'La app completa', section: 'Sección', feature: 'Novedad' };
let total = 0, n = 0;
const videos = TODOS.map((v, vi) => {
  const es = escenasDe(v);
  const d = es.map(secs); const dur = d.reduce((a, b) => a + b, 0); total += v.kind === 'general' ? 0 : dur; n += es.length;
  let t = 0;
  const cards = es.map((e, i) => {
    const t0 = t; t += d[i];
    const wps = (Math.max(words(e.es), words(e.en)) / (d[i] - 1.2)).toFixed(1);
    return `<article class="frame"><svg viewBox="0 0 320 180" role="img" aria-label="${esc(e.ui)}">${vineta(e, v.nav)}</svg>
      <div class="ficha"><p class="num"><b>${i + 1}</b><span>${mmss(t0)}–${mmss(t)}</span>${e.de ? `<span class="reuse">clip de ${esc(e.de)}</span>` : ''}</p>
      <dl><dt>En pantalla</dt><dd>${esc(e.ui)}</dd>
      <dt>Voz · ES</dt><dd class="vo">«${esc(e.es)}»</dd>
      <dt>Voice · EN</dt><dd class="vo en">“${esc(e.en)}”</dd>
      <dt>Ritmo</dt><dd class="meta">${words(e.es)} palabras ES · ${words(e.en)} EN · ${wps} pal/s</dd></dl></div></article>`;
  }).join('');
  const strip = d.map((x, i) => `<span style="flex:${x.toFixed(1)}">${i + 1}</span>`).join('');
  return `<section class="video" id="${v.id}"><header class="vh"><p class="eyebrow" style="--c:${colorDe[v.kind]}">${tipo[v.kind]}${v.fecha ? ` · ${v.fecha}` : ''} · ${es.length} escenas · ${mmss(dur)}</p>
    <h2>${String(vi).padStart(2, '0')} · ${esc(v.titulo.es)} <small>/ ${esc(v.titulo.en)}</small></h2><p class="lead">${esc(v.resumen.es)}</p>
    ${v.paths?.length ? `<p class="meta">Botón «▶ Cómo funciona» en: ${v.paths.map((p) => `<code>${p}</code>`).join(' ')}</p>` : ''}
    <div class="strip" style="--c:${colorDe[v.kind]}">${strip}</div></header>${cards}</section>`;
}).join('');
const indice = TODOS.map((v, i) => `<a href="#${v.id}" style="--c:${colorDe[v.kind]}">${String(i).padStart(2, '0')} ${esc(v.titulo.es)}</a>`).join('');

writeFileSync(out, `<title>Videos Cómo usar Braindy</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@300;500;700;900&family=Red+Hat+Mono:wght@400;500&display=swap">
<style>
/* Layout: a technical script, one column of videos; each scene = vignette left, sheet right; one column on phones. */
:root{--bg:#F3F5FA;--paper:#FFFFFF;--ink:#0B1B3A;--ink-soft:#43506B;--mute:#6B7690;--line:#DDE2EC;--stage:#EEF1F7;--blk:#E1E6EF;--blk2:#CDD4E1;
--hl:#2A7FFF;--hl-soft:rgba(42,127,255,.16);--scrim:rgba(11,27,58,.18);--c-res:#F5B301;--c-mkt:#8B5CF6;--c-cre:#06B6D4;--c-bui:#2A7FFF;
--display:'Red Hat Display',system-ui,sans-serif;--mono:'Red Hat Mono',ui-monospace,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#070D1C;--paper:#0F1A30;--ink:#EAF0FF;--ink-soft:#B4C0DA;--mute:#8A97B4;--line:#22304D;--stage:#0B1426;--blk:#1B2842;--blk2:#2A3A5C;--hl-soft:rgba(42,127,255,.24);--scrim:rgba(0,0,0,.35);color-scheme:dark}}
:root[data-theme="dark"]{--bg:#070D1C;--paper:#0F1A30;--ink:#EAF0FF;--ink-soft:#B4C0DA;--mute:#8A97B4;--line:#22304D;--stage:#0B1426;--blk:#1B2842;--blk2:#2A3A5C;--hl-soft:rgba(42,127,255,.24);--scrim:rgba(0,0,0,.35);color-scheme:dark}
body{background:var(--bg);color:var(--ink);font-family:var(--display);font-weight:300;line-height:1.5}
.wrap{max-width:1180px;margin:0 auto;padding-block:40px 80px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:flex;flex-direction:column;gap:40px}
h1{font-weight:900;font-size:clamp(32px,5vw,56px);line-height:1.02;letter-spacing:-.02em;margin:0;text-wrap:balance}
h1 em{font-style:normal;font-weight:300}
.eyebrow{font:500 12px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft);margin:0;display:flex;align-items:center;gap:8px}
.eyebrow::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--c,var(--hl))}
.lead{font-size:18px;max-width:68ch;margin:0;color:var(--ink-soft)}
.specs{display:flex;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none}
.specs li{font:500 12px/1 var(--mono);padding:8px 10px;border:1px solid var(--line);border-radius:99px;background:var(--paper)}
.rules{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.rules div{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:14px 16px}
.rules b{font-weight:700;display:block}
.indice{display:flex;flex-wrap:wrap;gap:6px}
.indice a{font:500 12px/1 var(--mono);color:var(--ink);text-decoration:none;padding:8px 10px;border-radius:99px;border:1px solid var(--line);background:var(--paper);border-left:4px solid var(--c)}
.indice a:focus-visible,.indice a:hover{border-color:var(--hl)}
.video{display:flex;flex-direction:column;gap:14px;scroll-margin-top:16px}
.vh{display:flex;flex-direction:column;gap:8px;border-top:2px solid var(--ink);padding-top:16px}
h2{font-weight:900;font-size:clamp(22px,3vw,30px);margin:0;line-height:1.1;text-wrap:balance}
h2 small{font-weight:300;font-size:.7em;color:var(--mute)}
.meta{font:400 12px/1.5 var(--mono);color:var(--mute);margin:0}
code{font-family:var(--mono);background:var(--stage);padding:1px 5px;border-radius:4px}
.strip{display:flex;gap:2px;height:18px}
.strip span{background:var(--c);opacity:.85;color:#0B1B3A;font:500 10px/18px var(--mono);text-align:center;border-radius:3px;min-width:14px}
.frame{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:18px;background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:14px}
.frame svg{width:100%;height:auto;border-radius:10px;display:block;max-width:100%}
.frame .ui{font:600 6.4px var(--display);fill:#fff}.frame .logo{font:900 8px var(--display);fill:var(--ink)}
.frame .nav{font:500 5.6px var(--display);fill:var(--mute)}.frame .nav.on{fill:var(--hl);font-weight:700}.frame .big{font:900 26px var(--display);fill:var(--hl)}
.ficha{min-width:0;display:flex;flex-direction:column;gap:8px}
.num{margin:0;display:flex;gap:10px;align-items:center;font:500 12px var(--mono);color:var(--mute);flex-wrap:wrap}
.num b{font:900 18px var(--display);color:var(--ink)}
.reuse{background:var(--hl-soft);color:var(--ink);padding:3px 8px;border-radius:99px}
dl{display:grid;grid-template-columns:88px minmax(0,1fr);gap:6px 12px;margin:0}
dt{font:500 11px/1.6 var(--mono);text-transform:uppercase;letter-spacing:.06em;color:var(--mute)}
dd{margin:0;min-width:0}.vo{font-weight:500}.vo.en{color:var(--ink-soft)}
footer{color:var(--mute);font-size:14px;border-top:1px solid var(--line);padding-top:16px}
@media (max-width:820px){.frame{grid-template-columns:1fr}dl{grid-template-columns:1fr}dt{margin-top:4px}}
</style>
<div class="wrap">
<header style="display:flex;flex-direction:column;gap:16px">
  <p class="eyebrow">Braindy App · Aprende › Cómo usar Braindy · Storyboard v${version} · 2026-11-06</p>
  <h1>Un video por sección. <em>Si algo cambia, se graba otra vez solo ese pedacito.</em></h1>
  <p class="lead">${TODOS.length} videos en español e inglés: uno general armado con los mismos clips de las secciones, ${TODOS.filter((v) => v.kind === 'section').length} de secciones y ${TODOS.filter((v) => v.kind === 'feature').length} de novedades. Se graban navegando la app de verdad, con la copia de Quimiolab, y cada sección lleva su botón «▶ Cómo funciona».</p>
  <ul class="specs"><li>${n} escenas</li><li>≈ ${mmss(total)} de video por idioma</li><li>16:9 1920×1080 + 9:16 en celular</li><li>Voz ES: Marisol Valverde · EN: por elegir</li><li>Música de fondo baja</li></ul>
</header>
<div class="rules">
  <div><b>Cómo se graba</b>La app real en movimiento: scroll, clics y escritura, con cursor visible y la barra de app.braindy.co arriba. Nada de pantallazos fijos.</div>
  <div><b>Inglés</b>Mismo recorrido con la app en inglés y voz en inglés. Los datos de Quimiolab quedan como están.</div>
  <div><b>Cuando algo cambia</b>Se regraba solo la escena afectada y se vuelve a montar ese video. El general se rearma solo con los clips nuevos.</div>
  <div><b>Novedades</b>Cada feature nuevo suma un video corto al catálogo, con su fecha, y aparece en Aprende › Novedades.</div>
</div>
<nav class="indice" aria-label="Videos">${indice}</nav>
${videos}
<footer>Fuente única: <code>video/tutoriales/catalogo.mjs</code>. Colores: Researcher #F5B301 (general), Builder #2A7FFF (secciones), Creator #06B6D4 (novedades). Tipografía Red Hat Display.</footer>
</div>`);
console.log(`${out}: ${TODOS.length} videos, ${n} escenas, ≈${mmss(total)} por idioma`);
