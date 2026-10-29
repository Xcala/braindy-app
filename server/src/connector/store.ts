// Firestore/Storage operations of the Braindy connector, shared by the local one (Nicolas's PC, his gcloud login)
// and the remote one (Cloud Run, after OAuth). Database braindy-app only. Never reads or writes accesses (client credentials).
import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { db } from '../firebase.js';
import { contentTypeOf as lookup } from '../lib/mime.js';

const bucket = () => getStorage().bucket(process.env.FILES_BUCKET ?? 'braindy-app-files');
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

export type LinkKind = 'web' | 'app' | 'dashboard' | 'research' | 'marketmap';
export interface LinkInput { title: string; url: string; kind?: LinkKind; description?: string; status?: 'live' | 'building'; section?: 'apps' | 'research' }

/** Adds or updates a link in My apps (or My research). Same URL = same card, so repeating it never duplicates. */
export async function setLink(brandId: string, l: LinkInput) {
  const url = l.url.trim();
  if (!/^https:\/\/[^\s]+\.[^\s]+/.test(url)) throw new Error('El enlace debe empezar por https://');
  const section = l.section ?? 'apps';
  const col = db.collection(`brands/${brandId}/links`);
  const same = (await col.where('url', '==', url).get()).docs.find((d) => d.get('section') === section);
  const data = {
    section, kind: l.kind ?? 'web', title: l.title.trim().slice(0, 120), url: url.slice(0, 1000),
    description: (l.description ?? '').trim().slice(0, 300), status: l.status ?? 'live', updatedAt: FieldValue.serverTimestamp(),
  };
  if (same) { await same.ref.update(data); return { id: same.id, created: false }; }
  const ref = await col.add({ ...data, createdAt: FieldValue.serverTimestamp() });
  return { id: ref.id, created: true };
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
    const assetId = await storeUpload(brandId, name, size, [folder, root ? basename(root) : '', sub].filter(Boolean).join('/'),
      (file, contentType) => new Promise<void>((res, rej) => createReadStream(f)
        .pipe(file.createWriteStream({ resumable: size > 8 * 1024 ** 2, contentType }))
        .on('finish', () => res()).on('error', rej)));
    done.push({ name, assetId, size });
  }
  return { done, skipped };
}

type BucketFile = ReturnType<ReturnType<typeof bucket>['file']>;

/** Writes one file to the brand's Uploads and registers it as an asset (the same shape as an upload from the app). */
async function storeUpload(brandId: string, name: string, size: number, folder: string, write: (file: BucketFile, contentType: string) => Promise<void>) {
  const id = `upl-${randomUUID()}`;
  const storagePath = `brands/${brandId}/uploads/${id}/${name}`;
  const contentType = lookup(name);
  await write(bucket().file(storagePath), contentType);
  await db.doc(`brands/${brandId}/assets/${id}`).set({
    type: 'file', source: 'upload', title: name, folder, storagePath, size, contentType,
    status: 'published', uploadedBy: 'connector', createdAt: FieldValue.serverTimestamp(), uploadedAt: FieldValue.serverTimestamp(),
  });
  return id;
}

export const REMOTE_MAX_FILE = 25 * 1024 ** 2;
const safeName = (n: string) => basename(n.replace(/\\/g, '/')).replace(/[\r\n]/g, '_').slice(0, 200) || 'archivo';

/** Remote upload: the file comes inside the message (base64) or as an https link the server downloads. */
export async function uploadContent(brandId: string, f: { name: string; base64?: string; url?: string }, folder = 'Uploads') {
  let buf: Buffer;
  if (f.base64) buf = Buffer.from(f.base64, 'base64');
  else if (f.url && /^https:\/\//.test(f.url)) {
    const res = await fetch(f.url, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`No pude descargar ${f.url} (${res.status}).`);
    if (Number(res.headers.get('content-length') ?? 0) > REMOTE_MAX_FILE) throw new Error('El archivo pasa de 25 MB: súbelo con el conector local.');
    buf = Buffer.from(await res.arrayBuffer());
  } else throw new Error('Falta el contenido (base64) o un enlace https.');
  if (!buf.length) throw new Error('El archivo está vacío.');
  if (buf.length > REMOTE_MAX_FILE) throw new Error('El archivo pasa de 25 MB: súbelo con el conector local.');
  const name = safeName(f.name);
  const assetId = await storeUpload(brandId, name, buf.length, folder, (file, contentType) => file.save(buf, { contentType, resumable: false }));
  return { name, assetId, size: buf.length };
}
