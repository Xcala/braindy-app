// Montage of the tutorial videos from the scene clips: subtitles from the catalog, the voice lines, music ducked under
// the voice. Each video comes out wide (16:9) and tall (9:16, the clip as a card with big subtitles), per language.
//   node montar.mjs es|en [inicio,pedir,...]      → out/<lang>/<id>.mp4 and out/<lang>/<id>_9x16.mp4
// The overview's opening and closing cards are drawn here; its other scenes reuse the section clips and voices.
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { TODOS, escenasDe } from './catalogo.mjs';
import { COLA, LEAD, dur, ff } from './rec.mjs';

const lang = process.argv[2];
if (!['es', 'en'].includes(lang)) throw new Error('lang es|en');
const only = process.argv[3]?.split(',');
const XF = 0.4, TINTA = '#0B1B3A', TMP = resolve('tmp-mont', lang), OUT = resolve('out', lang);
mkdirSync(TMP, { recursive: true }); mkdirSync(OUT, { recursive: true });
const B = '../../web/public/brand/';
const b64 = (f, t) => `data:${t};base64,` + readFileSync(B + f).toString('base64');
const LOGO = b64('braindy-logo-light.svg', 'image/svg+xml'), BRAINS = b64('brains/four-brains.jpg', 'image/jpeg');
const FONT = '<link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@300;500;700;900&display=swap" rel="stylesheet">';
const TX = {
  es: { serie: 'Cómo usar Braindy', firma: 'Lo hace NicoMarca. Sus Brains lo aceleran.', nuevo: 'Nuevo en Braindy' },
  en: { serie: 'How to use Braindy', firma: 'Made by NickMark. Powered by his Brains.', nuevo: 'New in Braindy' },
}[lang];

const frases = (t, max) => {
  const out = [];
  for (const p of t.split(/(?<=[.:?])\s+/).map((s) => s.trim()).filter(Boolean)) {
    if (p.length <= max) { out.push(p); continue; }
    let a = '';
    for (const tr of p.split(/(?<=,)\s/)) { if ((a + ' ' + tr).trim().length > max && a) { out.push(a.trim()); a = tr; } else a = (a + ' ' + tr).trim(); }
    if (a) out.push(a);
  }
  return out;
};

const nav = await chromium.launch({ channel: 'chrome' });
const pag = await (await nav.newContext({ viewport: { width: 1920, height: 1920 } })).newPage();
const png = async (w, h, body, css, file, bg = 'transparent') => {
  await pag.setViewportSize({ width: w, height: h });
  await pag.setContent(`<html><head>${FONT}<style>html,body{margin:0;background:${bg};width:${w}px;height:${h}px;font-family:'Red Hat Display';color:#fff;overflow:hidden}${css}</style></head><body>${body}</body></html>`, { waitUntil: 'networkidle' });
  await pag.evaluate(() => document.fonts.ready);
  await pag.screenshot({ path: file, omitBackground: bg === 'transparent' });
};

/** The overview's cards: a still in the Braindy look, as long as their voice line. */
async function tarjeta(e, file, d) {
  const img = file.replace(/\.mp4$/, '.png');
  const [t1, t2] = e === 'abre' ? (lang === 'es' ? ['Tu marca,', 'en un solo lugar.'] : ['Your brand,', 'all in one place.']) : (lang === 'es' ? ['Todo en', 'app.braindy.co'] : ['All at', 'app.braindy.co']);
  await png(1920, 1080, `<div class="brains"></div><div class="w"><img src="${LOGO}" style="height:56px;align-self:flex-start"><div class="e">${TX.serie}</div><h1><b>${t1}</b><br><span>${t2}</span></h1><p>${TX.firma}</p></div>`,
    `body{background:radial-gradient(circle at 12% 0%,rgba(245,179,1,.28),transparent 40%),radial-gradient(circle at 90% 100%,rgba(139,92,246,.35),transparent 45%),linear-gradient(135deg,#0B1B3A,#1A1450 60%,#0E2A4F)}
     .w{position:absolute;inset:0;padding:108px 132px;display:flex;flex-direction:column}.e{margin-top:auto;font-weight:700;font-size:24px;letter-spacing:.2em;text-transform:uppercase;opacity:.75}
     h1{font-size:120px;line-height:1;letter-spacing:-.035em;margin:24px 0 0}h1 b{font-weight:900}h1 span{font-weight:300}p{font-size:36px;font-weight:300;margin:34px 0 0;opacity:.9}
     .brains{position:absolute;right:0;top:170px;width:1020px;height:260px;background:url(${BRAINS}) center/contain no-repeat;mix-blend-mode:screen;-webkit-mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)}`, img, TINTA);
  ff(['-loop', '1', '-i', img, '-vf', `scale=2112:-2,zoompan=z='1+0.04*on/(${d}*30)':d=1:s=1920x1080:fps=30,format=yuv420p`, '-t', d.toFixed(3), '-c:v', 'libx264', '-crf', '17', file]);
}

/** One scene with its subtitles burned in: wide = clip + bottom bar; tall = clip as a card, title above, subtitles below. */
async function escena(v, i, e, alto) {
  const ref = e.de ? e.de.replace('.', '-') : `${v.id}-${i + 1}`;
  const voz = `voz/${lang}/${ref}.mp3`;
  let clip = `clips/${lang}/${ref}.mp4`;
  const d = LEAD + dur(voz) + COLA;
  if (!e.de && v.kind === 'general') { clip = join(TMP, `card-${i}.mp4`); if (!alto) await tarjeta(i === 0 ? 'abre' : 'cierra', clip, d); }
  const fs = frases(e[lang], alto ? 46 : 80), total = fs.reduce((a, s) => a + s.length, 0), dv = dur(voz);
  const W = alto ? 1080 : 1920, H = alto ? 1920 : 1080, VY = 560, VH = 608;
  const ent = alto ? ['-f', 'lavfi', '-i', `color=c=${TINTA}:s=${W}x${H}:r=30:d=${d.toFixed(3)}`, '-i', clip] : ['-i', clip];
  let f = alto ? `[1:v]scale=${W - 48}:${VH}[c];[0:v][c]overlay=24:${VY}[f0]` : '[0:v]null[f0]', last = 'f0', idx = alto ? 2 : 1;
  if (alto) {
    const fr = join(TMP, `frente-${v.id}.png`);
    await png(W, H, `<div class="win"></div><div class="top"><img src="${LOGO}"><div class="eye">${v.kind === 'feature' ? TX.nuevo : TX.serie}</div><div class="tit">${v.titulo[lang]}</div></div><div class="pie">${TX.firma}</div>`,
      `.win{position:absolute;left:24px;top:${VY}px;width:${W - 48}px;height:${VH}px;border-radius:28px;box-shadow:0 0 0 2000px ${TINTA}}.top{position:absolute;top:150px;left:70px;right:70px;text-align:center}.top img{height:54px}
       .eye{font-weight:700;font-size:28px;letter-spacing:.16em;text-transform:uppercase;color:#8FB4FF;margin-top:44px}.tit{font-weight:900;font-size:74px;line-height:1.05;letter-spacing:-.02em;margin-top:18px}
       .pie{position:absolute;bottom:110px;width:100%;text-align:center;font-weight:500;font-size:30px;color:#8FB4FF}`, fr);
    ent.push('-loop', '1', '-i', fr); f += `;[${last}][${idx}:v]overlay=0:0[fr]`; last = 'fr'; idx++;
  }
  let t = LEAD;
  for (let k = 0; k < fs.length; k++) {
    const p = join(TMP, `sub-${v.id}-${i}-${k}${alto ? 't' : ''}.png`);
    await png(W, H, `<div>${fs[k]}</div>`, alto
      ? `div{position:absolute;left:70px;right:70px;top:${VY + VH + 90}px;text-align:center;font-weight:500;font-size:58px;line-height:1.3}`
      : `div{position:absolute;left:50%;bottom:64px;transform:translateX(-50%);max-width:1500px;background:rgba(11,27,58,.9);font-weight:500;font-size:40px;line-height:1.35;padding:16px 32px;border-radius:16px;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.25)}`, p);
    const largo = dv * fs[k].length / total, fin = k === fs.length - 1 ? d : t + largo;
    ent.push('-loop', '1', '-i', p); f += `;[${last}][${idx}:v]overlay=0:0:enable='between(t,${t.toFixed(2)},${fin.toFixed(2)})'[s${k}]`; last = `s${k}`; t += largo; idx++;
  }
  const out = join(TMP, `${v.id}-${i}${alto ? 't' : ''}.mp4`);
  ff([...ent, '-filter_complex', f, '-map', `[${last}]`, '-t', d.toFixed(3), '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', out]);
  return { out, d, voz };
}

/** Scenes joined with short fades; voices placed on their scenes; music trimmed, faded and ducked by the voice. */
function unir(clips, final) {
  const ent = [], ini = []; let off = 0, acc = '[0:v]', f = '';
  clips.forEach((c) => ent.push('-i', c.out)); clips.forEach((c) => ent.push('-i', c.voz));
  for (let k = 0; k < clips.length; k++) {
    ini.push(k === 0 ? 0 : off);
    if (k > 0) { f += `${acc}[${k}:v]xfade=transition=fade:duration=${XF}:offset=${off.toFixed(3)}[v${k}];`; acc = `[v${k}]`; }
    off += clips[k].d - XF;
  }
  const total = off + XF, n = clips.length;
  ent.push('-stream_loop', '-1', '-i', 'musica.mp3');
  clips.forEach((c, k) => { const ms = Math.round((ini[k] + LEAD) * 1000); f += `[${n + k}:a]adelay=${ms}|${ms}[a${k}];`; });
  f += clips.map((_, k) => `[a${k}]`).join('') + `amix=inputs=${n}:normalize=0,highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,asplit=2[voz][llave];`;
  f += `[${2 * n}:a]atrim=0:${total.toFixed(2)},asetpts=PTS-STARTPTS,highpass=f=50,lowpass=f=9000,equalizer=f=2500:t=q:w=1.2:g=-5,loudnorm=I=-28:TP=-6:LRA=5,volume=-6dB,aresample=48000,afade=t=in:d=1.5,afade=t=out:st=${Math.max(0, total - 3).toFixed(2)}:d=3[mus];`;
  f += `[mus][llave]sidechaincompress=threshold=0.015:ratio=8:attack=40:release=600:makeup=1[musd];[voz][musd]amix=inputs=2:normalize=0,alimiter=limit=0.89[aud]`;
  ff([...ent, '-filter_complex', f, '-map', clips.length > 1 ? acc : '0:v', '-map', '[aud]', '-t', total.toFixed(3), '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', final]);
  console.log('listo', final, dur(final).toFixed(1) + ' s');
}

for (const v of TODOS.filter((x) => !only || only.includes(x.id))) {
  const es = escenasDe(v);
  for (const alto of [false, true]) {
    const clips = [];
    for (const [i, e] of es.entries()) clips.push(await escena(v, i, e, alto));
    unir(clips, join(OUT, `${v.id}${alto ? '_9x16' : ''}.mp4`));
  }
}
await nav.close();
