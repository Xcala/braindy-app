// The brand's social media calendar, mirrored from Metricool by the Braindy connector (Metricool keeps publishing).
// One document per Metricool post in brands/{brandId}/socialPosts; clients only read it.
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase.js';

export type PostStatus = 'scheduled' | 'published' | 'error' | 'draft';
export interface SocialPostInput {
  id: string; date: string; text?: string; title?: string; type?: string; draft?: boolean;
  networks: Array<{ network: string; status?: string; url?: string }>;
  media?: string[]; thumb?: string;
}

const NETWORKS = ['instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'twitter', 'threads', 'pinterest', 'bluesky', 'gmb', 'twitch'];
const httpsUrl = (u?: string) => (u && /^https:\/\//i.test(u) ? u.slice(0, 600) : '');
const netStatus = (s?: string) => (/publish/i.test(s ?? '') ? 'published' : /error|fail/i.test(s ?? '') ? 'error' : 'scheduled');

/** Overall state: draft, error if any network failed, published when all went out, else scheduled. */
function overall(p: SocialPostInput, nets: Array<{ status: string }>): PostStatus {
  if (p.draft) return 'draft';
  if (nets.some((n) => n.status === 'error')) return 'error';
  return nets.length && nets.every((n) => n.status === 'published') ? 'published' : 'scheduled';
}

/** Upserts the posts of a date range; posts of that range that are no longer in Metricool are removed. */
export async function syncSocialPosts(brandId: string, posts: SocialPostInput[], range: { from: string; to: string }, metricoolBrand?: string) {
  const from = new Date(range.from), to = new Date(range.to);
  if (isNaN(+from) || isNaN(+to) || to <= from) throw new Error('Rango inválido: from y to deben ser fechas ISO con from < to.');
  const col = db.collection(`brands/${brandId}/socialPosts`);
  const inRange = await col.where('date', '>=', Timestamp.fromDate(from)).where('date', '<=', Timestamp.fromDate(to)).get();
  const existing = new Map(inRange.docs.map((d) => [d.id, d.data()]));
  const writer = db.bulkWriter();
  const seen = new Set<string>();
  let created = 0, updated = 0, removed = 0;
  for (const p of posts) {
    const id = String(p.id).replace(/[^\w-]/g, '').slice(0, 60);
    const when = new Date(p.date);
    if (!id || seen.has(id) || isNaN(+when)) continue;
    seen.add(id);
    const networks = (p.networks ?? []).map((n) => ({ network: NETWORKS.includes(n.network?.toLowerCase()) ? n.network.toLowerCase() : 'other', status: netStatus(n.status), url: httpsUrl(n.url) })).slice(0, 12);
    const media = (p.media ?? []).map(httpsUrl).filter(Boolean).slice(0, 10).map((url) => ({ url, kind: /\.(mp4|mov|webm)(\?|$)/i.test(url) ? 'video' : 'image' }));
    const data = {
      date: Timestamp.fromDate(when), text: String(p.text ?? '').slice(0, 5000), title: String(p.title ?? '').slice(0, 200),
      type: String(p.type ?? 'POST').toUpperCase().slice(0, 20), networks, media, thumb: httpsUrl(p.thumb), status: overall(p, networks), source: 'metricool',
    };
    const prev = existing.get(id);
    if (prev && JSON.stringify({ ...prev, updatedAt: null, createdAt: null }) === JSON.stringify({ ...prev, ...data, updatedAt: null, createdAt: null })) continue;
    writer.set(col.doc(id), { ...data, updatedAt: FieldValue.serverTimestamp(), ...(prev ? {} : { createdAt: FieldValue.serverTimestamp() }) }, { merge: true });
    if (prev) updated++; else created++;
  }
  for (const id of existing.keys()) if (!seen.has(id)) { writer.delete(col.doc(id)); removed++; }
  await writer.close();
  await db.doc(`brands/${brandId}`).set({ socialAt: FieldValue.serverTimestamp(), ...(metricoolBrand ? { metricoolBrand } : {}) }, { merge: true });
  return { total: seen.size, created, updated, unchanged: seen.size - created - updated, removed };
}
