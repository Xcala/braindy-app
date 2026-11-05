// What a client approves lands in Files: each file of the approved version becomes an asset under
// "Entregas aprobadas/<request title>". The asset points at the version's object in the bucket (no copy), and its id is
// fixed per request, version and file, so running it twice changes nothing.
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { bumpIndex } from './fileOps.js';
import { forgetSearch } from './search.js';

export const APPROVED_FOLDER = 'Entregas aprobadas';

type VersionFile = { name?: string; contentType?: string; size?: number; storagePath?: string; url?: string };

/** Folder for one request: the title without slashes, so it stays one level under "Entregas aprobadas". */
export function approvedFolder(title: string, requestId: string) {
  const clean = title.replace(/[\\/\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
  return `${APPROVED_FOLDER}/${clean || requestId}`;
}

/** Files the approved version into Files. Links (no file in the bucket) stay in the request. Returns how many it added. */
export async function fileApproved(brandId: string, requestId: string, versionId: string, dryRun = false) {
  const reqRef = db.doc(`brands/${brandId}/requests/${requestId}`);
  const [req, ver] = await Promise.all([reqRef.get(), reqRef.collection('versions').doc(versionId).get()]);
  if (!req.exists || !ver.exists) return 0;
  const folder = approvedFolder(String(req.get('title') ?? ''), requestId);
  const files = ((ver.get('files') as VersionFile[] | undefined) ?? [])
    .map((f, i) => ({ ...f, id: `apr-${requestId}-${versionId}-${i}` }))
    .filter((f) => f.storagePath?.startsWith(`brands/${brandId}/`));
  if (!files.length) return 0;
  const brandRef = db.doc(`brands/${brandId}`);

  const added = await db.runTransaction(async (tx) => {
    const existing = await tx.getAll(...files.map((f) => db.doc(`brands/${brandId}/assets/${f.id}`)));
    const fresh = files.filter((_, i) => !existing[i].exists);
    const brand = await tx.get(brandRef);
    if (!fresh.length || dryRun) return fresh.length;
    await bumpIndex(tx, brandId, [folder, fresh.length, fresh.reduce((n, f) => n + Number(f.size ?? 0), 0)]);
    for (const f of fresh) {
      tx.set(db.doc(`brands/${brandId}/assets/${f.id}`), {
        type: 'file', source: 'approved', title: String(f.name ?? 'file'), folder, storagePath: f.storagePath,
        size: Number(f.size ?? 0), contentType: f.contentType ?? 'application/octet-stream', status: 'published',
        requestId, versionId, uploadedAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp(),
      });
    }
    // The client always sees what they approved, even when NickMark picked which folders they see.
    const fa = brand.get('fileAccess') as { mode?: string; folders?: string[] } | undefined;
    if (fa?.mode === 'selected' && !(fa.folders ?? []).includes(APPROVED_FOLDER)) {
      tx.update(brandRef, { 'fileAccess.folders': FieldValue.arrayUnion(APPROVED_FOLDER) });
    }
    return fresh.length;
  });
  if (added && !dryRun) forgetSearch(brandId);
  return added;
}
