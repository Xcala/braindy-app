// Search inside a brand's files from the "Search everything" box. Besides name and folder it matches what the AI
// saw in the file (asset.ai: summary, tags, visible text; written by scripts/describe-files.ts), like Air's search. Firestore cannot match words inside titles,
// so the titles of a brand are kept here for a few minutes and matched in memory. Clients only get the files
// of the folders NickMark shares with them (same filter as the download URLs).
import { Hono } from 'hono';
import { db } from './firebase.js';
import { brandAccess, fileFilter } from './access.js';
import type { AuthEnv } from './auth.js';

type Row = { id: string; title: string; folder: string; contentType: string; size: number; mtimeMs?: number; key: string; seen: string; snap: FirebaseFirestore.DocumentSnapshot };
const TTL_MS = 5 * 60 * 1000;
const LIMIT = 30;
const cache = new Map<string, { at: number; rows: Row[] }>();
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

async function rowsOf(brandId: string): Promise<Row[]> {
  const hit = cache.get(brandId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.rows;
  const s = await db.collection(`brands/${brandId}/assets`).select('title', 'folder', 'contentType', 'status', 'source', 'size', 'mtimeMs', 'ai').get();
  const rows = s.docs.filter((d) => d.get('status') !== 'uploading').map((d) => {
    const title = String(d.get('title') ?? ''), folder = String(d.get('folder') ?? '');
    const ai = (d.get('ai') ?? {}) as { summary?: string; tags?: string[]; text?: string };
    const seen = norm([ai.summary, ...(ai.tags ?? []), ai.text].filter(Boolean).join(' '));
    return { id: d.id, title, folder, contentType: String(d.get('contentType') ?? ''), size: Number(d.get('size') ?? 0), mtimeMs: d.get('mtimeMs') as number | undefined, key: norm(`${title} ${folder}`), seen, snap: d };
  });
  cache.set(brandId, { at: Date.now(), rows });
  return rows;
}

/** Called after a file is added, renamed, moved or trashed, so search sees it right away. */
export const forgetSearch = (brandId: string) => { cache.delete(brandId); };

export const search = new Hono<AuthEnv>();

/** Files whose name, folder or AI description contains every word of q (accents and case ignored); titles first, then names, then what the file shows. */
search.get('/brands/:brandId/search/files', async (c) => {
  const { brandId } = c.req.param();
  const access = await brandAccess(c.get('user').uid, brandId);
  if (!access.member || !access.sections.includes('files')) return c.json({ files: [] });
  return c.json(await searchFiles(brandId, access.admin, String(c.req.query('q') ?? ''), Number(c.req.query('limit')) === 100 ? 100 : LIMIT));
});

/** The search itself (the box and the chat assistant). The caller checks the person can open Files. */
export async function searchFiles(brandId: string, admin: boolean, q: string, limit = LIMIT) {
  const words = norm(q).split(/\s+/).filter((w) => w.length > 1).slice(0, 6);
  if (!words.length) return { total: 0, files: [] };
  const visible = admin ? () => true : await fileFilter(brandId);
  const byName = (r: Row) => words.every((w) => r.key.includes(w));
  const found = (await rowsOf(brandId)).filter((r) => (byName(r) || words.every((w) => `${r.key} ${r.seen}`.includes(w))) && visible(r.snap));
  const inTitle = (r: Row) => (words.every((w) => norm(r.title).includes(w)) ? 0 : byName(r) ? 1 : 2);
  found.sort((a, b) => inTitle(a) - inTitle(b) || a.title.localeCompare(b.title));
  return {
    total: found.length,
    files: found.slice(0, limit).map((r) => ({ id: r.id, title: r.title, folder: r.folder, contentType: r.contentType, size: r.size, mtimeMs: r.mtimeMs, ...(byName(r) ? {} : { why: 'ai' }) })),
  };
}
