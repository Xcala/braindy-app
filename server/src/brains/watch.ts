// The Researcher watches the competitors listed in the Brand Brain: reads each site, keeps a fingerprint and,
// when the page changes, writes an insight (what changed in price, promise or offer). Public pages only:
// no private hosts (SSRF guard), short timeout, text only.
import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { runBrain } from './run.js';

const PRIVATE = [/^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^169\.254\./, /^0\./, /^::1$/, /^f[cd]/i, /^fe80/i];

async function safeUrl(raw: string): Promise<URL | null> {
  let u: URL;
  try { u = new URL(raw.startsWith('http') ? raw : `https://${raw}`); } catch { return null; }
  if (!['http:', 'https:'].includes(u.protocol) || /(^|\.)(localhost|internal|local)$/i.test(u.hostname)) return null;
  const addrs = isIP(u.hostname) ? [u.hostname] : (await lookup(u.hostname, { all: true }).catch(() => [])).map((a) => a.address);
  return addrs.length && !addrs.some((a) => PRIVATE.some((p) => p.test(a))) ? u : null;
}

async function pageText(start: URL) {
  // Redirects are followed by hand (max 3) so every hop goes through the private-host check again.
  let u: URL | null = start; let r: Response | null = null;
  for (let hop = 0; u && hop < 4; hop++) {
    r = await fetch(u, { redirect: 'manual', signal: AbortSignal.timeout(10_000), headers: { 'User-Agent': 'BraindyResearcher/1.0 (+https://braindy.co)' } });
    const loc = r.status >= 300 && r.status < 400 ? r.headers.get('location') : null;
    if (!loc) break;
    u = await safeUrl(new URL(loc, u).href);
    if (!u) return null;
  }
  if (!r) return null;
  if (!r.ok || !String(r.headers.get('content-type')).includes('html')) return null;
  const html = (await r.text()).slice(0, 600_000);
  return html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 20_000);
}

export async function watchCompetitors(brandId: string) {
  const comps = (((await db.doc(`brands/${brandId}/context/brain`).get()).get('competitors') as Array<{ name?: string; url?: string }>) ?? []).filter((c) => c.url);
  const results: Array<{ name: string; status: string }> = [];
  const es = (await db.doc(`brands/${brandId}/settings/notices`).get()).get('lang') !== 'en';
  for (const c of comps.slice(0, 8)) {
    const name = String(c.name || c.url);
    const u = await safeUrl(String(c.url));
    if (!u) { results.push({ name, status: 'invalid_url' }); continue; }
    const text = await pageText(u).catch(() => null);
    if (!text) { results.push({ name, status: 'unreachable' }); continue; }
    const hash = createHash('sha256').update(text).digest('hex');
    const ref = db.doc(`brands/${brandId}/watch/${createHash('sha1').update(u.href).digest('hex').slice(0, 20)}`);
    const prev = await ref.get();
    await ref.set({ name, url: u.href, hash, excerpt: text.slice(0, 6000), checkedAt: FieldValue.serverTimestamp() });
    if (!prev.exists) { results.push({ name, status: 'baseline' }); continue; }
    if (prev.get('hash') === hash) { results.push({ name, status: 'unchanged' }); continue; }
    const { output, ai } = await runBrain<{ title: string; body: string }>({
      brain: 'researcher', brandId, kind: 'watch', title: `Competitor: ${name}`,
      ask: `The website of competitor "${name}" (${u.href}) changed. Before (excerpt):\n${String(prev.get('excerpt')).slice(0, 3500)}\n\nNow (excerpt):\n${text.slice(0, 3500)}
Return {"title": "one line: what changed (price, promise, offer, product)", "body": "two or three lines: what it means for the brand and what you suggest; say 'minor change' if nothing relevant changed"}.`,
      fallback: () => (es
        ? { title: `${name} cambió su sitio web`, body: 'Revisa qué cambió en precio, promesa u oferta.' }
        : { title: `${name} changed its website`, body: 'Review what changed in price, promise or offer.' }),
    });
    await db.collection(`brands/${brandId}/insights`).doc().set({
      brain: 'researcher', kind: 'competitor_change', title: String(output.title).slice(0, 200), body: String(output.body).slice(0, 1200),
      url: u.href, ai, at: FieldValue.serverTimestamp(),
    });
    results.push({ name, status: 'changed' });
  }
  return results;
}
