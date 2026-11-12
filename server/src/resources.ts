// Free resources: skills, scripts, prompts, templates and guides NickMark shares with every client.
// The list lives in Firestore (resources/{id}, rules: signed-in users read published ones, admin writes).
// Files sit in the files bucket under resources/: the admin uploads with a signed URL, everyone downloads
// through a short signed URL, and each download is counted.
import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { db } from './firebase.js';
import type { AuthEnv } from './auth.js';

const BUCKET = process.env.FILES_BUCKET ?? 'braindy-app-files';
const URL_TTL_MS = 15 * 60 * 1000;
const MAX_BYTES = 500 * 1024 ** 2;
const bucket = () => getStorage().bucket(BUCKET);
const isAdmin = async (uid: string) => (await db.doc(`users/${uid}`).get()).get('role') === 'admin';

export const resources = new Hono<AuthEnv>();

/** Admin: a signed URL to upload a resource's file. The editor saves storagePath on the resource after the upload. */
resources.post('/admin/resources/uploads', async (c) => {
  if (!(await isAdmin(c.get('user').uid))) return c.json({ error: 'forbidden' }, 403);
  const b = await c.req.json<{ fileName?: string; contentType?: string; size?: number }>();
  const fileName = String(b.fileName ?? '').replace(/[\\/\r\n]/g, '_').slice(0, 200);
  if (!fileName || !(Number(b.size) > 0) || Number(b.size) > MAX_BYTES) return c.json({ error: 'invalid' }, 400);
  const storagePath = `resources/${randomUUID()}/${fileName}`;
  const contentType = String(b.contentType || 'application/octet-stream').slice(0, 120);
  const [url] = await bucket().file(storagePath).getSignedUrl({ version: 'v4', action: 'write', expires: Date.now() + URL_TTL_MS, contentType });
  return c.json({ storagePath, url, contentType });
});

/** Anyone signed in: download a published resource's file (the admin also drafts). */
resources.get('/resources/:id/file', async (c) => {
  const uid = c.get('user').uid;
  const ref = db.doc(`resources/${c.req.param('id')}`);
  const r = await ref.get();
  const path = r.get('file.storagePath') as string | undefined;
  if (!r.exists || !path?.startsWith('resources/')) return c.json({ error: 'not_found' }, 404);
  if (r.get('status') !== 'published' && !(await isAdmin(uid))) return c.json({ error: 'not_found' }, 404);
  const [url] = await bucket().file(path).getSignedUrl({
    version: 'v4', action: 'read', expires: Date.now() + URL_TTL_MS,
    responseDisposition: `attachment; filename="${String(r.get('file.name') ?? 'resource').replace(/["\r\n]/g, '')}"`,
  });
  await ref.update({ downloads: FieldValue.increment(1) });
  return c.json({ url });
});

/** Count a copy (prompt or script text copied from the page), so NickMark sees what clients use. */
resources.post('/resources/:id/used', async (c) => {
  const ref = db.doc(`resources/${c.req.param('id')}`);
  const r = await ref.get();
  if (!r.exists || r.get('status') !== 'published') return c.json({ ok: true });
  await ref.update({ copies: FieldValue.increment(1) });
  return c.json({ ok: true });
});
