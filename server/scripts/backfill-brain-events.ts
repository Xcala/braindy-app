// Fills the Brand Brain feed (brands/{id}/brainEvents) from what each brand already taught the Brains: its requests,
// approvals and change requests (context/learnings), files uploaded, Granola meetings and Mi marca as it stands today.
// Idempotent (fixed ids, same ids the live hooks use); --dry-run counts without writing; --brand=<id> limits to one brand.
import { db } from '../src/firebase.js';
import { identityEvents, recordBrainEvent, type BrainEventInput } from '../src/brains/brainEvents.js';

const dry = process.argv.includes('--dry-run');
const only = process.argv.find((a) => a.startsWith('--brand='))?.slice(8);
const toDate = (v: unknown): Date | undefined => {
  if (!v) return undefined;
  if (typeof v === 'string') { const d = new Date(v); return isNaN(+d) ? undefined : d; }
  const t = v as { toDate?: () => Date };
  return t.toDate ? t.toDate() : undefined;
};
const totals: Record<string, number> = {};
let brands = 0;

const ids = only ? [only] : (await db.collection('brands').select().get()).docs.map((d) => d.id);
for (const brandId of ids) {
  const out: BrainEventInput[] = [];
  const [requests, learnings, assets, meetings, identity, voice, brain, primal] = await Promise.all([
    db.collection(`brands/${brandId}/requests`).select('title', 'formatType', 'createdAt').get(),
    db.doc(`brands/${brandId}/context/learnings`).get(),
    db.collection(`brands/${brandId}/assets`).where('source', '==', 'upload').select('title', 'uploadedAt', 'createdAt', 'status').get(),
    db.collection(`brands/${brandId}/meetings`).select('date').get(),
    db.doc(`brands/${brandId}/context/identity`).get(),
    db.doc(`brands/${brandId}/context/voice`).get(),
    db.doc(`brands/${brandId}/context/brain`).get(),
    db.doc(`brands/${brandId}/context/primal`).get(),
  ]);
  for (const r of requests.docs) {
    out.push({ id: `req-${r.id}`, kind: 'request', area: 'work', text: String(r.get('title') || r.get('formatType') || ''), requestId: r.id, at: toDate(r.get('createdAt')) });
  }
  // Learnings carry no version id: a stable id from the request and the moment it was learned.
  for (const l of (learnings.get('items') as Array<{ kind: string; text: string; requestId?: string; at?: string }>) ?? []) {
    const at = toDate(l.at);
    out.push({ id: `learn-${l.requestId ?? 'x'}-${at ? +at : l.text.length}`, kind: l.kind === 'liked' ? 'approved' : 'changed', area: 'work', text: l.text, requestId: l.requestId, at });
  }
  for (const a of assets.docs) {
    if (a.get('status') !== 'published') continue;
    out.push({ id: `file-${a.id}`, kind: 'file', area: 'work', text: String(a.get('title') ?? ''), count: 1, at: toDate(a.get('uploadedAt') ?? a.get('createdAt')) });
  }
  for (const m of meetings.docs) {
    const date = String(m.get('date') ?? '');
    out.push({ id: `meet-${m.id}`, kind: 'meeting', area: 'talks', at: /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00Z`) : undefined });
  }
  // Mi marca as it stands: one event per area, dated by its last update.
  const parts: string[] = [];
  const id = identity.data() ?? {};
  if (id.logos) parts.push('logos');
  for (const k of ['colors', 'typography', 'concept'] as const) if (Array.isArray(id[k]) && id[k].length) parts.push(k);
  if (Array.isArray(id.galleryAssets) && id.galleryAssets.length) parts.push('mockups');
  if (voice.exists) parts.push('voice');
  if (brain.get('position') || brain.get('goals') || brain.get('audiences')) parts.push('strategy');
  if (brain.get('avoid') || brain.get('criterio')) parts.push('avoid');
  if (primal.exists) parts.push('primal');
  const idAt = toDate(id.updatedAt) ?? toDate(id.createdAt);
  for (const ev of identityEvents(parts)) out.push({ id: `brand-${ev.area}`, kind: 'identity', ...ev, at: idAt });
  if (brain.get('status') === 'signed') out.push({ id: `signed-v${brain.get('version') ?? 1}`, kind: 'signed', area: 'strategy', at: toDate(brain.get('signedAt')) });

  if (!out.length) continue;
  brands++;
  const by = out.reduce<Record<string, number>>((m, e) => ({ ...m, [e.kind]: (m[e.kind] ?? 0) + 1 }), {});
  for (const [k, n] of Object.entries(by)) totals[k] = (totals[k] ?? 0) + n;
  console.log(`${brandId}: ${out.length} · ${Object.entries(by).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
  if (!dry) for (const e of out) await recordBrainEvent(brandId, e);
}
console.log(`${dry ? 'DRY RUN · ' : ''}${brands} marcas · ${Object.entries(totals).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
