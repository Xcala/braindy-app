// The Braindy App tutorial videos in Learn («Cómo usar Braindy»): one lesson per video of the catalog
// (video/tutoriales/catalogo.mjs). Uploads out/<lang>/<id>.mp4 and <id>_9x16.mp4 to Storage (learn/<lang>/…, with a
// download token) and writes the published lesson with its video per language. Idempotent: a file already uploaded
// keeps its token unless --replace (a re-recorded video gets a new token, so browsers do not keep the old one).
//   npx tsx scripts/learn/tutorial-videos.ts --dry-run [ids]
//   npx tsx scripts/learn/tutorial-videos.ts [--replace] [ids]
import { randomUUID } from 'node:crypto';
import { existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
// @ts-expect-error plain JS catalog shared with the recording scripts
import { TODOS } from '../../../video/tutoriales/catalogo.mjs';

type L2 = { es: string; en: string };
type Video = { id: string; kind: 'general' | 'section' | 'feature'; paths: string[]; titulo: L2; resumen: L2; escenas: ({ es?: string; en?: string; de?: string })[] };

const BUCKET = 'braindy-brand-guideline.firebasestorage.app';
const OUT = resolve(import.meta.dirname, '../../../video/tutoriales/out');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run'), replace = args.includes('--replace');
const only = args.find((a) => !a.startsWith('--'))?.split(',');
const app = initializeApp({ credential: applicationDefault(), projectId: 'braindy-brand-guideline', storageBucket: BUCKET });
const db = getFirestore(app, 'braindy-app');
const bucket = getStorage(app).bucket();
const report = { uploaded: 0, kept: 0, lessons: 0, missing: [] as string[] };

const seconds = (f: string) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());

async function upload(lang: 'es' | 'en', name: string) {
  const local = join(OUT, lang, name), dest = `learn/${lang}/${name}`;
  if (!existsSync(local)) { report.missing.push(`${lang}/${name}`); return undefined; }
  const file = bucket.file(dest);
  const [there] = await file.exists();
  let token = there && !replace ? String((await file.getMetadata())[0].metadata?.firebaseStorageDownloadTokens ?? '').split(',')[0] : '';
  if (!token) {
    token = randomUUID();
    if (!dryRun) await bucket.upload(local, { destination: dest, contentType: 'video/mp4', metadata: { cacheControl: 'public, max-age=86400', metadata: { firebaseStorageDownloadTokens: token } } });
    report.uploaded++;
  } else report.kept++;
  console.log(`  ${dest} (${(statSync(local).size / 1e6).toFixed(1)} MB): ${token && there && !replace ? 'kept' : dryRun ? 'would upload' : 'uploaded'}`);
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(dest)}?alt=media&token=${token}`;
}

/** The lesson text: the voice lines, one scannable bullet each. */
const body = (v: Video, lang: 'es' | 'en') => v.escenas.filter((e) => e[lang]).map((e) => `- ${e[lang]}`).join('\n');

let order = 0;
for (const v of (TODOS as Video[])) {
  order++;
  if (only && !only.includes(v.id)) continue;
  console.log(v.id);
  const videos: Record<string, { wide: string; tall?: string }> = {};
  let secs = 0;
  for (const lang of ['es', 'en'] as const) {
    const wide = await upload(lang, `${v.id}.mp4`), tall = await upload(lang, `${v.id}_9x16.mp4`);
    if (wide) { videos[lang] = tall ? { wide, tall } : { wide }; secs ||= seconds(join(OUT, lang, `${v.id}.mp4`)); }
  }
  if (!videos.es && !videos.en) continue;
  // the overview keeps the lesson that already plays the tour, so links to it still work
  const id = v.kind === 'general' ? 'como-usar-braindy' : `tut-${v.id}`;
  const lesson = {
    area: 'process', order: v.kind === 'general' ? 0 : v.kind === 'section' ? order : 100 + order, status: 'published',
    minutes: Math.max(1, Math.round(secs / 60)), categories: [], stages: ['onboarding'], kind: v.kind, paths: v.paths, videos,
    videoUrl: (videos.es ?? videos.en)!.wide, videoVertical: (videos.es ?? videos.en)!.tall ?? null,
    title: v.titulo, summary: v.resumen, body: { es: body(v, 'es'), en: body(v, 'en') },
  };
  if (!dryRun) await db.doc(`lessons/${id}`).set({ ...lesson, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  report.lessons++;
  console.log(`  lesson ${id}: ${dryRun ? 'would be written' : 'written'} (${v.kind}, ${Object.keys(videos).join('+')}, ${secs.toFixed(0)} s)`);
}
console.log(`\n${dryRun ? 'DRY RUN · ' : ''}uploaded ${report.uploaded}, kept ${report.kept}, lessons ${report.lessons}, missing ${report.missing.length}${report.missing.length ? ': ' + report.missing.join(', ') : ''}`);
