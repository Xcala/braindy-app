// Reorganizes a brand's Files: moves assets between folders by path prefix (only the Firestore record; bucket objects
// keep their path, as a move in the app does), rebuilds context/fileIndex and sets which top folders the client sees.
// Idempotent; --dry-run prints the plan without writing. Usage: tsx scripts/reorganize-folders.ts <plan.json> [--dry-run]
// plan.json: { "brandId": "...", "moves": [["old/prefix", "New/prefix"], ...], "hidden": ["Top folder hidden from client"] }
import { readFileSync } from 'node:fs';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../src/firebase.js';
import { forgetSearch } from '../src/search.js';

const dry = process.argv.includes('--dry-run');
const plan = JSON.parse(readFileSync(process.argv[2], 'utf8')) as { brandId: string; moves: Array<[string, string]>; hidden?: string[] };
const { brandId } = plan;
// Longest prefix first, so "a/b" wins over "a". "" (the root) matches only files right at the root.
const moves = [...plan.moves].sort((a, b) => b[0].length - a[0].length);
const target = (folder: string) => {
  for (const [from, to] of moves) {
    if (from === '' ? folder === '' : folder === from || folder.startsWith(`${from}/`)) return to + folder.slice(from.length);
  }
  return folder;
};

const assets = await db.collection(`brands/${brandId}/assets`).get();
const changes = assets.docs
  .filter((d) => d.get('source') !== 'legacy' && String(d.get('folder') ?? '').split('/')[0] !== 'Uploads')
  .map((d) => ({ ref: d.ref, from: String(d.get('folder') ?? ''), to: target(String(d.get('folder') ?? '')) }))
  .filter((c) => c.from !== c.to);
const summary = new Map<string, number>();
for (const c of changes) summary.set(`${c.from || '(raíz)'} → ${c.to}`, (summary.get(`${c.from || '(raíz)'} → ${c.to}`) ?? 0) + 1);
for (const [k, n] of [...summary].sort()) console.log(`${String(n).padStart(4)}  ${k}`);

// Index after the moves: every folder with its own file count and the bytes below it (Uploads stays out, as in the app).
const after = assets.docs.map((d) => ({ folder: changes.find((c) => c.ref.id === d.id)?.to ?? String(d.get('folder') ?? ''), size: Number(d.get('size') ?? 0), source: d.get('source') }))
  .filter((a) => a.source !== 'legacy' && a.folder.split('/')[0] !== 'Uploads');
const rows: Record<string, { files: number; bytes: number }> = {};
for (const a of after) {
  const parts = a.folder ? a.folder.split('/') : [];
  for (let i = 0; i <= parts.length; i++) {
    const key = parts.slice(0, i).join('/');
    rows[key] ??= { files: 0, bytes: 0 };
    if (i === parts.length) rows[key].files++;
    rows[key].bytes += a.size;
  }
}
const folders = Object.entries(rows).map(([path, v]) => ({ path, ...v })).sort((a, b) => a.path.localeCompare(b.path));
const tops = [...new Set(folders.map((f) => f.path.split('/')[0]).filter(Boolean))];
const shown = tops.filter((p) => !(plan.hidden ?? []).includes(p));
console.log(`\nCarpetas principales: ${tops.join(' · ')}\nEl cliente ve: ${shown.join(' · ')}\nOcultas: ${(plan.hidden ?? []).join(' · ') || '(ninguna)'}`);
console.log(`${dry ? 'DRY RUN · ' : ''}archivos a mover: ${changes.length} de ${assets.size}`);
if (dry) process.exit(0);

for (let i = 0; i < changes.length; i += 400) {
  const batch = db.batch();
  for (const c of changes.slice(i, i + 400)) batch.update(c.ref, { folder: c.to, editedAt: FieldValue.serverTimestamp() });
  await batch.commit();
}
await db.doc(`brands/${brandId}/context/fileIndex`).set({ folders, updatedAt: FieldValue.serverTimestamp() });
// Files at the root ('') stay visible only if they were before; the approved folder is always visible.
await db.doc(`brands/${brandId}`).update({ fileAccess: { mode: 'selected', folders: [...new Set([...shown, 'Entregas aprobadas'])] } });
forgetSearch(brandId);
console.log('Listo.');
