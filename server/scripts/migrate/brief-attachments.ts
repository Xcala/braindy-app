// Brings the files clients attached to their requests in the old brief app (steps[].files) into Braindy: each file is
// copied into the brand's bucket as an Uploads asset and listed on the request (cards.product.files), as a new upload is.
// Reads the old database and bucket only. Idempotent (fixed asset ids). Usage: tsx scripts/migrate/brief-attachments.ts [--dry-run]
import { createHash } from 'node:crypto';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { db } from '../../src/firebase.js';

const dry = process.argv.includes('--dry-run');
const old = initializeApp({ credential: applicationDefault(), projectId: 'braindy-brand-guideline' }, 'old');
const brief = getFirestore(old, 'ai-studio-5a30c0b0-483a-4f53-a864-8d0cc7128673'); // read-only
const files = getStorage().bucket(process.env.FILES_BUCKET ?? 'braindy-app-files');
type OldFile = { url?: string; name?: string; type?: string };

let reqs = 0, n = 0;
for (const b of (await db.collection('brands').select().get()).docs) {
  const rs = await db.collection(`brands/${b.id}/requests`).where('legacy.briefRequestId', '!=', null).get();
  for (const r of rs.docs) {
    const o = await brief.doc(`requests/${r.get('legacy.briefRequestId')}`).get();
    const list = ((o.get('steps') ?? []) as Array<{ files?: OldFile[] }>).flatMap((s) => s.files ?? []).filter((f) => f.url);
    if (!list.length) continue;
    reqs++;
    const have = (r.get('cards.product.files') ?? []) as Array<{ assetId: string }>;
    const add: Array<{ assetId: string; name: string; size: number; contentType: string }> = [];
    for (const f of list) {
      const id = `upl-brief-${createHash('sha1').update(f.url!).digest('hex').slice(0, 20)}`;
      const name = String(f.name ?? 'archivo').replace(/[\/\r\n]/g, '_').slice(0, 200);
      const m = /\/b\/([^/]+)\/o\/([^?]+)/.exec(f.url!);
      console.log(`${b.id} · ${r.get('title')} · ${name}${have.some((h) => h.assetId === id) ? ' (ya estaba)' : ''}`);
      n++;
      const data = /^data:([^;]+);base64,(.+)$/.exec(f.url!);
      if (dry || (!m && !data) || have.some((h) => h.assetId === id)) continue;
      const storagePath = `brands/${b.id}/uploads/${id}/${name}`;
      // Some old attachments were saved inline as data: URLs instead of in the bucket.
      if (data) await files.file(storagePath).save(Buffer.from(data[2]!, 'base64'), { contentType: data[1] });
      else await getStorage().bucket(m![1]).file(decodeURIComponent(m![2]!)).copy(files.file(storagePath));
      const [meta] = await files.file(storagePath).getMetadata();
      const contentType = String(f.type || meta.contentType || 'application/octet-stream');
      await db.doc(`brands/${b.id}/assets/${id}`).set({
        type: 'file', source: 'upload', title: name, folder: 'Uploads', storagePath, size: Number(meta.size), contentType,
        status: 'published', uploadedBy: r.get('createdBy') ?? null, createdAt: FieldValue.serverTimestamp(), uploadedAt: FieldValue.serverTimestamp(), fromBrief: r.id,
      });
      add.push({ assetId: id, name, size: Number(meta.size), contentType });
    }
    if (add.length) await r.ref.update({ 'cards.product.files': [...have, ...add] });
  }
}
console.log(`${dry ? 'DRY RUN · ' : ''}${n} adjuntos en ${reqs} pedidos`);
