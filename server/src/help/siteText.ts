// The assistant reads the visible text of one of the brand's own sites, so it can talk about it (ideas, alternatives,
// what to improve) before anything is asked for. Only https pages on a host the brand has in «Sites and apps».
import { db } from '../firebase.js';
import type { ActCtx } from './actions.js';

const MAX = 6000;
const strip = (html: string) => html
  .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<br\s*\/?>|<\/(p|div|h[1-6]|li|section|header|footer|a|button)>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();

export async function siteText(c: ActCtx, i: Record<string, unknown>): Promise<{ text: string }> {
  if (!c.access.admin && !c.access.sections.includes('apps')) return { text: 'SIN_ACCESO: esta persona no tiene abierta la sección «apps».' };
  const raw = String(i.url || c.site || '').trim();
  let url: URL;
  try { url = new URL(raw); } catch { return { text: 'No sé qué página leer: pregúntale a la persona cuál sitio, o usa «sitios».' }; }
  if (url.protocol !== 'https:') return { text: 'Solo puedo leer páginas https de la marca.' };
  const snap = await db.collection(`brands/${c.brandId}/links`).where('section', '==', 'apps').get();
  const hosts = new Set(snap.docs.map((d) => { try { return new URL(String(d.get('url'))).hostname.replace(/^www\./, ''); } catch { return ''; } }).filter(Boolean));
  if (!hosts.has(url.hostname.replace(/^www\./, ''))) return { text: 'Esa página no es de un sitio de esta marca en Braindy.' };
  try {
    // Redirects are followed by hand (up to 3), each one checked against the brand's hosts before it is requested.
    let at = url;
    let r = await fetch(at, { signal: AbortSignal.timeout(8000), redirect: 'manual', headers: { 'User-Agent': 'BraindyAssistant/1.0', Accept: 'text/html' } });
    for (let hop = 0; hop < 3 && r.status >= 300 && r.status < 400 && r.headers.get('location'); hop++) {
      at = new URL(r.headers.get('location')!, at);
      if (at.protocol !== 'https:' || !hosts.has(at.hostname.replace(/^www\./, ''))) return { text: 'La página redirige fuera del sitio de la marca.' };
      r = await fetch(at, { signal: AbortSignal.timeout(8000), redirect: 'manual', headers: { 'User-Agent': 'BraindyAssistant/1.0', Accept: 'text/html' } });
    }
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('html')) return { text: `No pude leer la página (${r.status}).` };
    const body = strip((await r.text()).slice(0, 400_000));
    if (body.length < 40) return { text: 'La página no trae texto legible sin abrirla en un navegador; pídele a la persona que te copie el texto.' };
    return { text: `Texto visible de ${at.href} (en orden, el principio es lo de arriba de la página):\n${body.slice(0, MAX)}` };
  } catch {
    return { text: 'No pude abrir la página ahora.' };
  }
}
