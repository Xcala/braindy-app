// Requests from the Braindy connector: list open ones, create one, and deliver a version (files + notes) that goes
// straight to the client for approval, signed by NickMark. Same records and logic as the app (requests.ts).
import { randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { bucket, createRequest, publishVersion } from '../requests.js';
import { contentTypeOf } from '../lib/mime.js';

export type FileWriter = { name: string; size: number; write: (file: ReturnType<ReturnType<typeof bucket>['file']>, contentType: string) => Promise<void> };

export async function listRequests(brandId: string, all = false) {
  const snap = await db.collection(`brands/${brandId}/requests`).orderBy('createdAt', 'desc').limit(40).get();
  return snap.docs.map((d) => ({ id: d.id, title: String(d.get('title') ?? ''), status: String(d.get('status') ?? ''), stage: String(d.get('stage') ?? ''), versionCount: Number(d.get('versionCount') ?? 0), dueDate: d.get('dueDate') ?? null }))
    .filter((r) => all || r.status === 'in_production' || r.status === 'to_approve');
}

export async function newRequest(brandId: string, uid: string, r: { text: string; title?: string; category?: string; dueDate?: string; links?: string[] }) {
  const out = await createRequest(brandId, uid, {
    title: r.title ?? r.text.split('\n')[0].slice(0, 80), category: r.category ?? '', dueDate: r.dueDate ?? '',
    cards: { product: { text: r.text, links: r.links ?? [] } }, language: 'Español',
  });
  if ('error' in out) throw new Error(out.error === 'invalid_category' ? 'Categoría desconocida: déjala vacía y la app la deduce del texto.' : out.error);
  return out.requestId;
}

/** Creates version n+1 with the given files, uploads them and publishes it to the client. */
export async function deliverVersion(brandId: string, requestId: string, uid: string, files: FileWriter[], notes: string) {
  if (!files.length) throw new Error('Una versión necesita al menos un archivo.');
  if (files.length > 20) throw new Error('Máximo 20 archivos por versión.');
  const reqRef = db.doc(`brands/${brandId}/requests/${requestId}`);
  const n = await db.runTransaction(async (tx) => {
    const r = await tx.get(reqRef);
    if (!r.exists) throw new Error(`No existe la solicitud ${requestId} en esta marca.`);
    const next = Number(r.get('versionCount') ?? 0) + 1;
    tx.update(reqRef, { versionCount: next });
    return next;
  });
  const stored = [];
  for (const f of files) {
    const name = f.name.replace(/[\\/\r\n]/g, '_').slice(0, 200);
    const contentType = contentTypeOf(name);
    const storagePath = `brands/${brandId}/requests/${requestId}/v${n}/${randomUUID()}-${name}`;
    await f.write(bucket().file(storagePath), contentType);
    stored.push({ name, contentType, size: f.size, storagePath });
  }
  await reqRef.collection('versions').doc(`v${n}`).set({
    n, files: stored, notes: notes.slice(0, 4000), reason: '', brain: null, via: 'connector',
    published: false, approval: { state: 'pending' }, createdAt: FieldValue.serverTimestamp(), createdBy: uid,
  });
  const r = await publishVersion(brandId, requestId, `v${n}`, uid);
  if ('error' in r) throw new Error(`La versión v${n} quedó guardada pero no se publicó (${r.error}).`);
  return { n, notice: r.notice };
}
