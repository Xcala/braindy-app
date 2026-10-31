// Search inside a brand's files from the "Search everything" box. Firestore cannot match words inside titles,
// so the titles of a brand are kept here for a few minutes and matched in memory. Clients only get the files
// of the folders NickMark shares with them (same filter as the download URLs).
import { Hono } from 'hono';
import { db } from './firebase.js';
import { brandAccess, fileFilter } from './access.js';
import type { AuthEnv } from './auth.js';

type Row = { id: string; title: string; folder: string; contentType: string; key: string; snap: FirebaseFirestore.DocumentSnapshot };
const TTL_MS = 5 * 60 * 1000;
const LIMIT = 30;
const cache = new Map<string, { at: number; rows: Row[] }>();
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

async function rowsOf(brandId: string): Promise<Row[]> {
  const hit = cache.get(brandId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.rows;
  const s = await db.collection(`brands/${brandId}/assets`).select('title', 'folder', 'contentType', 'status', 'source').get();
  const rows = s.docs.filter((d) => d.get('status') !== 'uploading').map((d) => {
    const title = String(d.get('title') ?? ''), folder = String(d.get('folder') ?? '');
    return { id: d.id, title, folder, contentType: String(d.get('contentType') ?? ''), key: norm(`${title} ${folder}`), snap: d };
  });
  cache.set(brandId, { at: Date.now(), rows });
  return rows;
}

export const search = new Hono<AuthEnv>();

/** Files whose name or folder contains every word of q (accents and case ignored); titles first. */
search.get('/brands/:brandId/search/files', async (c) => {
  const { brandId } = c.req.param();
  const access = await brandAccess(c.get('user').uid, brandId);
  if (!access.member || !access.sections.includes('files')) return c.json({ files: [] });
  const words = norm(String(c.req.query('q') ?? '')).split(/\s+/).filter((w) => w.length > 1).slice(0, 6);
  if (!words.length) return c.json({ files: [] });

  const visible = access.admin ? () => true : await fileFilter(brandId);
  const found = (await rowsOf(brandId)).filter((r) => words.every((w) => r.key.includes(w)) && visible(r.snap));
  const inTitle = (r: Row) => (words.every((w) => norm(r.title).includes(w)) ? 0 : 1);
  found.sort((a, b) => inTitle(a) - inTitle(b) || a.title.localeCompare(b.title));
  return c.json({
    total: found.length,
    files: found.slice(0, LIMIT).map(({ id, title, folder, contentType }) => ({ id, title, folder, contentType })),
  });
});
