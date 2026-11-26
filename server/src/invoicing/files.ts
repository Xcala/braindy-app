// Billing paperwork around the cuentas: NickMark's documents for the client's accounting (RUT, bank certificate,
// contract annexes…, several per brand) and the payment proofs the client uploads, which only the admin opens.
// Files live in Storage under brands/{id}/billing/…; the browser only ever gets a 15-minute signed link.
import { randomUUID } from 'node:crypto';
import type { Hono } from 'hono';
import type { AuthEnv } from '../auth.js';
import { db } from '../firebase.js';
import { pdfUrl } from '../contracts/store.js';
import { audit, docsCol, now, saveFile, type BillingDoc } from './store.js';

/** A data URL (PNG, JPG or PDF) as bytes, up to ~8 MB. */
export function dataFile(v: unknown): { bytes: Buffer; type: string; ext: string } | null {
  const m = /^data:(image\/png|image\/jpeg|application\/pdf);base64,([A-Za-z0-9+/=]+)$/.exec(String(v ?? ''));
  if (!m || m[2].length > 11_000_000) return null;
  return { bytes: Buffer.from(m[2], 'base64'), type: m[1], ext: m[1] === 'application/pdf' ? 'pdf' : m[1] === 'image/png' ? 'png' : 'jpg' };
}

type BillingFile = { name: string; type: string; size: number; storagePath: string; at: unknown; by: string };
const filesCol = (b: string) => db.collection(`brands/${b}/billingFiles`);
const cleanName = (s: unknown, ext: string) => {
  const base = String(s ?? '').replace(/\.[a-z0-9]{2,4}$/i, '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
  return `${base || 'Documento'}.${ext}`;
};
async function listFiles(b: string) {
  const q = await filesCol(b).orderBy('at', 'desc').get();
  return q.docs.map((s) => { const f = s.data() as BillingFile; return { id: s.id, name: f.name, type: f.type, size: f.size }; });
}
async function fileUrl(b: string, id: string) {
  const f = (await filesCol(b).doc(id).get()).data() as BillingFile | undefined;
  return f ? pdfUrl(f.storagePath, f.name) : null;
}

/** Admin: /brands/:brandId/invoicing/files (+ proofs). Client: /brands/:brandId/cuentas/files. Both routers already
 *  check who calls (admin only / billing people of the brand). */
export function billingFileRoutes(admin: Hono<AuthEnv>, client: Hono<AuthEnv>) {
  admin.get('/brands/:brandId/invoicing/files', async (c) => c.json({ files: await listFiles(c.req.param('brandId')) }));
  admin.post('/brands/:brandId/invoicing/files', async (c) => {
    const b = c.req.param('brandId');
    const body = await c.req.json<{ file?: string; name?: string }>().catch(() => ({} as { file?: string; name?: string }));
    const f = dataFile(body.file);
    if (!f) return c.json({ error: 'file' }, 400);
    const id = randomUUID();
    const storagePath = await saveFile(`brands/${b}/billing/files/${id}.${f.ext}`, f.bytes, f.type);
    const name = cleanName(body.name, f.ext);
    await filesCol(b).doc(id).set({ name, type: f.type, size: f.bytes.length, storagePath, at: now(), by: c.get('user').uid });
    await audit('billing_file_added', b, c.get('user').uid, { fileId: id });
    return c.json({ id, name });
  });
  admin.delete('/brands/:brandId/invoicing/files/:id', async (c) => {
    const { brandId, id } = c.req.param();
    await filesCol(brandId).doc(id).delete();
    await audit('billing_file_removed', brandId, c.get('user').uid, { fileId: id });
    return c.json({ ok: true });
  });
  admin.get('/brands/:brandId/invoicing/files/:id', async (c) => {
    const url = await fileUrl(c.req.param('brandId'), c.req.param('id'));
    return url ? c.json({ url }) : c.json({ error: 'not_found' }, 404);
  });
  /** The proof the client uploaded with «Ya pagué» (or that NickMark attached when recording a payment). */
  admin.get('/brands/:brandId/invoicing/docs/:docId/proofs/:paymentId', async (c) => {
    const { brandId, docId, paymentId } = c.req.param();
    const d = (await docsCol(brandId).doc(docId).get()).data() as BillingDoc | undefined;
    const p = d?.payments?.find((x) => x.id === paymentId);
    if (!p?.proofStoragePath) return c.json({ error: 'not_found' }, 404);
    return c.json({ url: await pdfUrl(p.proofStoragePath, `Comprobante ${d!.number}.${p.proofStoragePath.split('.').pop()}`) });
  });

  client.get('/brands/:brandId/cuentas/files', async (c) => c.json({ files: await listFiles(c.req.param('brandId')) }));
  client.get('/brands/:brandId/cuentas/files/:id', async (c) => {
    const url = await fileUrl(c.req.param('brandId'), c.req.param('id'));
    return url ? c.json({ url }) : c.json({ error: 'not_found' }, 404);
  });
}
