// NickMark's folder housekeeping in Files: rename a folder and send a whole folder to the trash. Only Braindy's
// records change: the bucket objects stay put and Drive is never touched. Each trashed file can be restored for 30
// days like any other, and the Drive import does not bring back what was trashed (tombstones).
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { brandAccess } from './access.js';
import { forgetSearch } from './search.js';
import { APPROVED_FOLDER } from './approvedFiles.js';
import type { AuthEnv } from './auth.js';

const clean = (p: unknown) => String(p ?? '').split('/').map((s) => s.trim()).filter(Boolean).join('/').slice(0, 500);
const under = (folder: string, path: string) => folder === path || folder.startsWith(`${path}/`);

/** context/fileIndex from scratch: every folder with its own file count and the bytes below it (no Uploads, no legacy). */
export async function rebuildIndex(brandId: string) {
  const snap = await db.collection(`brands/${brandId}/assets`).select('folder', 'size', 'source').get();
  const rows: Record<string, { files: number; bytes: number }> = {};
  for (const d of snap.docs) {
    const folder = String(d.get('folder') ?? '');
    if (d.get('source') === 'legacy' || folder.split('/')[0] === 'Uploads') continue;
    const parts = folder ? folder.split('/') : [];
    for (let i = 0; i <= parts.length; i++) {
      const key = parts.slice(0, i).join('/');
      rows[key] ??= { files: 0, bytes: 0 };
      if (i === parts.length) rows[key].files++;
      rows[key].bytes += Number(d.get('size') ?? 0);
    }
  }
  const folders = Object.entries(rows).map(([path, v]) => ({ path, ...v })).sort((a, b) => a.path.localeCompare(b.path));
  await db.doc(`brands/${brandId}/context/fileIndex`).set({ folders }, { merge: true });
}

async function assetsUnder(brandId: string, path: string) {
  // Folder paths are not indexed by prefix: read the folder fields and filter here.
  const snap = await db.collection(`brands/${brandId}/assets`).select('folder').get();
  return snap.docs.filter((d) => under(String(d.get('folder') ?? ''), path));
}

export const folderOps = new Hono<AuthEnv>();
folderOps.use('/brands/:brandId/folders/*', async (c, next) => {
  if (!(await brandAccess(c.get('user').uid, c.req.param('brandId') ?? '')).admin) return c.json({ error: 'forbidden' }, 403);
  await next();
});

/** New name for a folder (same parent). Everything inside keeps its place under the new name. */
folderOps.post('/brands/:brandId/folders/rename', async (c) => {
  const { brandId } = c.req.param();
  const b = await c.req.json<{ path?: string; name?: string }>().catch(() => ({} as { path?: string; name?: string }));
  const path = clean(b.path);
  const name = String(b.name ?? '').replace(/[\\/\r\n]/g, ' ').trim().slice(0, 120);
  const top = path.split('/')[0];
  if (!path || !name || top === 'Uploads' || path === APPROVED_FOLDER) return c.json({ error: 'invalid' }, 400);
  const to = path.includes('/') ? `${path.slice(0, path.lastIndexOf('/'))}/${name}` : name;
  if (to === path) return c.json({ ok: true, path: to });
  const docs = await assetsUnder(brandId, path);
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch();
    for (const d of docs.slice(i, i + 400)) batch.update(d.ref, { folder: to + String(d.get('folder')).slice(path.length), editedAt: FieldValue.serverTimestamp() });
    await batch.commit();
  }
  // A shared top folder stays shared under its new name.
  if (!path.includes('/')) {
    const brandRef = db.doc(`brands/${brandId}`);
    const fa = (await brandRef.get()).get('fileAccess') as { mode?: string; folders?: string[] } | undefined;
    if (fa?.mode === 'selected' && fa.folders?.includes(path)) await brandRef.update({ 'fileAccess.folders': fa.folders.map((f) => (f === path ? to : f)) });
  }
  await rebuildIndex(brandId);
  await db.collection('audit').doc().set({ type: 'folder_renamed', brandId, from: path, to, files: docs.length, by: c.get('user').uid, at: FieldValue.serverTimestamp() });
  forgetSearch(brandId);
  return c.json({ ok: true, path: to, files: docs.length });
});

/** The whole folder to the trash: its files leave Files (and My brand) and can be restored for 30 days. */
folderOps.post('/brands/:brandId/folders/trash', async (c) => {
  const { brandId } = c.req.param();
  const uid = c.get('user').uid;
  const path = clean((await c.req.json<{ path?: string }>().catch(() => ({} as { path?: string }))).path);
  if (!path || path.split('/')[0] === 'Uploads') return c.json({ error: 'invalid' }, 400);
  const docs = await assetsUnder(brandId, path);
  const ids = new Set(docs.map((d) => d.id));
  for (let i = 0; i < docs.length; i += 150) {
    const full = await db.getAll(...docs.slice(i, i + 150).map((d) => d.ref));
    const batch = db.batch();
    for (const a of full.filter((x) => x.exists)) {
      batch.set(db.doc(`brands/${brandId}/deletedAssets/${a.id}`), { title: a.get('title') ?? null, relPath: a.get('relPath') ?? null, deletedBy: uid, deletedAt: FieldValue.serverTimestamp() });
      batch.set(db.doc(`brands/${brandId}/trash/${a.id}`), { ...a.data(), trashedBy: uid, trashedAt: FieldValue.serverTimestamp() });
      batch.delete(a.ref);
    }
    await batch.commit();
  }
  const idRef = db.doc(`brands/${brandId}/context/identity`);
  const pinned = ((await idRef.get()).get('documents') as Array<{ id?: string }> | undefined) ?? [];
  if (pinned.some((d) => d.id && ids.has(d.id))) await idRef.update({ documents: pinned.filter((d) => !d.id || !ids.has(d.id)) });
  await rebuildIndex(brandId);
  await db.collection('audit').doc().set({ type: 'folder_trashed', brandId, path, files: docs.length, by: uid, at: FieldValue.serverTimestamp() });
  forgetSearch(brandId);
  return c.json({ ok: true, ids: [...ids] });
});
