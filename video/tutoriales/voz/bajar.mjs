// Downloads each voice take (ids.txt, same order as textos.json) to voz/<lang>/<id>.take.mp3 and splits it on the
// 2 s pauses into voz/<lang>/<id>-<n>.mp3 (n = scene number in the catalog), trimmed, with 0.15 s of air each side.
//   node voz/bajar.mjs <creations listing file>      (run from video/tutoriales)
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
const [listing] = process.argv.slice(2);
const textos = JSON.parse(readFileSync('voz/textos.json', 'utf8'));
const ids = readFileSync('voz/ids.txt', 'utf8').split(/\s+/).filter(Boolean);
const urls = Object.fromEntries([...readFileSync(listing, 'utf8').matchAll(/identifier: (\S+)[\s\S]*?\n    url: "([^"]+)"/g)].map((m) => [m[1], m[2]]));
const ff = (a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);
const dur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
const bad = [];
for (const [i, t] of textos.entries()) {
  mkdirSync(`voz/${t.lang}`, { recursive: true });
  const take = `voz/${t.lang}/${t.id}.take.mp3`;
  if (!existsSync(take)) writeFileSync(take, Buffer.from(await (await fetch(urls[ids[i]])).arrayBuffer()));
  const log = spawnSync('ffmpeg', ['-hide_banner', '-i', take, '-af', 'silencedetect=n=-40dB:d=1.4', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
  const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
  const total = dur(take);
  // speech segments between the long silences
  const cuts = [0]; const stops = [];
  starts.forEach((s, k) => { if (s > 0.2 && ends[k] !== undefined && ends[k] < total - 0.1) { stops.push(s); cuts.push(ends[k]); } });
  stops.push(total);
  if (cuts.length !== t.n.length) { bad.push(`${t.id} ${t.lang}: ${cuts.length} pieces, expected ${t.n.length}`); continue; }
  t.n.forEach((n, k) => {
    const a = Math.max(0, cuts[k] - 0.15), b = Math.min(total, stops[k] + 0.15);
    ff(['-i', take, '-ss', a.toFixed(3), '-to', b.toFixed(3), '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,apad=pad_dur=0.15', '-c:a', 'libmp3lame', '-q:a', '2', `voz/${t.lang}/${t.id}-${n}.mp3`]);
  });
  console.log('ok', t.id, t.lang, t.n.length, 'scenes', total.toFixed(1) + ' s');
}
if (bad.length) { console.log('REVISAR:\n' + bad.join('\n')); process.exitCode = 1; }
