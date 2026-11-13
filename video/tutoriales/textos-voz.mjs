// The voice takes: one per video and language, scenes joined by a 2 s pause (split later on silences ≥ 1.5 s).
// Spoken spellings: «Bréindi» in Spanish; the address read out loud in both languages.
//   node textos-voz.mjs > voz/textos.json
import { TODOS } from './catalogo.mjs';
const habla = { es: (t) => t.replace(/app\.braindy\.co/g, 'app punto bréindi punto co').replace(/Braindy/g, 'Bréindi'), en: (t) => t.replace(/app\.braindy\.co/g, 'app dot braindy dot co') };
const out = [];
for (const v of TODOS) for (const lang of ['es', 'en']) {
  const own = v.escenas.map((e, i) => ({ n: i + 1, e })).filter((x) => !x.e.de); // the overview borrows the rest
  out.push({ id: v.id, lang, n: own.map((x) => x.n), text: own.map((x) => habla[lang](x.e[lang])).join(' <break time="2.0s" /> ') });
}
console.log(JSON.stringify(out, null, 1));
