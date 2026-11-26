// «Update» on the calendar (2026-11-24): a person asks in the app (brands/{id}/syncRequests/social, state queued); this
// worker, already listening on Nicolas's PC, runs a short headless Claude Code session that may only use three tools:
// read the brand settings and the posts in Metricool, and send them through the Braindy connector
// (braindy_social_calendar_sync). Every other tool is refused (dontAsk). Never changes anything in Metricool.
import { spawn } from 'node:child_process';
import { createWriteStream, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase.js';

const HOME = join(process.env.BRAINDY_WORKER_DIR ?? join(homedir(), 'braindy-worker'), 'social');
const MAX_MS = 20 * 60 * 1000;
const METRICOOL = 'mcp__claude_ai_Metricool_Social_Media_Management';
const TOOLS = [`${METRICOOL}__getBrandSettings`, `${METRICOOL}__getScheduledPosts`, 'mcp__claude_ai_Braindy_App__braindy_social_calendar_sync'];

function prompt(brandId: string, metricoolBrand: string) {
  return `Sincroniza el calendario de redes de la marca "${brandId}" de Braindy App con Metricool (marca de Metricool ${metricoolBrand}).
Solo lees Metricool: nunca crees, cambies, programes ni borres nada en Metricool.

1. Llama getBrandSettings de Metricool y toma el timezone de la marca ${metricoolBrand}.
2. Fechas: desde hace 14 días hasta 60 días adelante, según la fecha de hoy en ese timezone. Recórrelas una semana a la vez.
3. Por cada semana:
   a. getScheduledPosts con brandId ${metricoolBrand}, fromDate = primer día 00:00:00 y toDate = último día 23:59:59, ambos con el UTC offset de la marca, y timezone de la marca. Si el resultado es muy grande, parte la semana en dos.
   b. braindy_social_calendar_sync (conector Braindy App) con brandId "${brandId}", metricoolBrand "${metricoolBrand}", from y to exactamente las fechas leídas (ISO 8601 con offset), y posts mapeados así:
      - id: el id del post, como texto; date: publicationDate.dateTime con el offset de la marca para esa fecha (ISO 8601); text: text;
      - title: youtubeData.title o facebookData.title si existe; type: instagramData.type, si no facebookData.type, si no youtubeData.type, si no "POST";
      - draft: draft; networks: cada provider como { network, status, url: publicUrl }; media: las URLs de media; thumb: videoThumbnailUrl si existe.
   c. Si la semana no tiene posts, igual llama braindy_social_calendar_sync con posts vacío, para que desaparezcan los borrados.
4. Termina con una sola línea: "RESULTADO: listo — N publicaciones" o "RESULTADO: fallo — motivo corto en español".`;
}

function runClaude(text: string, logFile: string): Promise<{ code: number | null; tail: string }> {
  return new Promise((resolve) => {
    const log = createWriteStream(logFile);
    let tail = '';
    const args = ['-p', '--permission-mode', 'dontAsk', '--allowedTools', TOOLS.join(','), '--output-format', 'text'];
    const p = spawn('claude', args, { cwd: HOME, shell: true });
    const keep = (d: Buffer) => { log.write(d); tail = (tail + d.toString()).slice(-3000); };
    p.stdout.on('data', keep); p.stderr.on('data', keep);
    const timer = setTimeout(() => p.kill(), MAX_MS);
    p.on('close', (code) => { clearTimeout(timer); log.end(); resolve({ code, tail }); });
    p.stdin.end(text);
  });
}

async function runOne(ref: FirebaseFirestore.DocumentReference, brandId: string) {
  const claimed = await db.runTransaction(async (tx) => {
    const d = await tx.get(ref);
    if (d.get('state') !== 'queued') return false;
    tx.update(ref, { state: 'running', startedAt: FieldValue.serverTimestamp() });
    return true;
  });
  if (!claimed) return;
  const metricoolBrand = String((await db.doc(`brands/${brandId}`).get()).get('metricoolBrand') ?? '');
  if (!/^\d+$/.test(metricoolBrand)) {
    await ref.update({ state: 'failed', doneAt: FieldValue.serverTimestamp(), summary: 'La marca no está conectada a Metricool.' });
    return;
  }
  const logFile = join(HOME, `${new Date().toISOString().replace(/[:.]/g, '-')}-${brandId}.log`);
  console.log(`social: ${brandId} (${metricoolBrand})`);
  const { code, tail } = await runClaude(prompt(brandId, metricoolBrand), logFile);
  const result = /RESULTADO:\s*(listo|fallo)([^\n]*)/i.exec(tail);
  const ok = code === 0 && result?.[1]?.toLowerCase() === 'listo';
  await ref.update({
    state: ok ? 'done' : 'failed', doneAt: FieldValue.serverTimestamp(), log: logFile,
    summary: (result?.[2] ?? tail.slice(-300)).replace(/^[\s:—-]+/, '').slice(0, 500),
  });
}

/** Listens for «Update» requests of every brand and runs them one at a time. Requests stuck in «running» (PC turned off
 *  mid-run) are marked failed, so the button works again. */
export function watchSocialSync(fail: (e: unknown) => void) {
  mkdirSync(HOME, { recursive: true });
  let busy = false, again = false;
  const drain = async () => {
    if (busy) { again = true; return; }
    busy = true;
    try {
      do {
        again = false;
        const all = await db.collectionGroup('syncRequests').get();
        for (const d of all.docs) {
          const brandId = d.ref.parent.parent?.id;
          if (d.id !== 'social' || !brandId) continue;
          const started = d.get('startedAt') as Timestamp | undefined;
          if (d.get('state') === 'running' && started && Date.now() - started.toMillis() > MAX_MS + 5 * 60_000) {
            await d.ref.update({ state: 'failed', doneAt: FieldValue.serverTimestamp(), summary: 'Se interrumpió.' });
          }
          if (d.get('state') === 'queued') await runOne(d.ref, brandId).catch((e) => console.error('social failed', brandId, e));
        }
      } while (again);
    } finally { busy = false; }
  };
  db.collectionGroup('syncRequests').onSnapshot((s) => {
    if (s.docChanges().some((c) => c.doc.get('state') === 'queued')) void drain();
  }, fail);
  console.log('social: listening');
}
