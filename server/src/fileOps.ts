// NickMark's file housekeeping: trash (30 days, then gone), restore, rename, move, share links and zip downloads.
// Moving a file only changes its Firestore record; the object in the bucket keeps its path.
import { Hono } from 'hono';
import { FieldValue, type Transaction } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { db } from './firebase.js';
import { brandAccess, fileFilter } from './access.js';
import { forgetSearch } from './search.js';
import { zipStream } from './zip.js';
import type { AuthEnv } from './auth.js';

const BUCKET = process.env.FILES_BUCKET ?? 'braindy-app-files';
const bucket = () => getStorage().bucket(BUCKET);
const TRASH_DAYS = 30;
const SHARE_DAYS = 7; // the longest a signed URL may live
const ZIP_MAX_FILES = 200;
const ZIP_MAX_BYTES = 2 * 1024 ** 3; // stays under the 4 GB limit of a plain zip

type IndexRow = { path: string; files: number; bytes: number };

/**
 * Keeps context/fileIndex in step when a file leaves or enters a folder: `files` counts the files right in a folder,
 * `bytes` everything below it (same as the Drive import). The Uploads folder is not in the index.
 */
export async function bumpIndex(tx: Transaction, brandId: string, ...moves: Array<[folder: string, files: number, bytes: number]>) {
  const todo = moves.filter(([folder]) => folder.split('/')[0] !== 'Uploads');
  if (!todo.length) return;
  const ref = db.doc(`brands/${brandId}/context/fileIndex`);
  const list = ((await tx.get(ref)).get('folders') as IndexRow[] | undefined) ?? [];
  const byPath = new Map(list.map((f) => [f.path, { ...f }]));
  for (const [folder, files, bytes] of todo) {
    const parts = folder ? folder.split('/') : [];
    for (const p of parts.map((_, i) => parts.slice(0, i + 1).join('/')).concat('')) {
      const row = byPath.get(p) ?? (files > 0 ? { path: p, files: 0, bytes: 0 } : undefined);
      if (!row) continue;
      row.bytes = Math.max(0, row.bytes + bytes);
      if (p === folder) row.files = Math.max(0, row.files + files);
      byPath.set(p, row);
    }
  }
  // Callers run this after their other reads: Firestore wants every read of a transaction before its first write.
  tx.set(ref, { folders: [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path)) }, { merge: true });
}

async function adminOnly(uid: string, brandId: string) {
  return (await brandAccess(uid, brandId)).admin;
}

/** Deletes the bucket object unless another asset or trashed file still points at it. */
async function dropObject(brandId: string, storagePath?: string) {
  if (!storagePath?.startsWith(`brands/${brandId}/`)) return;
  const [a, t] = await Promise.all([
    db.collection(`brands/${brandId}/assets`).where('storagePath', '==', storagePath).limit(1).get(),
    db.collection(`brands/${brandId}/trash`).where('storagePath', '==', storagePath).limit(1).get(),
  ]);
  if (a.empty && t.empty) await bucket().file(storagePath).delete({ ignoreNotFound: true });
}

/** Empties trash older than 30 days. Runs whenever the trash is opened, so nothing needs a schedule. */
async function purgeExpired(brandId: string) {
  const cutoff = new Date(Date.now() - TRASH_DAYS * 864e5);
  const old = await db.collection(`brands/${brandId}/trash`).where('trashedAt', '<', cutoff).limit(200).get();
  for (const d of old.docs) { await d.ref.delete(); await dropObject(brandId, d.get('storagePath')); }
}

/** Moves one asset to the trash (restorable for 30 days) and leaves a tombstone so the Drive import does not bring it back. */
export async function trashAsset(brandId: string, assetId: string, uid: string): Promise<boolean> {
  const ref = db.doc(`brands/${brandId}/assets/${assetId}`);
  return db.runTransaction(async (tx) => {
    const asset = await tx.get(ref);
    if (!asset.exists) return false;
    const idRef = db.doc(`brands/${brandId}/context/identity`);
    const docs = ((await tx.get(idRef)).get('documents') as Array<{ id?: string }> | undefined) ?? [];
    await bumpIndex(tx, brandId, [String(asset.get('folder') ?? ''), -1, -Number(asset.get('size') ?? 0)]);
    if (docs.some((d) => d.id === assetId)) tx.update(idRef, { documents: docs.filter((d) => d.id !== assetId) });
    // Tombstone: the Drive import does not bring back what NickMark removed.
    tx.set(db.doc(`brands/${brandId}/deletedAssets/${assetId}`), { title: asset.get('title') ?? null, relPath: asset.get('relPath') ?? null, deletedBy: uid, deletedAt: FieldValue.serverTimestamp() });
    tx.set(db.doc(`brands/${brandId}/trash/${assetId}`), { ...asset.data(), trashedBy: uid, trashedAt: FieldValue.serverTimestamp() });
    tx.delete(ref);
    return true;
  });
}

export const fileOps = new Hono<AuthEnv>();

/** To the trash: the file disappears from Files (and from My brand) but can be restored for 30 days. */
fileOps.delete('/brands/:brandId/assets/:assetId', async (c) => {
  const { brandId, assetId } = c.req.param();
  const uid = c.get('user').uid;
  if (!(await adminOnly(uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const ok = await trashAsset(brandId, assetId, uid);
  forgetSearch(brandId);
  return ok ? c.json({ ok: true }) : c.json({ error: 'not_found' }, 404);
});

/** Who may see and restore a trashed file: NickMark all; a client member only what their team trashed, while they see it. */
async function restorable(uid: string, brandId: string) {
  const a = await brandAccess(uid, brandId);
  if (a.admin) return () => true;
  if (!a.member || !a.sections.includes('files')) return null;
  const seen = await fileFilter(brandId);
  return (t: FirebaseFirestore.DocumentSnapshot) => t.get('clientTrash') === true && seen(t);
}

fileOps.get('/brands/:brandId/trash', async (c) => {
  const { brandId } = c.req.param();
  const mine = await restorable(c.get('user').uid, brandId);
  if (!mine) return c.json({ error: 'forbidden' }, 403);
  await purgeExpired(brandId);
  const s = await db.collection(`brands/${brandId}/trash`).orderBy('trashedAt', 'desc').limit(300).get();
  return c.json({
    days: TRASH_DAYS,
    files: s.docs.filter(mine).map((d) => ({ id: d.id, title: d.get('title'), folder: d.get('folder') ?? '', size: d.get('size') ?? 0, contentType: d.get('contentType') ?? '', trashedAt: d.get('trashedAt')?.toMillis?.() ?? null })),
  });
});

fileOps.post('/brands/:brandId/trash/:assetId/restore', async (c) => {
  const { brandId, assetId } = c.req.param();
  const mine = await restorable(c.get('user').uid, brandId);
  if (!mine) return c.json({ error: 'forbidden' }, 403);
  const tRef = db.doc(`brands/${brandId}/trash/${assetId}`);
  const first = await tRef.get();
  if (first.exists && !mine(first)) return c.json({ error: 'forbidden' }, 403);
  const ok = await db.runTransaction(async (tx) => {
    const t = await tx.get(tRef);
    if (!t.exists) return false;
    const { trashedBy: _b, trashedAt: _a, fromFolder: _f, clientTrash: _c, ...data } = t.data()!;
    await bumpIndex(tx, brandId, [String(data.folder ?? ''), 1, Number(data.size ?? 0)]);
    tx.set(db.doc(`brands/${brandId}/assets/${assetId}`), data);
    tx.delete(db.doc(`brands/${brandId}/deletedAssets/${assetId}`));
    tx.delete(tRef);
    return true;
  });
  // A folder the client team made comes back as theirs again (to rename or trash).
  if (ok && first.get('clientTrash') === true && first.get('fromFolder')) {
    await db.doc(`brands/${brandId}/context/fileIndex`).set({ clientMade: FieldValue.arrayUnion(String(first.get('fromFolder'))) }, { merge: true });
  }
  forgetSearch(brandId);
  return ok ? c.json({ ok: true }) : c.json({ error: 'not_found' }, 404);
});

/** Gone for good: the record and (if nothing else uses it) the object in the bucket. */
fileOps.delete('/brands/:brandId/trash/:assetId', async (c) => {
  const { brandId, assetId } = c.req.param();
  if (!(await adminOnly(c.get('user').uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const tRef = db.doc(`brands/${brandId}/trash/${assetId}`);
  const t = await tRef.get();
  if (!t.exists) return c.json({ error: 'not_found' }, 404);
  await tRef.delete();
  await dropObject(brandId, t.get('storagePath'));
  return c.json({ ok: true });
});

/** Rename and/or move to another folder. Clients may rename the files they can see (only NickMark moves them). */
fileOps.patch('/brands/:brandId/assets/:assetId', async (c) => {
  const { brandId, assetId } = c.req.param();
  const body = await c.req.json<{ title?: string; folder?: string }>();
  const access = await brandAccess(c.get('user').uid, brandId);
  if (!access.admin) {
    if (!access.member || !access.sections.includes('files') || body.folder !== undefined || body.title === undefined) return c.json({ error: 'forbidden' }, 403);
    const a = await db.doc(`brands/${brandId}/assets/${assetId}`).get();
    if (!a.exists || !(await fileFilter(brandId))(a)) return c.json({ error: 'not_found' }, 404);
  }
  const title = body.title === undefined ? undefined : String(body.title).replace(/[\\/\r\n]/g, '_').trim().slice(0, 200);
  const folder = body.folder === undefined ? undefined : String(body.folder).split('/').map((p) => p.trim()).filter(Boolean).join('/').slice(0, 500);
  if (title === '') return c.json({ error: 'invalid' }, 400);
  const ref = db.doc(`brands/${brandId}/assets/${assetId}`);
  const ok = await db.runTransaction(async (tx) => {
    const a = await tx.get(ref);
    if (!a.exists) return false;
    const from = String(a.get('folder') ?? ''), size = Number(a.get('size') ?? 0);
    if (folder !== undefined && folder !== from) {
      await bumpIndex(tx, brandId, [from, -1, -size], [folder, 1, size]);
    }
    tx.update(ref, { ...(title ? { title } : {}), ...(folder !== undefined ? { folder } : {}), editedAt: FieldValue.serverTimestamp() });
    return true;
  });
  forgetSearch(brandId);
  return ok ? c.json({ ok: true }) : c.json({ error: 'not_found' }, 404);
});

/** A link anyone can open for 7 days (a signed URL; nothing is made public). */
fileOps.post('/brands/:brandId/assets/:assetId/share', async (c) => {
  const { brandId, assetId } = c.req.param();
  if (!(await adminOnly(c.get('user').uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const a = await db.doc(`brands/${brandId}/assets/${assetId}`).get();
  const storagePath = a.get('storagePath') as string | undefined;
  if (!a.exists || !storagePath?.startsWith(`brands/${brandId}/`)) return c.json({ error: 'not_found' }, 404);
  const expires = Date.now() + SHARE_DAYS * 864e5 - 60_000;
  const [url] = await bucket().file(storagePath).getSignedUrl({ version: 'v4', action: 'read', expires, responseDisposition: 'inline' });
  return c.json({ url, expires });
});

/** Several files in one .zip, streamed straight from the bucket. Members get only what they may see. */
fileOps.post('/brands/:brandId/assets/zip', async (c) => {
  const { brandId } = c.req.param();
  const access = await brandAccess(c.get('user').uid, brandId);
  if (!access.member || !access.sections.includes('files')) return c.json({ error: 'forbidden' }, 403);
  const ids = ((await c.req.json<{ ids?: string[] }>()).ids ?? []).map(String).slice(0, ZIP_MAX_FILES);
  if (!ids.length) return c.json({ error: 'invalid' }, 400);
  const visible = access.admin ? () => true : await fileFilter(brandId);
  const snaps = await db.getAll(...ids.map((id) => db.doc(`brands/${brandId}/assets/${id}`)));
  const items = snaps.filter((s) => s.exists && String(s.get('storagePath') ?? '').startsWith(`brands/${brandId}/`) && visible(s));
  if (items.reduce((n, s) => n + Number(s.get('size') ?? 0), 0) > ZIP_MAX_BYTES) return c.json({ error: 'too_large' }, 413);
  const used = new Map<string, number>();
  const entries = items.map((s) => {
    const name = String(s.get('title') ?? s.id);
    const n = used.get(name) ?? 0; used.set(name, n + 1);
    return { name: n ? name.replace(/(\.[^.]*)?$/, (ext) => ` (${n + 1})${ext}`) : name, open: () => bucket().file(s.get('storagePath')).createReadStream() };
  });
  return new Response(zipStream(entries), {
    headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="braindy-${brandId}.zip"` },
  });
});
