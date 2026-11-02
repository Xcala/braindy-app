// Files that arrive by WhatsApp go to the brand's Uploads (same shape as a browser upload), never anywhere else.
import { randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { bucket } from '../requests.js';
import { downloadMedia } from '../whatsapp.js';

export type InMedia = { id: string; name: string; contentType: string };
export type StoredFile = { assetId: string; name: string; size: number; contentType: string };

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4', 'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3', 'application/pdf': 'pdf',
};

/** Name for a file without one (photos and voice notes): whatsapp-2026-11-02-1530.jpg */
export function mediaName(given: string | undefined, contentType: string) {
  const clean = String(given ?? '').replace(/[\\/\r\n]/g, '_').trim().slice(0, 200);
  if (clean) return clean;
  const d = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13).replace('T', '-');
  return `whatsapp-${d}.${EXT[contentType.split(';')[0]] ?? 'bin'}`;
}

export async function storeMedia(brandId: string, uid: string, list: InMedia[]): Promise<StoredFile[]> {
  const out: StoredFile[] = [];
  for (const m of list.slice(0, 10)) {
    const file = await downloadMedia(m.id);
    if (!file) continue;
    const contentType = file.contentType || m.contentType;
    const name = mediaName(m.name, contentType);
    const assetId = `upl-${randomUUID()}`;
    const storagePath = `brands/${brandId}/uploads/${assetId}/${name}`;
    await bucket().file(storagePath).save(file.bytes, { contentType, resumable: false });
    await db.doc(`brands/${brandId}/assets/${assetId}`).set({
      type: 'file', source: 'upload', via: 'whatsapp', title: name, folder: 'Uploads', storagePath, size: file.bytes.length, contentType,
      status: 'published', uploadedBy: uid, createdAt: FieldValue.serverTimestamp(), uploadedAt: FieldValue.serverTimestamp(),
    });
    out.push({ assetId, name, size: file.bytes.length, contentType });
  }
  return out;
}
