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

/**
 * Whether the page lets Braindy show it inside the app (an iframe): no X-Frame-Options, and a CSP frame-ancestors
 * that is absent or names * or a braindy host. Read from the final response headers.
 */
function embeddable(h: Headers) {
  if (h.get('x-frame-options')) return false;
  const fa = /frame-ancestors([^;]*)/i.exec(h.get('content-security-policy') ?? '')?.[1];
  return fa == null || /(^|\s)\*(\s|$)|braindy/i.test(fa);
}

/** The og:image of an https page (null when none) and whether it can be shown inside the app (null when unknown). */
export async function readLinkMeta(pageUrl: string): Promise<{ ogImage: string | null; embeddable: boolean | null }> {
  let url: URL;
  try { url = new URL(pageUrl); } catch { return { ogImage: null, embeddable: null }; }
  if (url.protocol !== 'https:' || BLOCKED.test(url.hostname)) return { ogImage: null, embeddable: null };
  const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'BraindyBot/1.0 (+https://braindy.co)', Accept: 'text/html' } }).catch(() => null);
  if (!res?.ok || !res.body) return { ogImage: null, embeddable: res ? embeddable(res.headers) : null };
  const frame = embeddable(res.headers);
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
  if (!raw) return { ogImage: null, embeddable: frame };
  try {
    const img = new URL(raw.replace(/&amp;/g, '&'), res.url || url);
    return { ogImage: img.protocol === 'https:' ? img.toString() : null, embeddable: frame };
  } catch { return { ogImage: null, embeddable: frame }; }
}


export const adminLinks = new Hono<AuthEnv>();

/** Refreshes the preview image of one brand link and whether it opens inside the app (called after the admin adds or edits it). */
adminLinks.post('/brands/:brandId/links/:linkId/preview', async (c) => {
  const { brandId, linkId } = c.req.param();
  if (!(await brandAccess(c.get('user').uid, brandId)).admin) return c.json({ error: 'forbidden' }, 403);
  const ref = db.doc(`brands/${brandId}/links/${linkId}`);
  const link = await ref.get();
  if (!link.exists) return c.json({ error: 'not_found' }, 404);
  const { ogImage, embeddable } = await readLinkMeta(String(link.get('url') ?? ''));
  await ref.update({ ogImage, embeddable, ogCheckedAt: FieldValue.serverTimestamp() });
  return c.json({ ogImage, embeddable });
});

/**
 * Anyone in the brand: whether a link opens inside the app. Links saved before this check get it the first time
 * someone opens them, and it is kept on the link.
 */
adminLinks.get('/brands/:brandId/links/:linkId/frame', async (c) => {
  const { brandId, linkId } = c.req.param();
  if (!(await brandAccess(c.get('user').uid, brandId)).member) return c.json({ error: 'forbidden' }, 403);
  const ref = db.doc(`brands/${brandId}/links/${linkId}`);
  const link = await ref.get();
  if (!link.exists) return c.json({ error: 'not_found' }, 404);
  if (typeof link.get('embeddable') === 'boolean') return c.json({ embeddable: link.get('embeddable') });
  const { embeddable } = await readLinkMeta(String(link.get('url') ?? ''));
  if (embeddable !== null) await ref.update({ embeddable });
  return c.json({ embeddable });
});
