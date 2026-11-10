// Brand versions (rebranding, Nicolas 2026-11-10): the same brand, a new chapter. Nothing is lost: requests, files,
// members and links stay on the same brand id. Opening a new version freezes Mi marca as it is today (identity, voice,
// strategy, primal branding and what the Brains learned) in brands/{id}/versions/{versionId}, read-only for the client,
// and leaves Mi marca ready for the new identity. The Brains only read the current version (see brains/context.ts).
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { Hono } from 'hono';
import { brandAccess } from './access.js';
import type { AuthEnv } from './auth.js';
import { recordBrainEvent } from './brains/brainEvents.js';
import { db } from './firebase.js';

type Restart = { voice?: boolean; strategy?: boolean; primal?: boolean };
/** Strategy fields that belong to the old brand; the Criterio and the signature stay with the client. */
const STRATEGY = ['position', 'audiences', 'goals', 'avoid', 'competitors', 'voice', 'status'] as const;

export async function openBrandVersion(brandId: string, newName: string, restart: Restart, by: string) {
  const brand = db.doc(`brands/${brandId}`);
  const ctx = (id: string) => db.doc(`brands/${brandId}/context/${id}`);
  const [b, identity, voice, brain, primal, learnings, last] = await Promise.all([
    brand.get(), ctx('identity').get(), ctx('voice').get(), ctx('brain').get(), ctx('primal').get(), ctx('learnings').get(),
    db.collection(`brands/${brandId}/versions`).orderBy('to', 'desc').limit(1).get(),
  ]);
  if (!b.exists) throw new Error('not_found');
  const oldName = String(b.get('name') ?? brandId);
  const now = Timestamp.now();
  const from = (last.docs[0]?.get('to') as Timestamp | undefined) ?? (b.get('createdAt') as Timestamp | undefined) ?? null;
  const ref = db.collection(`brands/${brandId}/versions`).doc();
  const batch = db.batch();
  batch.set(ref, {
    name: oldName, logoUrl: b.get('logoUrl') ?? null, from, to: now,
    identity: identity.data() ?? null, voice: voice.data() ?? null, brain: brain.data() ?? null,
    primal: primal.data() ?? null, learnings: learnings.data() ?? null, createdBy: by,
  });
  // The new chapter starts clean where the old identity would mislead the Brains.
  batch.delete(ctx('identity'));
  batch.delete(ctx('learnings'));
  if (restart.voice) batch.delete(ctx('voice'));
  if (restart.primal) batch.delete(ctx('primal'));
  if (restart.strategy && brain.exists) batch.update(ctx('brain'), Object.fromEntries(STRATEGY.map((k) => [k, FieldValue.delete()])));
  batch.update(brand, {
    name: newName, logoUrl: null, rebrandedAt: now,
    ...(oldName !== newName ? { previousNames: FieldValue.arrayUnion(oldName) } : {}),
  });
  await batch.commit();
  await recordBrainEvent(brandId, { kind: 'identity', area: 'identity', parts: ['version'], text: oldName === newName ? newName : `${oldName} → ${newName}` });
  return { versionId: ref.id, oldName };
}

export const adminBrandVersions = new Hono<AuthEnv>();

/** Opens a new version of the brand (admin): body { name, restart: { voice, strategy, primal } }. */
adminBrandVersions.post('/brands/:brandId/versions', async (c) => {
  const { brandId } = c.req.param();
  const uid = c.get('user').uid;
  if (!(await brandAccess(uid, brandId)).admin) return c.json({ error: 'forbidden' }, 403);
  const body = await c.req.json<{ name?: string; restart?: Restart }>().catch(() => ({} as { name?: string; restart?: Restart }));
  const name = String(body.name ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
  if (!name) return c.json({ error: 'name_required' }, 400);
  try {
    return c.json(await openBrandVersion(brandId, name, body.restart ?? {}, uid));
  } catch (e) {
    return c.json({ error: (e as Error).message }, (e as Error).message === 'not_found' ? 404 : 400);
  }
});
