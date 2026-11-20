// Files the person attached in the chat (uploaded first to the brand's Uploads, like «Ask for something»). Images go to
// the model so it can see them; every file is named in the text so a proposal can carry it.
import { getStorage } from 'firebase-admin/storage';
import { db } from '../firebase.js';

const BUCKET = process.env.FILES_BUCKET ?? 'braindy-app-files';
const IMAGE = /^image\/(jpeg|png|webp|gif)$/;
const MAX_IMAGE = 4 * 1024 ** 2;

export type Attached = { assetId: string; name: string; contentType: string; size: number };

/** Checks each upload is this person's (or the admin's) in this brand; returns them and the model blocks. */
export async function readAttachments(brandId: string, uid: string, admin: boolean, raw: unknown) {
  const ids = (Array.isArray(raw) ? raw : []).map((x) => String((x as { assetId?: unknown })?.assetId ?? '')).filter((id) => /^upl-[\w-]{8,60}$/.test(id)).slice(0, 5);
  const files: Attached[] = [];
  const blocks: unknown[] = [];
  for (const id of ids) {
    const a = await db.doc(`brands/${brandId}/assets/${id}`).get();
    if (!a.exists || a.get('source') !== 'upload' || a.get('status') === 'uploading' || (!admin && a.get('uploadedBy') !== uid)) continue;
    const f = { assetId: id, name: String(a.get('title') ?? id).slice(0, 200), contentType: String(a.get('contentType') ?? ''), size: Number(a.get('size') ?? 0) };
    files.push(f);
    const path = String(a.get('storagePath') ?? '');
    if (IMAGE.test(f.contentType) && f.size <= MAX_IMAGE && path.startsWith(`brands/${brandId}/`)) {
      try {
        const [buf] = await getStorage().bucket(BUCKET).file(path).download();
        blocks.push({ type: 'image', source: { type: 'base64', media_type: f.contentType, data: buf.toString('base64') } });
      } catch { /* the name still travels */ }
    }
  }
  if (files.length) blocks.push({ type: 'text', text: `[[ADJUNTOS ${files.map((f) => `«${f.name}» (${f.contentType})`).join(', ')}]] — viajan solos con el pedido, el ajuste o lo que agregue a un pedido que propongas ahora.` });
  return { files, blocks };
}
