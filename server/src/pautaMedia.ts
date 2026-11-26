// Pauta pieces (2026-11-25): the copies kept in Braindy are private; whoever sees the brand's Pauta gets short-lived links.
import { Hono } from 'hono';
import { getStorage } from 'firebase-admin/storage';
import { db } from './firebase.js';
import { brandAccess } from './access.js';
import type { AuthEnv } from './auth.js';

const bucket = () => getStorage().bucket(process.env.FILES_BUCKET ?? 'braindy-app-files');
const TTL_MS = 6 * 3600_000;
export const pautaMedia = new Hono<AuthEnv>();

pautaMedia.get('/brands/:brandId/pauta/media', async (c) => {
  const { brandId } = c.req.param();
  const access = await brandAccess(c.get('user').uid, brandId);
  if (!access.member || !access.sections.includes('files')) return c.json({ error: 'forbidden' }, 403);
  const snap = await db.collection(`brands/${brandId}/adCampaigns`).get();
  const paths = new Set<string>();
  for (const d of snap.docs) {
    for (const ad of (d.get('ads') as Array<{ creatives?: Array<{ path?: string; thumbPath?: string }> }> | undefined) ?? []) {
      for (const cr of ad.creatives ?? []) for (const p of [cr.path, cr.thumbPath]) if (p?.startsWith(`brands/${brandId}/pauta/`)) paths.add(p);
    }
  }
  const urls: Record<string, string> = {};
  const expires = Date.now() + TTL_MS;
  await Promise.all([...paths].slice(0, 400).map(async (p) => {
    const [url] = await bucket().file(p).getSignedUrl({ version: 'v4', action: 'read', expires });
    urls[p] = url;
  }));
  return c.json({ urls, expires });
});
