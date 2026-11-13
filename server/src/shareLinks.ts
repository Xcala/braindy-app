// Brand links without login (ideas taken from Air, 2026-11-07):
//  · upload link: anyone with it sends files to the brand; they land in the «Recibidos» folder, never anywhere else.
//  · showcase: a read-only page with the work the brand approved, to show it to a boss or partners.
// NickMark and the brand's owners create and turn them off. The tokens live in backend-only collections.
import { randomBytes, randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { brandAccess } from './access.js';
import { URL_TTL_MS, bucket } from './requests.js';
import { bumpIndex } from './fileOps.js';
import { forgetSearch } from './search.js';
import { recordFileEvent } from './brains/brainEvents.js';
import type { AuthEnv } from './auth.js';

const KINDS = { upload: 'uploadLinks', showcase: 'showcaseLinks' } as const;
type Kind = keyof typeof KINDS;
const RECEIVED = 'Recibidos';
const MAX_UPLOAD_BYTES = 500 * 1024 ** 2;
const SHOWCASE_ITEMS = 40;
const now = () => FieldValue.serverTimestamp();
const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
const signed = async (path: string) => (await bucket().file(path).getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + URL_TTL_MS }))[0];

async function canManage(uid: string, brandId: string) {
  const a = await brandAccess(uid, brandId);
  return a.admin || (a.member && a.role === 'client_owner');
}

/** An active link of this kind, or null (wrong kind, turned off, or a brand that no longer exists). */
async function active(kind: Kind, token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const link = await db.doc(`${KINDS[kind]}/${token}`).get();
  if (!link.exists || link.get('active') !== true) return null;
  const brand = await db.doc(`brands/${link.get('brandId')}`).get();
  return brand.exists ? { link, brand, brandId: brand.id } : null;
}
const brandOut = (b: FirebaseFirestore.DocumentSnapshot) => ({ name: String(b.get('name') ?? ''), logoUrl: (b.get('logoUrl') as string | undefined) ?? null });

export const shareLinks = new Hono<AuthEnv>();

/** The brand's active links of both kinds. */
shareLinks.get('/brands/:brandId/share-links', async (c) => {
  const { brandId } = c.req.param();
  if (!(await canManage(c.get('user').uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const out: Record<Kind, unknown[]> = { upload: [], showcase: [] };
  for (const kind of Object.keys(KINDS) as Kind[]) {
    const s = await db.collection(KINDS[kind]).where('brandId', '==', brandId).where('active', '==', true).get();
    out[kind] = s.docs.map((d) => ({ token: d.id, label: d.get('label') ?? '', count: d.get('count') ?? 0, createdAt: d.get('createdAt')?.toMillis?.() ?? null }));
  }
  return c.json(out);
});

shareLinks.post('/brands/:brandId/share-links', async (c) => {
  const { brandId } = c.req.param();
  const uid = c.get('user').uid;
  if (!(await canManage(uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const b = await c.req.json<{ kind?: string; label?: string }>().catch(() => ({} as { kind?: string; label?: string }));
  const kind = b.kind === 'showcase' ? 'showcase' : b.kind === 'upload' ? 'upload' : null;
  if (!kind) return c.json({ error: 'invalid' }, 400);
  const token = randomBytes(24).toString('base64url');
  await db.doc(`${KINDS[kind]}/${token}`).set({ brandId, label: str(b.label, 60), active: true, count: 0, createdBy: uid, createdAt: now() });
  await db.collection('audit').doc().set({ type: `${kind}_link_created`, brandId, by: uid, at: now() });
  return c.json({ token });
});

shareLinks.delete('/brands/:brandId/share-links/:kind/:token', async (c) => {
  const { brandId, kind, token } = c.req.param();
  const uid = c.get('user').uid;
  if (!(kind in KINDS) || !(await canManage(uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const ref = db.doc(`${KINDS[kind as Kind]}/${token}`);
  const link = await ref.get();
  if (!link.exists || link.get('brandId') !== brandId) return c.json({ error: 'not_found' }, 404);
  await ref.update({ active: false, offBy: uid, offAt: now() });
  await db.collection('audit').doc().set({ type: `${kind}_link_off`, brandId, by: uid, at: now() });
  return c.json({ ok: true });
});

// ---------- public: no login ----------
export const publicShare = new Hono();

publicShare.get('/u/:token', async (c) => {
  const l = await active('upload', c.req.param('token'));
  if (!l) return c.json({ error: 'not_found' }, 404);
  c.header('Cache-Control', 'no-store');
  return c.json({ brand: brandOut(l.brand), label: l.link.get('label') ?? '' });
});

/** Starts one file: a pending asset in «Recibidos» (a sub-folder named after the sender) and a signed PUT URL. */
publicShare.post('/u/:token/files', async (c) => {
  const token = c.req.param('token');
  const l = await active('upload', token);
  if (!l) return c.json({ error: 'not_found' }, 404);
  const b = await c.req.json<{ fileName?: string; contentType?: string; size?: number; sender?: string; note?: string }>().catch(() => ({} as Record<string, never>));
  const fileName = str(b.fileName, 200).replace(/[\\/\r\n]/g, '_');
  const size = Number(b.size);
  const contentType = str(b.contentType, 120) || 'application/octet-stream';
  if (!fileName || !Number.isFinite(size) || size <= 0) return c.json({ error: 'invalid' }, 400);
  if (size > MAX_UPLOAD_BYTES) return c.json({ error: 'too_large', maxBytes: MAX_UPLOAD_BYTES }, 413);
  const sender = str(b.sender, 60).replace(/[\\/\r\n]/g, ' ');
  const folder = sender ? `${RECEIVED}/${sender}` : RECEIVED;
  const id = `rcv-${randomUUID()}`;
  const storagePath = `brands/${l.brandId}/received/${id}/${fileName}`;
  await db.doc(`brands/${l.brandId}/assets/${id}`).set({
    type: 'file', source: 'link', title: fileName, folder, storagePath, size, contentType, status: 'uploading',
    uploadedBy: `link:${token.slice(0, 8)}`, linkToken: token, sender: sender || null, note: str(b.note, 1000) || null, createdAt: now(),
  });
  const [url] = await bucket().file(storagePath).getSignedUrl({ version: 'v4', action: 'write', expires: Date.now() + URL_TTL_MS, contentType });
  return c.json({ assetId: id, url, contentType });
});

publicShare.post('/u/:token/files/:assetId/complete', async (c) => {
  const { token, assetId } = c.req.param();
  const l = await active('upload', token);
  if (!l) return c.json({ error: 'not_found' }, 404);
  const ref = db.doc(`brands/${l.brandId}/assets/${assetId}`);
  const asset = await ref.get();
  if (!asset.exists || asset.get('linkToken') !== token || asset.get('status') !== 'uploading') return c.json({ error: 'not_found' }, 404);
  const file = bucket().file(String(asset.get('storagePath')));
  const [exists] = await file.exists();
  if (!exists) return c.json({ error: 'upload_missing' }, 409);
  const [meta] = await file.getMetadata();
  const folder = String(asset.get('folder') ?? RECEIVED);
  await db.runTransaction(async (tx) => {
    await bumpIndex(tx, l.brandId, [folder, 1, Number(meta.size)]);
    tx.update(ref, { status: 'published', size: Number(meta.size), uploadedAt: now() });
    tx.update(l.link.ref, { count: FieldValue.increment(1), lastAt: now() });
  });
  forgetSearch(l.brandId);
  await recordFileEvent(l.brandId, folder, [String(asset.get('title') ?? '')], `file-${assetId}`);
  return c.json({ ok: true });
});

/** The showcase: approved requests, newest first, each with its approved version's pictures, videos and PDFs. */
publicShare.get('/s/:token', async (c) => {
  const l = await active('showcase', c.req.param('token'));
  if (!l) return c.json({ error: 'not_found' }, 404);
  const reqs = await db.collection(`brands/${l.brandId}/requests`).where('status', 'in', ['approved', 'published']).get();
  const sorted = reqs.docs.filter((d) => d.get('archived') !== true)
    .sort((a, b) => (b.get('approvedAt')?.toMillis?.() ?? 0) - (a.get('approvedAt')?.toMillis?.() ?? 0)).slice(0, SHOWCASE_ITEMS);
  const items = (await Promise.all(sorted.map(async (r) => {
    const vs = await r.ref.collection('versions').where('approval.state', '==', 'approved').get();
    const v = vs.docs.filter((x) => x.get('published') === true).sort((a, b) => Number(b.get('n')) - Number(a.get('n')))[0];
    if (!v) return null;
    const all = ((v.get('files') as Array<{ name: string; contentType: string; storagePath?: string; url?: string }>) ?? [])
      .filter((f) => /^(image|video)\//.test(f.contentType ?? '') || f.contentType === 'application/pdf');
    const files = await Promise.all(all.slice(0, 6).map(async (f) => ({
      name: f.name, contentType: f.contentType,
      url: f.url ?? (f.storagePath?.startsWith(`brands/${l.brandId}/`) ? await signed(f.storagePath) : null),
    })));
    return { id: r.id, title: String(r.get('title') ?? ''), approvedAt: r.get('approvedAt')?.toDate?.().toISOString() ?? null, total: all.length, files: files.filter((f) => f.url) };
  }))).filter((x) => x && x.files.length);
  c.header('Cache-Control', 'no-store');
  return c.json({ brand: brandOut(l.brand), label: l.link.get('label') ?? '', items });
});
