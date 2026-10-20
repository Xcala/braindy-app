// Copies brand files from the locally mounted Drive into gs://braindy-app-files and registers each
// one as an asset in `braindy-app`. Reads the Drive only; never modifies it. Idempotent and resumable:
// a file is uploaded again only if its size or modification time changed.
//
//   npm run drive:import -w server -- --stage essentials [--brand milohas] [--dry-run] [--concurrency 6]
//   stage "essentials" = brand-book folders only; "all" = every importable file. --no-video skips video files
//   (stage 2a: everything but video; videos go brand by brand later).
import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync } from 'node:fs';
import { extname, posix, resolve } from 'node:path';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { EXCLUDED_FILE_NAMES } from './config.js';
import { ESSENTIALS, LOCAL_FOLDERS, absFolder, importable, walkLocal, type LocalFile } from './local.js';
import { contentTypeOf } from './mime.js';

const arg = (name: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : undefined; };
const stage = arg('stage') ?? 'essentials';
const onlyBrand = arg('brand');
const dryRun = process.argv.includes('--dry-run');
const concurrency = Number(arg('concurrency') ?? 6);
const noVideo = process.argv.includes('--no-video');
const VIDEO = /\.(mp4|mov|m4v|avi|mkv|webm|wmv|mpe?g|mxf|r3d|braw|prores)$/i;
if (!['essentials', 'all'].includes(stage)) throw new Error('--stage must be essentials or all');

const BUCKET = 'braindy-app-files';
const app = initializeApp({ credential: applicationDefault(), projectId: 'braindy-brand-guideline' });
const db = getFirestore(app, 'braindy-app');
db.settings({ ignoreUndefinedProperties: true });
const bucket = getStorage(app).bucket(BUCKET);

const dir = resolve(import.meta.dirname, '../../../migration-reports');
mkdirSync(dir, { recursive: true });
const logFile = resolve(dir, `import-${stage}-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);
const log = (s: string) => { console.log(s); appendFileSync(logFile, s + '\n'); };

const assetId = (relPath: string) => `drv-${createHash('sha1').update(relPath).digest('hex').slice(0, 24)}`;
const gb = (n: number) => (n / 1024 ** 3).toFixed(2);

async function pool<T>(items: T[], n: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

const brandIds = onlyBrand
  ? [onlyBrand]
  : (await db.collection('brands').where('status', '==', 'active').select().get()).docs.map((d) => d.id)
      .filter((id) => LOCAL_FOLDERS[id]);
const allAbs = new Set(Object.keys(LOCAL_FOLDERS).map(absFolder));

log(`Import · stage ${stage}${noVideo ? ' · no video' : ''}${dryRun ? ' · DRY RUN' : ''} · ${brandIds.length} brands · log ${logFile}`);
let totalUp = 0, totalSkip = 0, totalErr = 0, totalBytes = 0;

for (const brandId of brandIds.sort()) {
  const abs = absFolder(brandId);
  const skipDirs = new Set([...allAbs].filter((p) => p !== abs && p.startsWith(abs)));
  const files = (await walkLocal(abs, skipDirs))
    .filter((f) => importable(f) && !EXCLUDED_FILE_NAMES.includes(f.name))
    .filter((f) => stage === 'all' || ESSENTIALS.test(f.relPath))
    .filter((f) => !noVideo || !VIDEO.test(f.name));

  const existing = new Map(
    (await db.collection(`brands/${brandId}/assets`).where('source', '==', 'drive').select('size', 'mtimeMs').get())
      .docs.map((d) => [d.id, d.data() as { size: number; mtimeMs: number }]),
  );
  const todo = files.filter((f) => {
    const prev = existing.get(assetId(f.relPath));
    return !prev || prev.size !== f.size || Math.abs(prev.mtimeMs - f.mtimeMs) > 2000;
  });
  const bytes = todo.reduce((n, f) => n + f.size, 0);
  log(`\n${brandId}: ${files.length} files in scope, ${todo.length} to upload (${gb(bytes)} GB), ${files.length - todo.length} already there`);
  totalSkip += files.length - todo.length;
  if (dryRun || !todo.length) { totalBytes += bytes; continue; }

  let done = 0;
  await pool(todo, concurrency, async (f: LocalFile) => {
    const storagePath = `brands/${brandId}/drive/${f.relPath}`;
    const contentType = contentTypeOf(f.name);
    try {
      await bucket.upload(f.absPath, {
        destination: storagePath,
        resumable: f.size > 8 * 1024 ** 2,
        metadata: { contentType, metadata: { brandId, relPath: f.relPath, mtimeMs: String(f.mtimeMs) } },
      });
      await db.doc(`brands/${brandId}/assets/${assetId(f.relPath)}`).set({
        type: 'file', source: 'drive', stage, title: f.name, folder: posix.dirname(f.relPath) === '.' ? '' : posix.dirname(f.relPath),
        relPath: f.relPath, ext: extname(f.name).slice(1).toLowerCase(), storagePath, size: f.size, mtimeMs: f.mtimeMs,
        contentType, status: 'published', importedAt: FieldValue.serverTimestamp(),
      });
      totalUp++; totalBytes += f.size;
    } catch (e) {
      totalErr++;
      log(`  ERROR ${f.relPath}: ${(e as Error).message}`);
    }
    if (++done % 50 === 0 || done === todo.length) log(`  ${brandId}: ${done}/${todo.length}`);
  });
  await writeFolderIndex(brandId);
}

/** context/fileIndex: every folder path with its file count and size, for the file browser. */
async function writeFolderIndex(brandId: string) {
  const snap = await db.collection(`brands/${brandId}/assets`).where('source', '==', 'drive').select('folder', 'size').get();
  const folders: Record<string, { files: number; bytes: number }> = {};
  for (const d of snap.docs) {
    const folder = String(d.get('folder') ?? '');
    const parts = folder ? folder.split('/') : [];
    for (let i = 0; i <= parts.length; i++) {
      const key = parts.slice(0, i).join('/');
      folders[key] ??= { files: 0, bytes: 0 };
      if (i === parts.length) folders[key].files++;
      folders[key].bytes += Number(d.get('size') ?? 0);
    }
  }
  let list = Object.entries(folders).map(([path, v]) => ({ path, ...v })).sort((a, b) => a.path.localeCompare(b.path));
  // A Firestore document holds up to 1 MiB: on very deep trees keep the first levels only.
  for (let depth = 8; JSON.stringify(list).length > 900_000 && depth > 1; depth--) list = list.filter((f) => f.path.split('/').length <= depth);
  await db.doc(`brands/${brandId}/context/fileIndex`).set({ folders: list, updatedAt: FieldValue.serverTimestamp() });
}

log(`\n${dryRun ? 'Would upload' : 'Uploaded'} ${dryRun ? '' : totalUp + ' files, '}${gb(totalBytes)} GB · unchanged ${totalSkip} · errors ${totalErr}`);
