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

/** How a site can be edited from Braindy: the bridge loaded, and the editor it names (braindy-editor meta). null = unknown. */
export type SiteEditing = { bridge: boolean | null; editor: string | null; /** v3 hands over the Braindy session (braindy:auth). */ bridgeV3: boolean | null };
type LinkMeta = { ogImage: string | null; embeddable: boolean | null } & SiteEditing;
const NONE: LinkMeta = { ogImage: null, embeddable: null, bridge: null, editor: null, bridgeV3: null };

/** Whether the site's copy of the bridge is v3. Same host only; null = could not read it. */
async function bridgeIsV3(src: string | undefined, base: string | URL) {
  try {
    const u = new URL(src ?? '/braindy-bridge.js', base);
    if (u.host !== new URL(base).host) return null;
    const r = await fetch(u, { signal: AbortSignal.timeout(5000), headers: { 'User-Agent': 'BraindyBot/1.0 (+https://braindy.co)' } });
    return r.ok ? (await r.text()).includes('braindy:auth') : null;
  } catch { return null; }
}

/** The og:image of an https page (null when none), whether it can be shown inside the app (null when unknown) and its editing setup. */
export async function readLinkMeta(pageUrl: string): Promise<LinkMeta> {
  let url: URL;
  try { url = new URL(pageUrl); } catch { return NONE; }
  if (url.protocol !== 'https:' || BLOCKED.test(url.hostname)) return NONE;
  const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'BraindyBot/1.0 (+https://braindy.co)', Accept: 'text/html' } }).catch(() => null);
  if (!res?.ok || !res.body) return { ...NONE, embeddable: res ? embeddable(res.headers) : null };
  const frame = embeddable(res.headers);
  // Read the head (meta tags), and on until the bridge script shows up (some sites load it before </body>).
  const reader = res.body.getReader();
  let html = '', size = 0;
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    html += new TextDecoder().decode(value);
    if (/<\/head>/i.test(html) && /braindy-bridge\.js/i.test(html)) break;
  }
  reader.cancel().catch(() => {});
  const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
  const find = (key: string) => metas.find((m) => (attr(m, 'property') ?? attr(m, 'name'))?.toLowerCase() === key);
  const tag = /<script\b[^>]*braindy-bridge\.js[^>]*>/i.exec(html)?.[0];
  const editing: SiteEditing = {
    bridge: !!tag, editor: attr(find('braindy-editor') ?? '', 'content')?.trim() || null,
    bridgeV3: tag ? await bridgeIsV3(attr(tag, 'src'), res.url || url) : false,
  };
  const raw = attr(find('og:image') ?? find('og:image:url') ?? find('twitter:image') ?? '', 'content');
  if (!raw) return { ogImage: null, embeddable: frame, ...editing };
  try {
    const img = new URL(raw.replace(/&amp;/g, '&'), res.url || url);
    return { ogImage: img.protocol === 'https:' ? img.toString() : null, embeddable: frame, ...editing };
  } catch { return { ogImage: null, embeddable: frame, ...editing }; }
}

/** One line for NickMark on whether a site opens in its editor from Braindy, and what is missing if not. */
export function editingReport(m: LinkMeta, hasAuth: boolean) {
  if (m.bridge === null) return 'Edición: no pude leer el sitio para revisar el bridge y el editor.';
  const missing = [
    m.embeddable === false && 'el sitio no deja mostrarse dentro de Braindy (X-Frame-Options / frame-ancestors)',
    !m.bridge ? 'braindy-bridge.js (v3) cargado en todas las páginas'
      : m.bridgeV3 === false && 'actualizar braindy-bridge.js a v3 y definir window.braindySignIn (entrega la sesión de Braindy)',
    !m.editor && '<meta name="braindy-editor" content="…"> (ruta del editor, p. ej. "/admin/editor?p=" o "{path}?edit")',
    !hasAuth && 'editorAuth (proyecto Firebase + cuenta de servicio) para que el cliente no tenga que volver a iniciar sesión',
  ].filter(Boolean);
  return missing.length ? `Edición «Hazlo tú»: falta ${missing.join('; ')}. Ver skill publicar-en-braindy-app, paso «Editable por defecto».`
    : 'Edición «Hazlo tú»: lista (abre en su editor, con la sesión de Braindy).';
}


export const adminLinks = new Hono<AuthEnv>();

/** Refreshes the preview image of one brand link and whether it opens inside the app (called after the admin adds or edits it). */
adminLinks.post('/brands/:brandId/links/:linkId/preview', async (c) => {
  const { brandId, linkId } = c.req.param();
  if (!(await brandAccess(c.get('user').uid, brandId)).admin) return c.json({ error: 'forbidden' }, 403);
  const ref = db.doc(`brands/${brandId}/links/${linkId}`);
  const link = await ref.get();
  if (!link.exists) return c.json({ error: 'not_found' }, 404);
  const { ogImage, embeddable, bridge, bridgeV3, editor } = await readLinkMeta(String(link.get('url') ?? ''));
  await ref.update({ ogImage, embeddable, siteEditing: { bridge, bridgeV3, editor }, ogCheckedAt: FieldValue.serverTimestamp() });
  return c.json({ ogImage, embeddable, bridge, bridgeV3, editor });
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
