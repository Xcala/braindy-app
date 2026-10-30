// Launches: work NickMark chooses to show to every client beside the studio ("Nuevo logo de Caoz").
// Nothing is shown unless he marks it. The image is copied out of the brand's private folder into launches/,
// so other clients never get a path or URL into that brand's files. Firestore `launches` is server-only.
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { bucket, URL_TTL_MS } from './requests.js';
import type { AuthEnv } from './auth.js';

const str = (v: unknown, max = 2000) => String(v ?? '').trim().slice(0, max);
const isImage = (f: { contentType?: string }) => String(f.contentType ?? '').startsWith('image/');
const isAdmin = async (uid: string) => (await db.doc(`users/${uid}`).get()).get('role') === 'admin';

/** Every signed-in client and the admin: the latest launches, each with a short-lived image URL. */
export const launches = new Hono<AuthEnv>();
launches.get('/launches', async (c) => {
  if (!(await db.doc(`users/${c.get('user').uid}`).get()).exists) return c.json({ items: [] });
  const snap = await db.collection('launches').orderBy('at', 'desc').limit(12).get();
  const items = await Promise.all(snap.docs.map(async (d) => {
    const x = d.data();
    const [url] = await bucket().file(x.imagePath).getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + URL_TTL_MS });
    return { id: d.id, brandName: x.brandName, title: x.title, category: x.category ?? null, at: x.at?.toMillis?.() ?? null, url };
  }));
  return c.json({ items });
});

/** Admin: show (or stop showing) an approved version as a launch. */
export const adminLaunches = new Hono<AuthEnv>();
adminLaunches.post('/brands/:brandId/requests/:requestId/versions/:versionId/launch', async (c) => {
  if (!(await isAdmin(c.get('user').uid))) return c.json({ error: 'forbidden' }, 403);
  const { brandId, requestId, versionId } = c.req.param();
  const b = await c.req.json<{ on?: boolean; title?: string }>();
  const reqRef = db.doc(`brands/${brandId}/requests/${requestId}`);
  const id = `${brandId}_${requestId}`;

  if (b.on !== true) {
    const old = await db.doc(`launches/${id}`).get();
    if (old.exists) await bucket().file(old.get('imagePath')).delete({ ignoreNotFound: true });
    await db.doc(`launches/${id}`).delete();
    await reqRef.update({ launch: null });
    return c.json({ ok: true });
  }

  const [brand, req, ver] = await Promise.all([db.doc(`brands/${brandId}`).get(), reqRef.get(), reqRef.collection('versions').doc(versionId).get()]);
  if (!req.exists || !ver.exists) return c.json({ error: 'not_found' }, 404);
  if (!['approved', 'published'].includes(req.get('status'))) return c.json({ error: 'not_approved' }, 400);
  const files = (ver.get('files') as Array<{ storagePath?: string; contentType?: string; name?: string }>) ?? [];
  const file = files.find((f) => isImage(f) && f.storagePath?.startsWith(`brands/${brandId}/`));
  if (!file) return c.json({ error: 'no_image' }, 400);

  const ext = (file.name ?? file.storagePath!).split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const imagePath = `launches/${id}.${ext}`;
  await bucket().file(file.storagePath!).copy(bucket().file(imagePath));
  const title = str(b.title, 120) || str(req.get('title'), 120);
  await db.doc(`launches/${id}`).set({
    brandId, requestId, versionId, brandName: str(brand.get('name'), 80) || brandId, title,
    category: req.get('category') ?? null, imagePath, at: FieldValue.serverTimestamp(), by: c.get('user').uid,
  });
  await reqRef.update({ launch: { versionId, title } });
  return c.json({ ok: true });
});
