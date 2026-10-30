// Granola folders are the client folders: "Sanuteam - Branding", "Ipark + Braindy"... Each top-level folder is matched to a
// brand once (by name, or chosen by hand in granolaFolders/{id}) and every note inside it, past and future, is filed there.
// The folder wins over participant/title matching. Runs on the admin sync and, throttled, when NickMark opens a brand's Home.
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { API, KEY, fileNote, getNote, matchBrand } from './granola.js';

type Folder = { id: string; name: string; parent_folder_id: string | null };
const MIN_GAP = 10 * 60_000;

async function page<T>(path: string, key: 'folders' | 'notes', params: Record<string, string> = {}) {
  const out: T[] = [];
  let cursor: string | null = null;
  for (let i = 0; i < 30; i++) {
    const q = new URLSearchParams({ page_size: '30', ...params, ...(cursor ? { cursor } : {}) });
    const r = await fetch(`${API}${path}?${q}`, { headers: { Authorization: `Bearer ${KEY}` }, signal: AbortSignal.timeout(15_000) });
    if (!r.ok) throw new Error(`granola_${r.status}`);
    const j = (await r.json()) as Record<string, unknown> & { hasMore: boolean; cursor: string | null };
    out.push(...((j[key] as T[]) ?? []));
    if (!j.hasMore || !j.cursor) break;
    cursor = j.cursor;
  }
  return out;
}

/** Folder → brand: a hand-picked brand stays; otherwise the brand whose name is in the folder name. Child folders follow their parent. */
async function folderBrands(folders: Folder[]) {
  const top = new Map<string, string | null>();
  for (const f of folders.filter((x) => !x.parent_folder_id)) {
    const ref = db.doc(`granolaFolders/${f.id}`);
    const saved = await ref.get();
    const brandId = saved.get('manual') ? (saved.get('brandId') as string | null) : await matchBrand(f.name, []);
    await ref.set({ name: f.name.slice(0, 160), brandId: brandId ?? null, seenAt: FieldValue.serverTimestamp() }, { merge: true });
    top.set(f.id, brandId ?? null);
  }
  return folders.map((f) => ({ ...f, brandId: top.get(f.parent_folder_id ?? f.id) ?? null })).filter((f) => !f.parent_folder_id);
}

/** Files every note of every matched folder under its brand (idempotent). Skips if it ran less than 10 minutes ago unless forced. */
export async function syncFolders(force = false) {
  if (!KEY) return null;
  const state = db.doc('granolaSync/folders');
  const last = (await state.get()).get('at')?.toMillis?.() ?? 0;
  if (!force && Date.now() - last < MIN_GAP) return { skipped: true };
  await state.set({ at: FieldValue.serverTimestamp() }, { merge: true });
  const folders = await folderBrands(await page<Folder>('/folders', 'folders'));
  const report = { folders: folders.length, matched: 0, filed: 0, unmatched: [] as string[] };
  for (const f of folders) {
    if (!f.brandId) { report.unmatched.push(f.name); continue; }
    report.matched++;
    for (const n of await page<{ id: string }>('/notes', 'notes', { folder_id: f.id })) {
      const note = await getNote(n.id);
      if (note && (await fileNote(note, f.brandId, true)).status === 'filed') report.filed++;
    }
  }
  return report;
}
