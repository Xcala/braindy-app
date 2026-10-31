// Launches: work (an image or a video) NickMark chooses to show to every client beside the studio ("Nuevo logo de Caoz").
// Nothing is shown unless he marks it. The image is copied out of the brand's private folder into launches/,
// so other clients never get a path or URL into that brand's files. Firestore `launches` is server-only.
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { bucket, URL_TTL_MS } from './requests.js';
import { brandAccess } from './access.js';
import type { AuthEnv } from './auth.js';

const str = (v: unknown, max = 2000) => String(v ?? '').trim().slice(0, max);
const isShowable = (f: { contentType?: string }) => /^(image|video)\//.test(String(f.contentType ?? ''));
const isAdmin = async (uid: string) => (await db.doc(`users/${uid}`).get()).get('role') === 'admin';

/** Reactions a client can leave on a launch, like on social media. Everyone sees the counts. */
export const REACTIONS = ['fire', 'love', 'clap', 'idea'] as const;
type Reaction = (typeof REACTIONS)[number];

/** Every signed-in client and the admin: the latest launches, each with a short-lived image URL, the reaction counts and the viewer's own reactions. */
export const launches = new Hono<AuthEnv>();
launches.get('/launches', async (c) => {
  const uid = c.get('user').uid;
  if (!(await db.doc(`users/${uid}`).get()).exists) return c.json({ items: [] });
  const snap = await db.collection('launches').orderBy('at', 'desc').limit(12).get();
  // Each launch carries its brand's city, so the band can tag it (BOG, NYC).
  const ids = [...new Set(snap.docs.map((d) => String(d.get('brandId'))))];
  const brands = ids.length ? await db.getAll(...ids.map((id) => db.doc(`brands/${id}`))) : [];
  const cityOf = new Map(brands.map((b) => [b.id, b.get('city') ?? null]));
  const items = await Promise.all(snap.docs.map(async (d) => {
    const x = d.data();
    const [[url], mine] = await Promise.all([
      bucket().file(x.imagePath).getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + URL_TTL_MS }),
      d.ref.collection('reactions').doc(uid).get(),
    ]);
    const counts = Object.fromEntries(REACTIONS.map((r) => [r, Math.max(0, (x.reactions?.[r] as number) ?? 0)]));
    return {
      id: d.id, brandId: x.brandId, brandName: x.brandName, title: x.title, category: x.category ?? null, kind: x.kind === 'video' ? 'video' : 'image', city: cityOf.get(x.brandId) ?? null, at: x.at?.toMillis?.() ?? null, url,
      counts, mine: ((mine.get('reactions') as Reaction[]) ?? []).filter((r) => REACTIONS.includes(r)),
    };
  }));
  return c.json({ items });
});

/** The brand's own latest finished work (approved or live), each with a short-lived URL of its first image or video. Members of the brand only. */
launches.get('/brands/:brandId/launches/own', async (c) => {
  const { brandId } = c.req.param();
  if (!(await brandAccess(c.get('user').uid, brandId)).member) return c.json({ error: 'forbidden' }, 403);
  const snap = await db.collection(`brands/${brandId}/requests`).where('status', 'in', ['approved', 'published']).get();
  const ms = (v: unknown) => (v as { toMillis?: () => number })?.toMillis?.() ?? 0;
  const done = snap.docs.filter((d) => d.get('latestVersion')).sort((a, b) => ms(b.get('updatedAt')) - ms(a.get('updatedAt'))).slice(0, 8);
  const items = await Promise.all(done.map(async (d) => {
    const ver = await d.ref.collection('versions').doc(d.get('latestVersion')).get();
    const files = (ver.get('files') as Array<{ storagePath?: string; contentType?: string; url?: string }>) ?? [];
    // Files uploaded here live in the brand's folder; work migrated from the old apps keeps its own https link.
    const file = files.find((f) => isShowable(f) && (f.storagePath?.startsWith(`brands/${brandId}/`) || /^https:\/\//.test(f.url ?? '')));
    if (!file) return null;
    const url = file.storagePath?.startsWith(`brands/${brandId}/`)
      ? (await bucket().file(file.storagePath).getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + URL_TTL_MS }))[0]
      : file.url!;
    return { id: d.id, title: str(d.get('title'), 120), category: d.get('category') ?? null, kind: String(file.contentType).startsWith('video/') ? 'video' : 'image', at: ms(d.get('updatedAt')) || null, url };
  }));
  return c.json({ items: items.filter(Boolean) });
});

/** A client turns one of their reactions on a launch on or off. The launch keeps a count per reaction. */
launches.post('/launches/:id/reaction', async (c) => {
  const uid = c.get('user').uid;
  if (!(await db.doc(`users/${uid}`).get()).exists) return c.json({ error: 'forbidden' }, 403);
  const b = await c.req.json<{ reaction?: string; on?: boolean }>();
  const reaction = b.reaction as Reaction;
  if (!REACTIONS.includes(reaction)) return c.json({ error: 'invalid' }, 400);
  const ref = db.doc(`launches/${c.req.param('id')}`);
  const mineRef = ref.collection('reactions').doc(uid);
  const ok = await db.runTransaction(async (tx) => {
    const [launch, mine] = await Promise.all([tx.get(ref), tx.get(mineRef)]);
    if (!launch.exists) return false;
    const list = (mine.get('reactions') as Reaction[]) ?? [];
    const had = list.includes(reaction), on = b.on === true;
    if (had === on) return true;
    tx.update(ref, { [`reactions.${reaction}`]: FieldValue.increment(on ? 1 : -1) });
    tx.set(mineRef, { reactions: on ? [...list, reaction] : list.filter((r) => r !== reaction), at: FieldValue.serverTimestamp() });
    return true;
  });
  return ok ? c.json({ ok: true }) : c.json({ error: 'not_found' }, 404);
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
    await db.recursiveDelete(db.doc(`launches/${id}`)); // with its reactions
    await reqRef.update({ launch: null });
    return c.json({ ok: true });
  }

  const [brand, req, ver] = await Promise.all([db.doc(`brands/${brandId}`).get(), reqRef.get(), reqRef.collection('versions').doc(versionId).get()]);
  if (!req.exists || !ver.exists) return c.json({ error: 'not_found' }, 404);
  if (!['approved', 'published'].includes(req.get('status'))) return c.json({ error: 'not_approved' }, 400);
  const files = (ver.get('files') as Array<{ storagePath?: string; contentType?: string; name?: string }>) ?? [];
  const file = files.find((f) => isShowable(f) && f.storagePath?.startsWith(`brands/${brandId}/`));
  if (!file) return c.json({ error: 'no_image' }, 400);

  const ext = (file.name ?? file.storagePath!).split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const imagePath = `launches/${id}.${ext}`;
  await bucket().file(file.storagePath!).copy(bucket().file(imagePath));
  const title = str(b.title, 120) || str(req.get('title'), 120);
  await db.doc(`launches/${id}`).set({
    brandId, requestId, versionId, brandName: str(brand.get('name'), 80) || brandId, title,
    category: req.get('category') ?? null, imagePath, kind: String(file.contentType).startsWith('video/') ? 'video' : 'image', at: FieldValue.serverTimestamp(), by: c.get('user').uid,
  });
  await reqRef.update({ launch: { versionId, title } });
  return c.json({ ok: true });
});
