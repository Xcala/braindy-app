// File access for brand assets in the private bucket. The browser never gets bucket credentials:
// it asks here and receives a short-lived signed URL after the access check.
import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { db } from './firebase.js';
import { brandAccess, fileFilter } from './access.js';
import type { AuthEnv } from './auth.js';

const BUCKET = process.env.FILES_BUCKET ?? 'braindy-app-files';
const URL_TTL_MS = 15 * 60 * 1000;
const MAX_UPLOAD_BYTES = 500 * 1024 ** 2;
const bucket = () => getStorage().bucket(BUCKET);

export const files = new Hono<AuthEnv>();

/** Signed download (or inline view) URL for one asset. */
files.get('/brands/:brandId/assets/:assetId/url', async (c) => {
  const { brandId, assetId } = c.req.param();
  const access = await brandAccess(c.get('user').uid, brandId);
  if (!access.member) return c.json({ error: 'forbidden' }, 403);

  const asset = await db.doc(`brands/${brandId}/assets/${assetId}`).get();
  const storagePath = asset.get('storagePath') as string | undefined;
  if (!asset.exists || !storagePath || !storagePath.startsWith(`brands/${brandId}/`)) return c.json({ error: 'not_found' }, 404);
  // Brand documents NickMark pinned to My brand open for every member, whatever the folder sharing says.
  const identity = await db.doc(`brands/${brandId}/context/identity`).get();
  const pinned = ((identity.get('documents') as Array<{ id?: string }> | undefined) ?? []).some((d) => d.id === assetId);
  if (!pinned) {
    // My files needs the files section; files attached to a request (Uploads) also open from Requests.
    const viaRequests = access.sections.includes('requests') && asset.get('folder') === 'Uploads';
    if (!access.sections.includes('files') && !viaRequests) return c.json({ error: 'forbidden' }, 403);
    if (!access.admin && !(await fileFilter(brandId))(asset)) return c.json({ error: 'not_found' }, 404);
  }

  const disposition = c.req.query('inline') === '1' ? 'inline' : 'attachment';
  const filename = String(asset.get('title') ?? 'file').replace(/["\\\r\n]/g, '');
  const [url] = await bucket().file(storagePath).getSignedUrl({
    version: 'v4', action: 'read', expires: Date.now() + URL_TTL_MS,
    responseDisposition: `${disposition}; filename*=UTF-8''${encodeURIComponent(filename)}`,
    // Text files opened in a tab (.md, .html) read as UTF-8, so accents do not come out garbled.
    ...(disposition === 'inline' && String(asset.get('contentType')).startsWith('text/') ? { responseType: `${asset.get('contentType')}; charset=utf-8` } : {}),
  });
  return c.json({ url, expiresInSeconds: URL_TTL_MS / 1000 });
});

/** Signed inline URLs for up to 60 assets at once (thumbnails in the file browser). */
files.post('/brands/:brandId/assets/urls', async (c) => {
  const { brandId } = c.req.param();
  const access = await brandAccess(c.get('user').uid, brandId);
  if (!access.member || !access.sections.includes('files')) return c.json({ error: 'forbidden' }, 403);

  const { ids } = await c.req.json<{ ids?: string[] }>();
  const list = [...new Set((ids ?? []).filter((x) => typeof x === 'string'))].slice(0, 60);
  const snaps = list.length ? await db.getAll(...list.map((id) => db.doc(`brands/${brandId}/assets/${id}`))) : [];
  const urls: Record<string, string> = {};
  const visible = access.admin ? () => true : await fileFilter(brandId);
  await Promise.all(snaps.map(async (s) => {
    const path = s.get('storagePath') as string | undefined;
    if (!s.exists || !path || !path.startsWith(`brands/${brandId}/`) || !visible(s)) return;
    const [url] = await bucket().file(path).getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + URL_TTL_MS });
    urls[s.id] = url;
  }));
  return c.json({ urls });
});

/** Starts a client upload: registers a pending asset and returns a signed PUT URL. */
files.post('/brands/:brandId/uploads', async (c) => {
  const { brandId } = c.req.param();
  const uid = c.get('user').uid;
  const access = await brandAccess(uid, brandId);
  if (!access.member || !(access.sections.includes('files') || access.sections.includes('requests'))) return c.json({ error: 'forbidden' }, 403);

  const body = await c.req.json<{ fileName?: string; contentType?: string; size?: number; folder?: string }>();
  const fileName = String(body.fileName ?? '').replace(/[\\/\r\n]/g, '_').slice(0, 200);
  const size = Number(body.size);
  const contentType = String(body.contentType || 'application/octet-stream').slice(0, 120);
  if (!fileName || !Number.isFinite(size) || size <= 0) return c.json({ error: 'invalid' }, 400);
  if (size > MAX_UPLOAD_BYTES) return c.json({ error: 'too_large', maxBytes: MAX_UPLOAD_BYTES }, 413);

  const id = `upl-${randomUUID()}`;
  const storagePath = `brands/${brandId}/uploads/${id}/${fileName}`;
  await db.doc(`brands/${brandId}/assets/${id}`).set({
    type: 'file', source: 'upload', title: fileName, folder: 'Uploads', storagePath, size, contentType,
    status: 'uploading', uploadedBy: uid, createdAt: FieldValue.serverTimestamp(),
  });
  const [url] = await bucket().file(storagePath).getSignedUrl({
    version: 'v4', action: 'write', expires: Date.now() + URL_TTL_MS, contentType,
  });
  return c.json({ assetId: id, url, contentType });
});

/** Confirms an upload once the browser finished the PUT. */
files.post('/brands/:brandId/uploads/:assetId/complete', async (c) => {
  const { brandId, assetId } = c.req.param();
  const uid = c.get('user').uid;
  const ref = db.doc(`brands/${brandId}/assets/${assetId}`);
  const asset = await ref.get();
  if (!asset.exists || asset.get('source') !== 'upload') return c.json({ error: 'not_found' }, 404);
  const access = await brandAccess(uid, brandId);
  if (!access.admin && asset.get('uploadedBy') !== uid) return c.json({ error: 'forbidden' }, 403);

  const [exists] = await bucket().file(asset.get('storagePath')).exists();
  if (!exists) return c.json({ error: 'upload_missing' }, 409);
  const [meta] = await bucket().file(asset.get('storagePath')).getMetadata();
  await ref.update({ status: 'published', size: Number(meta.size), uploadedAt: FieldValue.serverTimestamp() });
  return c.json({ ok: true });
});

/**
 * NickMark only: delete one file. Removes the asset, its object in the bucket (unless another asset points at the same
 * object), its pin in My brand and its count in the folder index; leaves a tombstone so the Drive import does not bring
 * it back.
 */
files.delete('/brands/:brandId/assets/:assetId', async (c) => {
  const { brandId, assetId } = c.req.param();
  const uid = c.get('user').uid;
  if (!(await brandAccess(uid, brandId)).admin) return c.json({ error: 'forbidden' }, 403);
  const ref = db.doc(`brands/${brandId}/assets/${assetId}`);
  const asset = await ref.get();
  if (!asset.exists) return c.json({ error: 'not_found' }, 404);
  const storagePath = asset.get('storagePath') as string | undefined;
  const folder = String(asset.get('folder') ?? '');
  const size = Number(asset.get('size') ?? 0);

  await db.doc(`brands/${brandId}/deletedAssets/${assetId}`).set({
    title: asset.get('title') ?? null, relPath: asset.get('relPath') ?? null, source: asset.get('source') ?? null,
    storagePath: storagePath ?? null, deletedBy: uid, deletedAt: FieldValue.serverTimestamp(),
  });
  await ref.delete();
  if (storagePath?.startsWith(`brands/${brandId}/`)) {
    const others = await db.collection(`brands/${brandId}/assets`).where('storagePath', '==', storagePath).limit(1).get();
    if (others.empty) await bucket().file(storagePath).delete({ ignoreNotFound: true });
  }
  await db.runTransaction(async (tx) => {
    const idRef = db.doc(`brands/${brandId}/context/identity`);
    const idxRef = db.doc(`brands/${brandId}/context/fileIndex`);
    const [identity, index] = await Promise.all([tx.get(idRef), tx.get(idxRef)]);
    const docs = (identity.get('documents') as Array<{ id?: string }> | undefined) ?? [];
    if (docs.some((d) => d.id === assetId)) tx.update(idRef, { documents: docs.filter((d) => d.id !== assetId) });
    // Folder sizes count every file below them, so the file leaves its folder and each parent.
    const list = index.get('folders') as Array<{ path: string; files: number; bytes: number }> | undefined;
    if (list && asset.get('source') === 'drive') {
      const parts = folder ? folder.split('/') : [];
      const chain = new Set(parts.map((_, i) => parts.slice(0, i + 1).join('/')).concat(''));
      tx.update(idxRef, { folders: list.map((f) => (chain.has(f.path) ? { ...f, files: Math.max(0, f.files - 1), bytes: Math.max(0, f.bytes - size) } : f)) });
    }
  });
  return c.json({ ok: true });
});
