// DRY-RUN over the locally mounted Drive: files, size and types per brand. Reads metadata only,
// copies nothing. Usage: npm run drive:map -w server
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { EXCLUDED_FILE_NAMES } from './config.js';
import { LOCAL_FOLDERS, absFolder, importable, walkLocal, type LocalFile } from './local.js';

const KINDS: Record<string, RegExp> = {
  image: /\.(png|jpe?g|gif|webp|svg|heic|tiff?|bmp)$/i,
  video: /\.(mp4|mov|m4v|avi|webm|mkv)$/i,
  pdf: /\.pdf$/i,
  design: /\.(ai|psd|indd|fig|sketch|xd|eps|afdesign|aep|prproj)$/i,
  office: /\.(docx?|xlsx?|pptx?|key|pages|numbers|csv|txt|md)$/i,
  font: /\.(otf|ttf|woff2?)$/i,
  archive: /\.(zip|rar|7z)$/i,
};
const kindOf = (f: LocalFile) =>
  f.googleShortcut ? 'google' : Object.entries(KINDS).find(([, re]) => re.test(f.name))?.[0] ?? 'other';
const gb = (n: number) => (n / 1024 ** 3).toFixed(2);

const allAbs = new Set(Object.keys(LOCAL_FOLDERS).map(absFolder));
const rows: string[] = [];
const missing: string[] = [];
const summary: Record<string, { files: number; bytes: number; google: number }> = {};
let totalFiles = 0, totalBytes = 0, totalGoogle = 0, keptFiles = 0, keptBytes = 0;
const cache: Record<string, Array<Pick<LocalFile, 'relPath' | 'size' | 'mtimeMs' | 'googleShortcut'>>> = {};
const big: Array<{ brand: string; path: string; size: number }> = [];
const otherExt = new Map<string, number>();

for (const brandId of Object.keys(LOCAL_FOLDERS).sort()) {
  const abs = absFolder(brandId);
  if (!existsSync(abs)) { missing.push(`${brandId} → ${LOCAL_FOLDERS[brandId]}`); continue; }
  const skip = new Set([...allAbs].filter((p) => p !== abs && p.startsWith(abs)));
  const files = (await walkLocal(abs, skip)).filter((f) => !EXCLUDED_FILE_NAMES.includes(f.name));
  const real = files.filter((f) => !f.googleShortcut);
  const bytes = real.reduce((n, f) => n + f.size, 0);
  const byKind: Record<string, number> = {};
  for (const f of files) {
    const k = kindOf(f);
    byKind[k] = (byKind[k] ?? 0) + 1;
    if (k === 'other') otherExt.set(extname(f.name).toLowerCase() || '(none)', (otherExt.get(extname(f.name).toLowerCase() || '(none)') ?? 0) + 1);
    if (f.size > 500 * 1024 ** 2) big.push({ brand: brandId, path: f.relPath, size: f.size });
  }
  const google = files.length - real.length;
  const kept = files.filter(importable);
  const kBytes = kept.reduce((n, f) => n + f.size, 0);
  keptFiles += kept.length; keptBytes += kBytes;
  cache[brandId] = files.map(({ relPath, size, mtimeMs, googleShortcut }) => ({ relPath, size, mtimeMs, googleShortcut }));
  summary[brandId] = { files: real.length, bytes, google };
  totalFiles += real.length; totalBytes += bytes; totalGoogle += google;
  rows.push(`| ${brandId} | ${LOCAL_FOLDERS[brandId]} | ${real.length} | ${gb(bytes)} | **${kept.length}** | **${gb(kBytes)}** | ${google} | ${Object.entries(byKind).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')} |`);
  console.log(`${brandId.padEnd(30)} all ${String(real.length).padStart(6)} / ${gb(bytes).padStart(7)} GB   import ${String(kept.length).padStart(6)} / ${gb(kBytes).padStart(7)} GB  (+${google} Google)`);
}

const dir = resolve(import.meta.dirname, '../../../migration-reports');
mkdirSync(dir, { recursive: true });
writeFileSync(resolve(dir, 'drive-map.json'), JSON.stringify(summary, null, 2));
writeFileSync(resolve(dir, 'drive-files.json'), JSON.stringify(cache));
const report = [
  `# Drive map (local) · dry-run · ${new Date().toISOString()}`, '',
  `Source: Google Drive for Desktop (nicolas@xent.co). Metadata only, nothing copied.`,
  `All: ${totalFiles} files · ${gb(totalBytes)} GB. **After filtering noise (code, RAW, GIS, archives, >500 MB): ${keptFiles} files · ${gb(keptBytes)} GB**, plus ${totalGoogle} Google Docs/Sheets/Slides (shortcuts).`,
  `Estimated storage for the filtered set: ~USD ${((keptBytes / 1024 ** 3) * 0.02).toFixed(2)}/month.`, '',
  '| Brand | Folder | All files | All GB | Import files | Import GB | Google docs | Types |', '|---|---|---|---|---|---|---|---|', ...rows, '',
  missing.length ? `## Folders not found\n${missing.map((m) => `- ${m}`).join('\n')}\n` : '',
  big.length ? `## Files over 500 MB\n${big.map((b) => `- ${b.brand}: ${b.path} (${gb(b.size)} GB)`).join('\n')}\n` : '',
  `## Other file types\n${[...otherExt].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([e, n]) => `${e} ${n}`).join(' · ')}`,
].join('\n');
const file = resolve(dir, `drive-map-local-${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
writeFileSync(file, report);
console.log(`\nAll ${totalFiles} files ${gb(totalBytes)} GB · Import ${keptFiles} files ${gb(keptBytes)} GB (+${totalGoogle} Google docs). Report: ${file}`);
