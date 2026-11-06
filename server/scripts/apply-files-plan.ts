// Reorganizes a brand's Files from a plan: moves by folder prefix, then per-file folder and name. Only Firestore records
// change (bucket objects keep their path, as a move in the app does); rebuilds context/fileIndex and sets which top
// folders the client sees. Before writing it saves every touched record's old folder and name to a backup that is
// itself a plan, so applying the backup undoes the change. Idempotent; --dry-run prints the plan without writing.
// Usage: tsx scripts/apply-files-plan.ts <plan.json> [--dry-run] [--backup-dir <dir>]
// plan.json: { brandId, moves?: [[from, to]], files?: { [assetId]: { folder?, title? } }, hidden?: [topFolder], keepAccess?: true }
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../src/firebase.js';
import { forgetSearch } from '../src/search.js';

type Plan = { brandId: string; moves?: Array<[string, string]>; files?: Record<string, { folder?: string; title?: string }>; hidden?: string[]; keepAccess?: boolean };
const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const backupDir = args.includes('--backup-dir') ? args[args.indexOf('--backup-dir') + 1]! : 'backups';
const plan = JSON.parse(readFileSync(args[0]!, 'utf8')) as Plan;
const { brandId } = plan;
const moves = [...(plan.moves ?? [])].sort((a, b) => b[0].length - a[0].length);
const moved = (folder: string) => {
  for (const [from, to] of moves) {
    if (from === '' ? folder === '' : folder === from || folder.startsWith(`${from}/`)) return to + folder.slice(from.length);
  }
  return folder;
};
const clean = (s: string) => s.replace(/[\\\r\n]/g, '_').replace(/\/+/g, '/').replace(/^\/|\/$/g, '').trim();

const assets = await db.collection(`brands/${brandId}/assets`).get();
const inFiles = (d: FirebaseFirestore.QueryDocumentSnapshot) => d.get('source') !== 'legacy' && String(d.get('folder') ?? '').split('/')[0] !== 'Uploads';
const changes = assets.docs.filter(inFiles).map((d) => {
  const from = { folder: String(d.get('folder') ?? ''), title: String(d.get('title') ?? '') };
  const own = plan.files?.[d.id];
  const to = { folder: clean(own?.folder ?? moved(from.folder)), title: (own?.title ?? from.title).replace(/[\\/\r\n]/g, '_').trim().slice(0, 200) || from.title };
  return { ref: d.ref, id: d.id, from, to, size: Number(d.get('size') ?? 0) };
});
// Two files with the same name in one folder: the second gets " 2", the third " 3"…
const taken = new Set<string>();
for (const c of [...changes].sort((a, b) => Number(a.from.title !== a.to.title) - Number(b.from.title !== b.to.title))) {
  let t = c.to.title;
  const dot = t.lastIndexOf('.');
  const [base, ext] = dot > 0 ? [t.slice(0, dot), t.slice(dot)] : [t, ''];
  for (let n = 2; taken.has(`${c.to.folder}/${t.toLowerCase()}`); n++) t = `${base} ${n}${ext}`;
  c.to.title = t;
  taken.add(`${c.to.folder}/${t.toLowerCase()}`);
}
const todo = changes.filter((c) => c.from.folder !== c.to.folder || c.from.title !== c.to.title);

const summary = new Map<string, number>();
for (const c of todo) if (c.from.folder !== c.to.folder) summary.set(`${c.from.folder || '(raíz)'} → ${c.to.folder || '(raíz)'}`, (summary.get(`${c.from.folder || '(raíz)'} → ${c.to.folder || '(raíz)'}`) ?? 0) + 1);
for (const [k, n] of [...summary].sort()) console.log(`${String(n).padStart(5)}  ${k}`);
const renamed = todo.filter((c) => c.from.title !== c.to.title);
for (const c of renamed.slice(0, args.includes('--all-names') ? 1e9 : 40)) console.log(`   «${c.from.title}» → «${c.to.title}»`);
if (renamed.length > 40 && !args.includes('--all-names')) console.log(`   … y ${renamed.length - 40} nombres más`);

// Index after the changes: every folder with its own file count and the bytes below it.
const rows: Record<string, { files: number; bytes: number }> = {};
for (const c of changes) {
  const parts = c.to.folder ? c.to.folder.split('/') : [];
  for (let i = 0; i <= parts.length; i++) {
    const key = parts.slice(0, i).join('/');
    rows[key] ??= { files: 0, bytes: 0 };
    if (i === parts.length) rows[key].files++;
    rows[key].bytes += c.size;
  }
}
const folders = Object.entries(rows).map(([path, v]) => ({ path, ...v })).sort((a, b) => a.path.localeCompare(b.path));
const tops = [...new Set(folders.map((f) => f.path.split('/')[0]).filter(Boolean))];
const shown = tops.filter((p) => !(plan.hidden ?? []).includes(p));
const atRoot = rows['']?.files ?? 0;
console.log(`\nCarpetas principales (${tops.length}): ${tops.map((t) => `${t} (${folders.filter((f) => f.path === t || f.path.startsWith(`${t}/`)).reduce((n, f) => n + f.files, 0)})`).join(' · ')}`);
console.log(`Sueltos en la raíz: ${atRoot} · Subcarpetas: ${folders.filter((f) => f.path.includes('/')).length}`);
console.log(`El cliente ve: ${shown.join(' · ')}${atRoot ? ' + raíz' : ''}\nOcultas: ${(plan.hidden ?? []).join(' · ') || '(ninguna)'}`);
console.log(`${dry ? 'DRY RUN · ' : ''}${todo.length} de ${assets.size} cambian (${todo.length - renamed.length} solo se mueven, ${renamed.length} con nombre nuevo)`);
if (dry) process.exit(0);

mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const prevAccess = (await db.doc(`brands/${brandId}`).get()).get('fileAccess') ?? null;
const backup = { brandId, keepAccess: true, prevAccess, files: Object.fromEntries(todo.map((c) => [c.id, c.from])) };
writeFileSync(`${backupDir}/${brandId}-${stamp}.json`, JSON.stringify(backup));
console.log(`Copia: ${backupDir}/${brandId}-${stamp}.json`);

for (let i = 0; i < todo.length; i += 400) {
  const batch = db.batch();
  for (const c of todo.slice(i, i + 400)) batch.update(c.ref, { folder: c.to.folder, title: c.to.title, editedAt: FieldValue.serverTimestamp() });
  await batch.commit();
}
await db.doc(`brands/${brandId}/context/fileIndex`).set({ folders, updatedAt: FieldValue.serverTimestamp() });
if (!plan.keepAccess) {
  // Root files stay visible when the plan leaves some there; the approved folder is always visible.
  const visible = [...new Set([...shown, ...(atRoot ? [''] : []), 'Entregas aprobadas'])];
  await db.doc(`brands/${brandId}`).update({ fileAccess: { mode: 'selected', folders: visible } });
} else if ((plan as Plan & { prevAccess?: unknown }).prevAccess) {
  await db.doc(`brands/${brandId}`).update({ fileAccess: (plan as Plan & { prevAccess?: unknown }).prevAccess });
}
forgetSearch(brandId);
console.log('Listo.');
