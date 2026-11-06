// The Braindy App tutorial videos in Learn: uploads the MP4s to Storage (learn/…, with a download token) and
// writes the published lesson that plays them. Idempotent: a file already uploaded keeps its token. Prints a report.
//   npx tsx scripts/learn/tutorial-videos.ts <folder with the MP4s> --dry-run
//   npx tsx scripts/learn/tutorial-videos.ts <folder with the MP4s>
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const BUCKET = 'braindy-brand-guideline.firebasestorage.app';
const dir = process.argv[2];
const dryRun = process.argv.includes('--dry-run');
const app = initializeApp({ credential: applicationDefault(), projectId: 'braindy-brand-guideline', storageBucket: BUCKET });
const db = getFirestore(app, 'braindy-app');
const bucket = getStorage(app).bucket();

const FILES = { wide: 'Braindy_Tour_Clientes_v11.mp4', tall: 'Braindy_Tour_Clientes_v11_9x16.mp4' } as const;

async function upload(name: string) {
  const local = join(dir, name);
  if (!existsSync(local)) throw new Error(`Missing ${local}`);
  const file = bucket.file(`learn/${name}`);
  const [there] = await file.exists();
  let token = there ? String((await file.getMetadata())[0].metadata?.firebaseStorageDownloadTokens ?? '').split(',')[0] : '';
  if (!token) {
    token = randomUUID();
    if (!dryRun) await bucket.upload(local, { destination: `learn/${name}`, contentType: 'video/mp4', metadata: { cacheControl: 'public, max-age=86400', metadata: { firebaseStorageDownloadTokens: token } } });
  }
  console.log(`${name}: ${there ? 'already there (kept)' : dryRun ? 'would be uploaded' : 'uploaded'}`);
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(`learn/${name}`)}?alt=media&token=${token}`;
}

const videoUrl = await upload(FILES.wide);
const videoVertical = await upload(FILES.tall);
const lesson = {
  area: 'process', order: 0, status: 'published', minutes: 2, categories: [], stages: ['onboarding'], videoUrl, videoVertical,
  title: { es: 'Cómo usar Braindy', en: 'How to use Braindy' },
  summary: {
    es: 'Un recorrido de minuto y medio por la app: tu marca, tus pedidos, las entregas y cómo apruebas.',
    en: 'A minute-and-a-half tour of the app: your brand, your requests, the deliveries and how you approve.',
  },
  body: {
    es: '## Tu marca en un solo lugar\nLogo, colores, tipografías, voz y estrategia, siempre a la mano y al día.\n\n## Pide lo que necesites\nTocas qué es, dónde va y para cuándo, y NicoMarca lo vuelve un plan.\n\n## Revisa y aprueba\nCada entrega llega con su versión. Marca el punto exacto si algo se ajusta, o apruébala.\n\n## Todo queda guardado\nLo aprobado queda en Archivos, listo para descargar y compartir.',
    en: '## Your brand in one place\nLogo, colors, typefaces, voice and strategy, always at hand and up to date.\n\n## Ask for what you need\nTap what it is, where it goes and when, and NickMark turns it into a plan.\n\n## Review and approve\nEvery delivery comes with its version. Mark the exact spot if something needs a change, or approve it.\n\n## Everything stays saved\nWhat you approve stays in Files, ready to download and share.',
  },
};
if (!dryRun) await db.doc('lessons/como-usar-braindy').set({ ...lesson, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
console.log(`lesson como-usar-braindy: ${dryRun ? 'would be written' : 'written'} (published, Process, first)`);
