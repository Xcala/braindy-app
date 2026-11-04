// Free-action worker on Nicolas's PC, started at logon by Windows Task Scheduler in --watch mode (scripts/worker.vbs).
// Takes one queued request of a brand on autopilot, downloads its files, and runs a headless Claude Code session in
// the brand's workspace folder for that kind of request. The session does the work, publishes it and delivers a
// version through the Braindy connector. Uses his gcloud login (application default credentials), like the connector.
// Run: node node_modules/tsx/dist/cli.mjs server/src/worker/run.ts [--watch]   (from the main checkout; without
// --watch it takes one job and exits)
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, createWriteStream } from 'node:fs';
import { homedir, hostname } from 'node:os';
import { join } from 'node:path';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { bucket } from '../requests.js';
import { autopilotOf, workspaceFor, type Autopilot } from '../autopilot.js';
import { buildPrompt, type Job } from './prompt.js';

const HOME = process.env.BRAINDY_WORKER_DIR ?? join(homedir(), 'braindy-worker');
const LOCK = join(HOME, 'worker.lock');
const MAX_MS = 2 * 60 * 60 * 1000; // a session gets two hours at most
const now = FieldValue.serverTimestamp;

function takeLock(): boolean {
  mkdirSync(join(HOME, 'logs'), { recursive: true });
  if (existsSync(LOCK)) {
    const since = Number(readFileSync(LOCK, 'utf8').split(' ')[1] ?? 0);
    if (Date.now() - since < MAX_MS + 10 * 60_000) return false; // another run is still working
  }
  writeFileSync(LOCK, `${process.pid} ${Date.now()}`);
  return true;
}

/** Sessions that died without reporting (PC turned off mid-run) go back to the queue once. */
async function recoverStale(brandId: string) {
  const snap = await db.collection(`brands/${brandId}/requests`).where('work.state', '==', 'running').get();
  for (const d of snap.docs) {
    const started = d.get('work.startedAt') as Timestamp | undefined;
    if (started && Date.now() - started.toMillis() > MAX_MS + 10 * 60_000) {
      const retried = d.get('work.retried') === true;
      await d.ref.update({ 'work.state': retried ? 'failed' : 'queued', 'work.retried': true, 'work.summary': 'La sesión se interrumpió.' });
    }
  }
}

async function nextJob(): Promise<{ brandId: string; brandName: string; auto: Autopilot; ref: FirebaseFirestore.DocumentReference } | null> {
  const brands = await db.collection('brands').where('autopilot.on', '==', true).get();
  for (const b of brands.docs) {
    const auto = await autopilotOf(b.id);
    if (!auto) continue;
    await recoverStale(b.id);
    const q = await db.collection(`brands/${b.id}/requests`).where('work.state', '==', 'queued').limit(10).get();
    const first = q.docs.sort((x, y) => (x.get('work.queuedAt')?.toMillis?.() ?? 0) - (y.get('work.queuedAt')?.toMillis?.() ?? 0))[0];
    if (first) return { brandId: b.id, brandName: String(b.get('name') ?? b.id), auto, ref: first.ref };
  }
  return null;
}

async function claim(ref: FirebaseFirestore.DocumentReference) {
  return db.runTransaction(async (tx) => {
    const r = await tx.get(ref);
    if (r.get('work.state') !== 'queued') return false;
    tx.update(ref, { 'work.state': 'running', 'work.startedAt': now(), 'work.host': hostname() });
    return true;
  });
}

/** The client's files (request and comments) land in <workspace>/_braindy/<requestId>/archivos. */
async function download(brandId: string, assetIds: string[], dir: string) {
  const out: string[] = [];
  mkdirSync(dir, { recursive: true });
  for (const id of [...new Set(assetIds)].slice(0, 40)) {
    const a = await db.doc(`brands/${brandId}/assets/${id}`).get();
    const path = a.get('storagePath') as string | undefined;
    if (!path) continue;
    const name = String(a.get('title') ?? id).replace(/[\\/:*?"<>|]/g, '_');
    const target = join(dir, name);
    await bucket().file(path).download({ destination: target }).then(() => out.push(target)).catch(() => null);
  }
  return out;
}

function runClaude(cwd: string, prompt: string, logFile: string): Promise<{ code: number | null; tail: string }> {
  return new Promise((resolve) => {
    const log = createWriteStream(logFile);
    let tail = '';
    const p = spawn('claude', ['-p', '--permission-mode', 'bypassPermissions', '--output-format', 'text'], {
      cwd, shell: true, env: { ...process.env, BRAINDY_UID: 'autopilot' },
    });
    const keep = (d: Buffer) => { log.write(d); tail = (tail + d.toString()).slice(-4000); };
    p.stdout.on('data', keep); p.stderr.on('data', keep);
    const timer = setTimeout(() => p.kill(), MAX_MS);
    p.on('close', (code) => { clearTimeout(timer); log.end(); resolve({ code, tail }); });
    p.stdin.end(prompt);
  });
}

type Outcome = 'none' | 'busy' | 'ran' | 'login';

async function runNext(): Promise<Outcome> {
  if (!takeLock()) { console.log('worker: another run is active'); return 'busy'; }
  try {
    const job = await nextJob();
    if (!job) { console.log('worker: nothing queued'); return 'none'; }
    if (!(await claim(job.ref))) { console.log('worker: taken by another run'); return 'ran'; }
    const r = await job.ref.get();
    const requestId = job.ref.id;
    const category = String(r.get('category') ?? 'other');
    const cwd = workspaceFor(job.auto, category);
    if (!cwd || !existsSync(cwd)) {
      await job.ref.update({ 'work.state': 'failed', 'work.finishedAt': now(), 'work.summary': `No encuentro la carpeta de trabajo (${cwd ?? 'sin carpeta'}).` });
      return 'ran';
    }
    const comments = await job.ref.collection('comments').orderBy('createdAt').limitToLast(30).get();
    const versions = await job.ref.collection('versions').orderBy('n').get();
    const assetIds = [
      ...((r.get('cards.product.files') as Array<{ assetId: string }> | undefined) ?? []).map((f) => f.assetId),
      ...comments.docs.flatMap((c) => ((c.get('files') as Array<{ assetId?: string }> | undefined) ?? []).map((f) => f.assetId ?? '')),
    ].filter(Boolean);
    const folder = join(cwd, '_braindy', requestId);
    const files = await download(job.brandId, assetIds, join(folder, 'archivos'));
    const jobData: Job = {
      brandId: job.brandId, brandName: job.brandName, requestId, category, publish: job.auto.publish, folder, files,
      cwd, workspaces: job.auto.workspaces,
      title: String(r.get('title') ?? ''), text: String(r.get('cards.product.text') ?? ''), dueDate: r.get('dueDate') ?? null,
      reason: String(r.get('work.reason') ?? 'new'),
      comments: comments.docs.map((c) => ({ kind: String(c.get('kind') ?? 'comment'), text: String(c.get('text') ?? '') })).filter((c) => c.text),
      versions: versions.docs.map((v) => ({ n: Number(v.get('n')), state: String(v.get('approval.state') ?? ''), note: String(v.get('approval.note') ?? '') })),
    };
    const logFile = join(HOME, 'logs', `${new Date().toISOString().replace(/[:.]/g, '-')}-${job.brandId}-${requestId}.log`);
    console.log(`worker: ${job.brandId}/${requestId} in ${cwd}`);
    const { code, tail } = await runClaude(cwd, buildPrompt(jobData), logFile);
    // Claude Code logged out on this PC: nothing was done, so the request waits for the next run.
    if (/Failed to authenticate|Please run \/login|Invalid API key/i.test(tail)) {
      await job.ref.update({ 'work.state': 'queued', 'work.summary': 'Claude Code no tiene sesión iniciada en el PC (claude → /login).', 'work.log': logFile });
      console.log('worker: Claude Code needs /login');
      return 'login';
    }
    const result = /RESULTADO:\s*(listo|fallo)([^\n]*)/i.exec(tail);
    const ok = code === 0 && result?.[1]?.toLowerCase() === 'listo';
    await job.ref.update({
      'work.state': ok ? 'done' : 'failed', 'work.finishedAt': now(), 'work.log': logFile,
      'work.summary': (result?.[2] ?? tail.slice(-600)).replace(/^[\s:—-]+/, '').slice(0, 1000),
    });
    return 'ran';
  } finally {
    rmSync(LOCK, { force: true });
  }
}

/** --watch: stays open (started at logon) and listens for queued requests of autopilot brands, so a session starts
 *  as soon as a client's WhatsApp message queues work, with no polling. Listener errors exit; Task Scheduler restarts. */
function watch() {
  let busy = false, again = false, pausedUntil = 0;
  const drain = async () => {
    if (Date.now() < pausedUntil) return;
    if (busy) { again = true; return; }
    busy = true;
    try {
      do {
        again = false;
        let r: Outcome;
        while ((r = await runNext()) === 'ran');
        if (r === 'login') { pausedUntil = Date.now() + 10 * 60_000; setTimeout(() => void drain(), 10 * 60_000 + 1000); break; }
      } while (again);
    } catch (e) { console.error('worker failed', e); } finally { busy = false; }
  };
  const fail = (e: unknown) => { console.error('worker: listener failed', e); process.exit(1); };
  const subs = new Map<string, () => void>();
  db.collection('brands').where('autopilot.on', '==', true).onSnapshot((s) => {
    const ids = new Set(s.docs.map((d) => d.id));
    for (const [id, off] of subs) if (!ids.has(id)) { off(); subs.delete(id); }
    for (const id of ids) if (!subs.has(id)) {
      subs.set(id, db.collection(`brands/${id}/requests`).where('work.state', '==', 'queued')
        .onSnapshot((q) => { if (!q.empty) void drain(); }, fail));
    }
  }, fail);
  console.log(`worker: listening (${new Date().toISOString()})`);
}

if (process.argv.includes('--watch')) watch();
else runNext().then(() => process.exit(0)).catch((e) => { console.error('worker failed', e); rmSync(LOCK, { force: true }); process.exit(1); });
