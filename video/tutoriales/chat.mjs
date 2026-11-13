// WhatsApp scenes: a phone with the client's chat with Braindy, messages arriving one by one while the voice plays.
// Braindy's lines are the real texts the server sends (server/src/wa/inbound.ts COPY and wa/notices.ts).
//   node chat.mjs es|en          → clips/<lang>/whatsapp-<n>.mp4
import { readFileSync } from 'node:fs';
import { COLA, LEAD, abrir, cerrar, dur, grabar, wait } from './rec.mjs';

const lang = process.argv[2];
if (!['es', 'en'].includes(lang)) throw new Error('lang es|en');
const W = '../../web/public/brand/';
const b64 = (f, t) => `data:${t};base64,` + readFileSync(W + f).toString('base64');
const logo = b64('braindy-logo-light.svg', 'image/svg+xml'), mark = b64('braindy-mark.svg', 'image/svg+xml');
const URL = 'app.braindy.co/requests/qgASZzpjd70Ok1NJDS6v';
const T = {
  es: {
    titulo: 'Pedir por<br><b>WhatsApp.</b>', biz: 'Cuenta de empresa', hoy: 'Hoy', msg: 'Mensaje', pieza: 'Calendario de escritorio 2027',
    pide: 'Calendario de escritorio 2027 para los clientes. Te mando las fotos del equipo y un audio con la idea.',
    doc: 'Fechas importantes 2027.pdf',
    recibido: `Recibido. NicoMarca y su equipo ya tienen tu solicitud «Calendario de escritorio 2027».<br>Síguela aquí: <a>${URL}</a>`,
    revisar: `Quimiolab: NicoMarca te envía «Calendario de escritorio 2027» para revisar.<br>Míralo aquí: <a>${URL}</a><br><br>¿Lo apruebas?`,
    si: 'Aprobar', no: 'Pedir cambios', aprobado: 'Aprobado. Gracias, NicoMarca ya lo sabe.',
    baja: 'BAJA', alta: 'ALTA', parado: 'Listo, no te enviaremos más avisos por WhatsApp. Escribe START para volver a activarlos.', activo: 'Listo, los avisos por WhatsApp están activos de nuevo.',
  },
  en: {
    titulo: 'Ask on<br><b>WhatsApp.</b>', biz: 'Business account', hoy: 'Today', msg: 'Message', pieza: 'Desk calendar 2027',
    pide: 'Desk calendar 2027 for our clients. Sending you the team photos and a voice note with the idea.',
    doc: 'Key dates 2027.pdf',
    recibido: `Got it. NickMark and his team have your request "Desk calendar 2027".<br>Follow it here: <a>${URL}</a>`,
    revisar: `Quimiolab: NickMark sends you "Desk calendar 2027" to review.<br>See it here: <a>${URL}</a><br><br>Do you approve it?`,
    si: 'Approve', no: 'Request changes', aprobado: 'Approved. Thanks, NickMark knows.',
    baja: 'STOP', alta: 'START', parado: "Done, we won't send you more WhatsApp notices. Write START to turn them back on.", activo: 'Done, WhatsApp notices are on again.',
  },
}[lang];
const out = (h, t) => `<div class="m o">${h}<i>${t} <b>✓✓</b></i></div>`;
const inn = (h, t) => `<div class="m n">${h}<i>${t}</i></div>`;
const audio = `<div class="au"><span>▶</span><em></em><small>0:14</small></div>`;
const fotos = `<div class="ft"><span></span><span></span><span></span></div>`;

// each scene: messages already on screen, then the ones that arrive (ms after the start)
const ESC = [
  { ya: [`<div class="day">${T.hoy}</div>`], llegan: [[900, out(`<div>${T.pide}</div>`, '10:41')]] },
  { ya: [`<div class="day">${T.hoy}</div>`, out(`<div>${T.pide}</div>`, '10:41')], llegan: [[500, out(fotos, '10:41')], [1500, out(audio, '10:42')], [2500, out(`<div class="dc">📄 ${T.doc}</div>`, '10:42')], [4000, inn(T.recibido, '10:42')]] },
  { ya: [`<div class="day">${T.hoy}</div>`], llegan: [[400, inn(T.revisar, '15:20') + `<div class="btns"><span>${T.si}</span><span>${T.no}</span></div>`], [2200, out(`<div>${T.si}</div>`, '15:24')], [3000, inn(T.aprobado, '15:24')]], toca: 1700 },
  { ya: [`<div class="day">${T.hoy}</div>`], llegan: [[500, out(`<div>${T.baja}</div>`, '18:02')], [1300, inn(T.parado, '18:02')], [3000, out(`<div>${T.alta}</div>`, '18:05')], [3700, inn(T.activo, '18:05')]] },
];

const css = `body{margin:0;width:1280px;height:720px;overflow:hidden;background:radial-gradient(1200px 700px at 80% 10%,#2A4BFF55,transparent),linear-gradient(135deg,#071230,#0B1B3A 55%,#1B2C7A);font-family:'Red Hat Display';color:#fff;position:relative}
.t{position:absolute;left:64px;top:84px;width:420px}.t img{height:34px}.t h1{font-weight:300;font-size:56px;line-height:1.05;margin:34px 0 16px;letter-spacing:-.01em}.t h1 b{font-weight:900}.u{position:absolute;left:64px;bottom:64px;font-size:18px;opacity:.85}
.ph{position:absolute;left:640px;top:36px;width:318px;height:648px;border-radius:46px;background:#0A0F1E;padding:9px;box-sizing:border-box;box-shadow:0 30px 70px #0008,inset 0 0 0 2px #2b3350}
.sc{width:100%;height:100%;border-radius:38px;overflow:hidden;background:#EFE7DE;display:flex;flex-direction:column;font-family:Roboto,Arial;color:#111B21}
.st{height:30px;background:#0B6E5F}.hd{background:#0B6E5F;color:#fff;display:flex;align-items:center;gap:10px;padding:6px 12px 10px}
.hd .av{width:34px;height:34px;border-radius:50%;background:#fff;display:grid;place-items:center}.hd .av img{width:22px}.hd b{font-weight:500;font-size:15px;display:block}.hd small{font-size:11px;opacity:.85}
.st,.hd,.in{flex-shrink:0}.bd{flex:1;overflow:hidden;padding:10px;display:flex;flex-direction:column;gap:6px;justify-content:flex-end;font-size:12.5px;line-height:1.38}
.m{max-width:82%;padding:6px 8px 4px;border-radius:9px;box-shadow:0 1px 1px #0001;animation:a .35s ease-out}@keyframes a{from{opacity:0;transform:translateY(8px)}}
.m i{display:block;text-align:right;font-style:normal;font-size:10px;color:#667781;margin-top:2px}.m i b{color:#53BDEB;font-weight:500}
.o{align-self:flex-end;background:#D9FDD3}.n{align-self:flex-start;background:#fff}.m a{color:#027EB5;word-break:break-all}
.day{align-self:center;background:#fff;color:#54656F;font-size:11px;padding:4px 10px;border-radius:7px;margin:4px 0}
.btns{align-self:flex-start;width:82%;display:flex;gap:4px;margin-top:-3px;animation:a .35s ease-out}.btns span{flex:1;background:#fff;border-radius:8px;text-align:center;color:#027EB5;font-weight:500;padding:7px 0;box-shadow:0 1px 1px #0001;transition:background .2s}.btns span.on{background:#DDE6FF;outline:2px solid #2A4BFF}
.au{display:flex;align-items:center;gap:8px;width:190px}.au span{color:#0B6E5F}.au em{flex:1;height:3px;background:#9DB;border-radius:2px}.au small{color:#667781;font-size:10px}
.ft{display:grid;grid-template-columns:repeat(3,58px);gap:4px}.ft span{height:58px;border-radius:6px;background:linear-gradient(135deg,#0097D6,#001A4D)}.dc{background:#C8F1BE;border-radius:6px;padding:8px}
.in{display:flex;gap:6px;padding:8px 8px 14px}.in div{flex:1;background:#fff;border-radius:20px;padding:9px 14px;color:#8696A0;font-size:13px}.in span{width:36px;height:36px;border-radius:50%;background:#0B6E5F}`;
const html = (ya) => `<html><head><link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@300;900&family=Roboto:wght@400;500&display=swap" rel="stylesheet"><style>${css}</style></head>
<body><div class="t"><img src="${logo}"><h1>${T.titulo}</h1></div><div class="u">app.braindy.co</div>
<div class="ph"><div class="sc"><div class="st"></div><div class="hd"><div class="av"><img src="${mark}"></div><div><b>Braindy</b><small>${T.biz}</small></div></div>
<div class="bd">${ya.join('')}</div><div class="in"><div>${T.msg}</div><span></span></div></div></div></body></html>`;

const b = await abrir();
const p = await (await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 })).newPage();
for (const [i, e] of ESC.entries()) {
  const voz = `voz/${lang}/whatsapp-${i + 1}.mp3`, d = LEAD + dur(voz) + COLA;
  await p.setContent(html(e.ya), { waitUntil: 'networkidle' }); await wait(400);
  await grabar(`clips/${lang}/whatsapp-${i + 1}.mp4`, d, p, '', async () => {
    const t0 = Date.now();
    const steps = [...e.llegan.map(([ms, h]) => [ms, () => p.evaluate((h) => document.querySelector('.bd').insertAdjacentHTML('beforeend', h), h)])];
    if (e.toca) steps.push([e.toca, () => p.evaluate(() => document.querySelector('.btns span')?.classList.add('on'))]);
    for (const [ms, f] of steps.sort((a, b) => a[0] - b[0])) { await wait(Math.max(0, ms - (Date.now() - t0))); await f(); }
  }, { full: true });
}
await cerrar();
