// Open Graph preview of a link (the image a site shows when shared). Fetched server-side because the browser
// cannot read other sites. https only, short timeout, first 512 KB, never internal hosts.
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { brandAccess } from './access.js';
import type { AuthEnv } from './auth.js';

const BLOCKED = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[|metadata\.google\.internal)/i;
const MAX_BYTES = 512 * 1024;

const attr = (tag: string, name: string) => new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i').exec(tag)?.[1];

/** The og:image (or twitter:image) of an https page, as an absolute https URL, or null. */
export async function readOgImage(pageUrl: string): Promise<string | null> {
  let url: URL;
  try { url = new URL(pageUrl); } catch { return null; }
  if (url.protocol !== 'https:' || BLOCKED.test(url.hostname)) return null;
  const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'BraindyBot/1.0 (+https://braindy.co)', Accept: 'text/html' } }).catch(() => null);
  if (!res?.ok || !res.body) return null;
  // Read only the start of the page: the meta tags live in <head>.
  const reader = res.body.getReader();
  let html = '', size = 0;
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    html += new TextDecoder().decode(value);
    if (/<\/head>/i.test(html)) break;
  }
  reader.cancel().catch(() => {});
  const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
  const find = (key: string) => metas.find((m) => (attr(m, 'property') ?? attr(m, 'name'))?.toLowerCase() === key);
  const raw = attr(find('og:image') ?? find('og:image:url') ?? find('twitter:image') ?? '', 'content');
  if (!raw) return null;
  try {
    const img = new URL(raw.replace(/&amp;/g, '&'), res.url || url);
    return img.protocol === 'https:' ? img.toString() : null;
  } catch { return null; }
}

export const adminLinks = new Hono<AuthEnv>();

/** Refreshes the preview image of one brand link (called after the admin adds or edits it). */
adminLinks.post('/brands/:brandId/links/:linkId/preview', async (c) => {
  const { brandId, linkId } = c.req.param();
  if (!(await brandAccess(c.get('user').uid, brandId)).admin) return c.json({ error: 'forbidden' }, 403);
  const ref = db.doc(`brands/${brandId}/links/${linkId}`);
  const link = await ref.get();
  if (!link.exists) return c.json({ error: 'not_found' }, 404);
  const ogImage = await readOgImage(String(link.get('url') ?? ''));
  await ref.update({ ogImage: ogImage ?? null, ogCheckedAt: FieldValue.serverTimestamp() });
  return c.json({ ogImage });
});
