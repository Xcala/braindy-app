// Firestore/Storage operations of the Braindy connector. Admin credentials (gcloud application-default login),
// database braindy-app only. Never reads or writes accesses (client credentials).
import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { randomUUID } from 'node:crypto';
import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { contentTypeOf as lookup } from '../scripts/drive/mime.js';

const app = getApps()[0] ?? initializeApp({ projectId: 'braindy-brand-guideline' });
export const db = getFirestore(app, 'braindy-app');
const bucket = getStorage(app).bucket(process.env.FILES_BUCKET ?? 'braindy-app-files');
const MAX_FILE = 500 * 1024 ** 2;
const MAX_FILES = 200;

export type SiteChangeStatus = 'delivered' | 'in_progress' | 'decision' | 'client' | 'discarded';
export interface SiteChangeInput { key: string; group?: string; title: string; request?: string; source?: string; delivered?: string; status: SiteChangeStatus; link?: string }

export async function findBrands(query: string) {
  const q = query.trim().toLowerCase();
  const snap = await db.collection('brands').get();
  return snap.docs
    .map((d) => ({ id: d.id, name: String(d.get('name') ?? d.id), kind: d.get('kind') ?? 'brand', status: d.get('status') ?? 'active', groupId: d.get('groupId') ?? null }))
    .filter((b) => !q || b.id.includes(q) || b.name.toLowerCase().includes(q))
    .sort((a, b) => (a.status === b.status ? a.name.localeCompare(b.name) : a.status === 'active' ? -1 : 1))
    .slice(0, 25);
}

export async function requireBrand(brandId: string) {
  const b = await db.doc(`brands/${brandId}`).get();
  if (!b.exists) throw new Error(`No existe la marca "${brandId}" en Braindy App. Usa braindy_find_brand para ver el id.`);
  return String(b.get('name') ?? brandId);
}

const docId = (key: string) => key.trim().replace(/[\/\s]+/g, '-').slice(0, 120);
const FIELDS = ['group', 'title', 'request', 'source', 'delivered', 'status', 'link'] as const;

/** Upserts the triage by key. Unchanged points are not rewritten; nothing is deleted unless asked. */
export async function syncSiteChanges(brandId: string, items: SiteChangeInput[], opts: { siteUrl?: string; round?: string; removeMissing?: boolean }) {
  const col = db.collection(`brands/${brandId}/siteChanges`);
  const existing = new Map((await col.get()).docs.map((d) => [d.id, d.data()]));
  let created = 0, updated = 0, unchanged = 0, removed = 0;
  const seen = new Set<string>();
  const writer = db.bulkWriter();
  items.forEach((it, order) => {
    const id = docId(it.key);
    if (!id || seen.has(id)) return;
    seen.add(id);
    const data: Record<string, unknown> = { key: it.key, order };
    for (const f of FIELDS) data[f] = (it[f] ?? '').toString().slice(0, f === 'title' ? 300 : 4000);
    if (opts.siteUrl) data.siteUrl = opts.siteUrl;
    if (opts.round) data.round = opts.round;
    const prev = existing.get(id);
    if (!prev) { writer.set(col.doc(id), { ...data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), syncedFrom: 'connector' }); created++; return; }
    const changed = Object.keys(data).some((k) => String(prev[k] ?? '') !== String(data[k] ?? ''));
    if (!changed) { unchanged++; return; }
    writer.update(col.doc(id), { ...data, updatedAt: FieldValue.serverTimestamp(), ...(data.status === 'delivered' && prev.status !== 'delivered' ? { doneAt: FieldValue.serverTimestamp() } : {}) });
    updated++;
  });
  if (opts.removeMissing) for (const id of existing.keys()) if (!seen.has(id)) { writer.delete(col.doc(id)); removed++; }
  await writer.close();
  await db.doc(`brands/${brandId}`).set({ siteChangesAt: FieldValue.serverTimestamp() }, { merge: true });
  return { created, updated, unchanged, removed, total: seen.size };
}

export async function listSiteChanges(brandId: string) {
  const snap = await db.collection(`brands/${brandId}/siteChanges`).orderBy('order').get();
  return snap.docs.map((d) => { const x = d.data(); return { key: x.key, group: x.group, title: x.title, status: x.status, delivered: x.delivered }; });
}

export async function logSession(brandId: string, text: string, opts: { project?: string; requestId?: string }) {
  const ref = await db.collection(`brands/${brandId}/activity`).add({
    text: text.slice(0, 20000), project: opts.project ?? null, requestId: opts.requestId ?? null,
    source: 'connector', by: 'NicoMarca', createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

async function filesUnder(path: string): Promise<string[]> {
  const s = await stat(path);
  if (s.isFile()) return [path];
  const out: string[] = [];
  for (const e of await readdir(path, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || /^desktop\.ini$/i.test(e.name)) continue;
    out.push(...(await filesUnder(join(path, e.name))));
    if (out.length > MAX_FILES) throw new Error(`La carpeta tiene más de ${MAX_FILES} archivos. Sube una carpeta más pequeña.`);
  }
  return out;
}

/** Uploads a file or a folder to the brand's Uploads (My files), like an upload from the app. */
export async function uploadPath(brandId: string, path: string, folder = 'Uploads') {
  const files = await filesUnder(path);
  const root = (await stat(path)).isFile() ? null : path;
  const done: Array<{ name: string; assetId: string; size: number }> = [];
  const skipped: string[] = [];
  for (const f of files) {
    const { size } = await stat(f);
    if (size > MAX_FILE) { skipped.push(`${basename(f)} (más de 500 MB)`); continue; }
    const sub = root ? relative(root, f).split(/[\\/]/).slice(0, -1).join('/') : '';
    const name = basename(f).replace(/[\r\n]/g, '_').slice(0, 200);
    const id = `upl-${randomUUID()}`;
    const storagePath = `brands/${brandId}/uploads/${id}/${name}`;
    const contentType = lookup(name);
    await new Promise<void>((res, rej) => createReadStream(f)
      .pipe(bucket.file(storagePath).createWriteStream({ resumable: size > 8 * 1024 ** 2, contentType }))
      .on('finish', () => res()).on('error', rej));
    await db.doc(`brands/${brandId}/assets/${id}`).set({
      type: 'file', source: 'upload', title: name, folder: [folder, root ? basename(root) : '', sub].filter(Boolean).join('/'),
      storagePath, size, contentType, status: 'published', uploadedBy: 'connector', createdAt: FieldValue.serverTimestamp(), uploadedAt: FieldValue.serverTimestamp(),
    });
    done.push({ name, assetId: id, size });
  }
  return { done, skipped };
}
