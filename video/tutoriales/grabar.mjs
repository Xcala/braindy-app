// Records the tutorial clips: one per scene and language, as long as its voice line (+ lead and tail).
//   node grabar.mjs es|en [inicio,pedir.3,...]     (videos or single scenes; default all)
// Output: clips/<lang>/<video>-<n>.mp4. Cards (the overview's opening and closing) are made by montar.mjs.
import { existsSync } from 'node:fs';
import { TODOS } from './catalogo.mjs';
import { ESCENAS } from './acciones.mjs';
import { BASE, COLA, LEAD, abrir, cerrar, contexto, dur, etiqueta, grabar, wait } from './rec.mjs';
import { corre } from './acciones.mjs';

const lang = process.argv[2];
if (!['es', 'en'].includes(lang)) throw new Error('lang es|en');
const only = process.argv[3]?.split(',');
const want = (id, n) => !only || only.includes(id) || only.includes(`${id}.${n}`);
const L = etiqueta(lang);

await abrir();
let main = null;
const faltan = [];
for (const v of TODOS) for (const [i, e] of v.escenas.entries()) {
  const n = i + 1, key = `${v.id}.${n}`;
  if (e.de || !want(v.id, n)) continue;
  const s = ESCENAS[key];
  if (!s) { if (v.kind !== 'general') faltan.push(key); continue; }
  const voz = `voz/${lang}/${v.id}-${n}.mp3`;
  if (!existsSync(voz)) { faltan.push(key + ' (voz)'); continue; }
  const d = LEAD + dur(voz) + COLA;
  const own = s.logged === false || s.mobile;
  const p = own ? await contexto(lang, s.logged !== false, { mobile: s.mobile, ios: s.ios }) : (main ??= await contexto(lang, true));
  if (s.url && !(own && s.url === '/login')) { await p.goto(BASE + s.url); await p.waitForTimeout(3000);
    await p.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 9000 }).catch(() => {}); await p.waitForTimeout(500); }
  try { if (s.prep) await s.prep(p, L, lang); } catch (e) { console.log('  prep:', String(e).split('\n')[0]); }
  const path = new URL(p.url()).pathname + new URL(p.url()).search;
  await grabar(`clips/${lang}/${v.id}-${n}.mp4`, d, p, path, () => corre(p, s.pasos, L, lang), { full: !!s.full || !!s.mobile });
  if (own) await p.context().close(); else if (!s.keep) { await p.keyboard.press('Escape').catch(() => {}); await p.mouse.move(5, 300); await wait(400); }
}
await cerrar();
if (faltan.length) console.log('sin acción:', faltan.join(', '));
