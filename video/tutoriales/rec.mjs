// Recording kit for the tutorial clips (from the client tour): the real app on the local emulators (web-tut 5176 +
// api-tut 8789 + emulators 9299/8281, Quimiolab copy, user video-demo), a visible cursor with click ripple, a focus ring,
// and the app.braindy.co address bar on top. One clip = one scene, exactly lead + voice + tail long.
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

export const BASE = 'http://localhost:5176', S = 1.5, VW = 1280, VH = 664, LEAD = 0.5, COLA = 0.8;
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export const ff = (a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a], { stdio: 'inherit' });
export const dur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());

// ---------- ES → EN labels, read from the app's own string tables ----------
const I18N = resolve('../../web/src/i18n');
const es2en = new Map();
for (const f of readdirSync(I18N).filter((x) => x.endsWith('.ts'))) {
  const src = readFileSync(join(I18N, f), 'utf8'); const en = {}, es = {}; let cur = null;
  for (const line of src.split('\n')) {
    if (/(En\b|\ben)\s*[:=][^=]*\{\s*$/.test(line) || /En\s*=\s*\{/.test(line) || /^\s*en:\s*\{/.test(line)) cur = en;
    else if (/(Es\b|\bes)\s*[:=][^=]*\{\s*$/.test(line) || /Es\s*[:=]/.test(line) && /\{\s*$/.test(line) || /^\s*es:\s*\{/.test(line)) cur = es;
    if (!cur) continue;
    for (const m of line.matchAll(/'([\w.]+)':\s*'((?:[^'\\]|\\.)*)'/g)) cur[m[1]] = m[2].replace(/\\'/g, "'");
  }
  for (const k of Object.keys(es)) if (en[k] && !es2en.has(es[k])) es2en.set(es[k], en[k]);
}
/** The label in the recording language: Spanish as written in the app, English looked up from the same key. */
export const etiqueta = (lang) => (s) => (lang === 'es' ? s : es2en.get(s) ?? (() => { throw new Error(`sin EN para «${s}»`); })());

// ---------- overlays: cursor + click ripple + focus ring ----------
const CURSOR = `(() => { const go = () => { if (document.getElementById('v-cursor')) return;
  const st = document.createElement('style'); st.textContent = '#v-cursor{position:fixed;z-index:2147483646;width:22px;height:26px;margin:-3px 0 0 -3px;pointer-events:none;transition:transform .08s;left:-40px;top:-40px}#v-cursor svg{filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}.v-onda{position:fixed;z-index:2147483645;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid #2A4BFF;pointer-events:none;animation:v-onda .5s ease-out forwards}@keyframes v-onda{from{transform:scale(.3);opacity:1}to{transform:scale(1.4);opacity:0}}.vfoco{outline:4px solid #2A4BFF!important;outline-offset:6px!important;box-shadow:0 0 0 14px rgba(42,75,255,.18)!important;border-radius:14px!important;transition:outline-color .3s}';
  document.head.append(st); const k = document.createElement('div'); k.id = 'v-cursor';
  k.innerHTML = '<svg width="22" height="26" viewBox="0 0 22 26"><path d="M2 2l17 10-8 2-4 8z" fill="#fff" stroke="#0B1B3A" stroke-width="2" stroke-linejoin="round"/></svg>';
  document.body.append(k);
  addEventListener('mousemove', (e) => { k.style.left = e.clientX + 'px'; k.style.top = e.clientY + 'px'; }, true);
  addEventListener('mousedown', (e) => { const o = document.createElement('div'); o.className = 'v-onda'; o.style.left = e.clientX + 'px'; o.style.top = e.clientY + 'px'; document.body.append(o); setTimeout(() => o.remove(), 600); k.style.transform = 'scale(.85)'; }, true);
  addEventListener('mouseup', () => (k.style.transform = ''), true); };
  if (document.body) go(); else addEventListener('DOMContentLoaded', go); })();`;

let browser, storage;
const gcs = () => (storage ??= new (createRequire(resolve('../../server/package.json'))('@google-cloud/storage').Storage)());
export async function abrir() { browser = await chromium.launch({ channel: 'chrome' }); return browser; }
export const cerrar = () => browser?.close();

/** A browser context in the recording language, signed in as the local client (or signed out). */
export async function contexto(lang, logged = true, { mobile = false, ios = false } = {}) {
  const ua = ios ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' : undefined;
  const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 780 } : { width: VW, height: VH }, deviceScaleFactor: mobile ? 2 : S, locale: lang === 'es' ? 'es-CO' : 'en-US', isMobile: mobile, hasTouch: mobile, ...(ua ? { userAgent: ua } : {}) });
  await ctx.addInitScript(() => { for (const n of ['home', 'ask', 'review']) localStorage.setItem(`tg-tour-${n}-video-demo`, '1'); localStorage.setItem('braindy.brand', 'quimiolab'); });
  await ctx.addInitScript(CURSOR);
  // quimiolab.com only lets app.braindy.co frame it; dropped in this local browser only
  await ctx.route(/quimiolab\.com/, async (r) => {
    if (r.request().resourceType() !== 'document') return r.continue();
    const res = await r.fetch(); const h = { ...res.headers() }; delete h['x-frame-options']; delete h['content-security-policy'];
    return r.fulfill({ response: res, headers: h });
  });
  // files the local API points at (see tut-firma.mjs), read here with this PC's own Storage access
  await ctx.route(/^https:\/\/tut-archivo\.invalid\//, async (r) => {
    const u = new URL(r.request().url()); const f = gcs().bucket(u.searchParams.get('b')).file(u.searchParams.get('p'));
    try { const [[m], [body]] = await Promise.all([f.getMetadata(), f.download()]); return r.fulfill({ status: 200, contentType: m.contentType, body, headers: { 'access-control-allow-origin': '*' } }); }
    catch { return r.fulfill({ status: 404, body: '' }); }
  });
  const p = await ctx.newPage();
  await p.goto(BASE + '/login'); await p.waitForTimeout(2500);
  if (logged) {
    const L = etiqueta(lang);
    await p.getByText(L('Usar contraseña')).click();
    await p.fill('input[type=email]', 'video-demo@braindy.test'); await p.fill('input[type=password]', 'demo-local-only'); await p.keyboard.press('Enter');
    await p.waitForURL(/home/, { timeout: 25000 }); await p.waitForTimeout(3000);
  }
  return p;
}

// ---------- address bar (1920×84) ----------
let barPage;
async function barra(url, file) {
  barPage ??= await (await browser.newContext({ viewport: { width: VW, height: 56 }, deviceScaleFactor: S })).newPage();
  await barPage.setContent(`<html><head><link href="https://fonts.googleapis.com/css2?family=Red+Hat+Text:wght@400;600&display=swap" rel="stylesheet"><style>body{margin:0;height:56px;background:#E9ECF3;display:flex;align-items:center;gap:14px;padding:0 18px;font-family:'Red Hat Text',Arial}
  .d{width:12px;height:12px;border-radius:50%;background:#C9CED9}.u{flex:1;height:34px;border-radius:99px;background:#fff;display:flex;align-items:center;gap:10px;padding:0 16px;font-size:16px;color:#1B1F2A}.u b{font-weight:600}.u span{color:#6B7280}</style></head>
  <body><i class="d"></i><i class="d"></i><i class="d"></i><div class="u"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5563" stroke-width="2.4"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg><b>app.braindy.co</b><span>${url}</span></div></body></html>`, { waitUntil: 'networkidle' });
  await barPage.screenshot({ path: file });
}

/** Records `act` on page p for d seconds into out (1920×1080, 30 fps): screencast + address bar (or full frame). */
export async function grabar(out, d, p, url, act, { full = false } = {}) {
  const dir = resolve('tmp-rec', out.replace(/[\\/:]/g, '_')); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const cdp = await p.context().newCDPSession(p);
  const frames = [];
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const f = join(dir, `f${String(frames.length).padStart(6, '0')}.jpg`); writeFileSync(f, Buffer.from(data, 'base64')); frames.push({ f, t: metadata.timestamp });
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  const H = full ? 1080 : Math.round(VH * S);
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 1920, maxHeight: H, everyNthFrame: 1 });
  const t0 = Date.now() / 1000;
  const actP = act().catch((e) => console.log('  acción:', String(e).split('\n')[0].slice(0, 200)));
  await Promise.race([actP, wait((d + 0.3) * 1000)]);
  const rest = t0 + d + 0.3 - Date.now() / 1000; if (rest > 0) await wait(rest * 1000);
  const tEnd = Date.now() / 1000;
  await cdp.send('Page.stopScreencast'); await cdp.detach();
  if (!frames.length) throw new Error('sin cuadros: ' + out);
  frames[0].t = Math.min(frames[0].t, t0);
  const list = frames.map((q, i) => `file '${q.f.replace(/\\/g, '/')}'\nduration ${Math.max(0.001, (frames[i + 1]?.t ?? tEnd) - q.t).toFixed(3)}`).join('\n') + `\nfile '${frames.at(-1).f.replace(/\\/g, '/')}'\n`;
  writeFileSync(join(dir, 'l.txt'), list);
  mkdirSync(resolve(out, '..'), { recursive: true });
  if (full) ff(['-f', 'concat', '-safe', '0', '-i', join(dir, 'l.txt'), '-vf', 'fps=30,scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x0B1B3A,format=yuv420p', '-t', d.toFixed(3), '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', out]);
  else {
    const bar = join(dir, 'bar.png'); await barra(url, bar);
    ff(['-f', 'concat', '-safe', '0', '-i', join(dir, 'l.txt'), '-i', bar, '-filter_complex', `[0:v]fps=30,scale=1920:996:flags=lanczos,pad=1920:1080:0:84[a];[a][1:v]overlay=0:0,format=yuv420p`, '-t', d.toFixed(3), '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', out]);
  }
  rmSync(dir, { recursive: true, force: true });
  await Promise.race([actP, wait(8000)]);   // never let a late step leak into the next scene
  console.log('ok', out, d.toFixed(2) + ' s', frames.length, 'cuadros');
}

// ---------- motion helpers ----------
export const ir = async (p, u) => { await p.evaluate((x) => { history.pushState({}, '', x); dispatchEvent(new PopStateEvent('popstate')); scrollTo(0, 0); }, u); await p.waitForTimeout(3000); };
export const desliza = (target, y, ms) => target.evaluate(([y, ms]) => new Promise((ok) => {
  const y0 = scrollY, t0 = performance.now(), e = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const f = (now) => { const k = Math.min(1, (now - t0) / ms); scrollTo(0, y0 + (y - y0) * e(k)); k < 1 ? requestAnimationFrame(f) : ok(); };
  requestAnimationFrame(f); }), [y, ms]);
export const yDe = (loc) => loc.first().evaluate((el) => el.getBoundingClientRect().top + scrollY);
export const mueve = async (p, loc, steps = 30) => { const bx = await loc.first().boundingBox(); if (bx) await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2, { steps }); return bx; };
export const clic = async (p, loc, steps = 30) => { await mueve(p, loc, steps); await wait(150); await p.mouse.down(); await wait(90); await p.mouse.up(); };
export const foco = (loc) => loc.first().evaluate((el) => el.classList.add('vfoco'));
export const sinFoco = (p) => p.evaluate(() => document.querySelectorAll('.vfoco').forEach((e) => e.classList.remove('vfoco')));
export const escribe = (p, t, ms) => p.keyboard.type(t, { delay: ms });
/** Scrolls the nearest scrolling box around an element (side panels) to its bottom over ms. */
export const deslizaCaja = (loc, ms) => loc.first().evaluate((el, ms) => new Promise((ok) => {
  let c = el.parentElement; while (c && !(c.scrollHeight > c.clientHeight + 10 && /auto|scroll/.test(getComputedStyle(c).overflowY))) c = c.parentElement;
  if (!c) return ok(); const y0 = c.scrollTop, y1 = c.scrollHeight, t0 = performance.now(), e = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const f = (n) => { const k = Math.min(1, (n - t0) / ms); c.scrollTop = y0 + (y1 - y0) * e(k); k < 1 ? requestAnimationFrame(f) : ok(); }; requestAnimationFrame(f); }), ms);
