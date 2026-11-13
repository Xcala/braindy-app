// Shared pieces of the contract flow: document refs, drawn signatures, request evidence and sealing the PDF.
import { createHash } from 'node:crypto';
import type { Context } from 'hono';
import { FieldValue, type DocumentData } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { db } from '../firebase.js';
import { renderContractPdf, type SignatureRecord } from './pdf.js';
import { TEMPLATE_TITLE } from './template.js';
import type { ChecklistItem, Schedule } from './schedule.js';

const BUCKET = process.env.FILES_BUCKET ?? 'braindy-app-files';
export const bucket = () => getStorage().bucket(BUCKET);
export const now = () => FieldValue.serverTimestamp();
export const contractRef = (brandId: string, id: string) => db.doc(`brands/${brandId}/contracts/${id}`);
export const sha256 = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex');

export type ContractStatus = 'draft' | 'sent' | 'signed';
export const CONSENT = {
  client: 'Leí el contrato y sus anexos, los acepto y firmo electrónicamente como representante legal de EL CONTRATANTE.',
  contractor: 'Leí el contrato y sus anexos, los acepto y firmo electrónicamente como EL CONTRATISTA.',
};
export const METHOD = 'Sesión iniciada en Braindy con el correo verificado del firmante (Firebase Authentication)';

/** A drawn signature as a PNG data URL, at most ~300 KB. */
export function signaturePng(dataUrl: unknown): Buffer | null {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl ?? ''));
  if (!m || m[1].length > 400_000) return null;
  const buf = Buffer.from(m[1], 'base64');
  return buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && buf.length > 200 ? buf : null;
}

/** IP and browser of the request (Cloud Run puts the client IP first in X-Forwarded-For). */
export function evidence(c: Context) {
  const ip = (c.req.header('X-Forwarded-For') ?? '').split(',')[0].trim();
  return { ip: ip.slice(0, 64), userAgent: String(c.req.header('User-Agent') ?? '').slice(0, 300) };
}

export async function saveSignature(brandId: string, id: string, who: 'cliente' | 'contratista', png: Buffer) {
  const path = `brands/${brandId}/contracts/${id}/firma-${who}.png`;
  await bucket().file(path).save(png, { contentType: 'image/png', resumable: false });
  return path;
}

/** Stored signature data → the record the PDF needs (with the PNG bytes from the bucket). */
async function record(role: SignatureRecord['role'], s: DocumentData): Promise<SignatureRecord> {
  const [png] = await bucket().file(String(s.imagePath)).download();
  return {
    role, name: s.name, tipoDoc: s.tipoDoc, doc: s.doc, cargo: s.cargo, email: s.email,
    signedAt: s.signedAt, verifiedAt: s.verifiedAt, ip: s.ip, userAgent: s.userAgent, method: s.method, consent: s.consent, png,
  };
}

/** Renders the final PDF with both signatures and the certificate, stores it and returns where. */
export async function seal(brandId: string, id: string, contract: DocumentData) {
  const brand = await db.doc(`brands/${brandId}`).get();
  const brandName = String(brand.get('name') ?? brandId);
  const pdf = await renderContractPdf({
    id, brandName, title: TEMPLATE_TITLE, templateVersion: contract.templateVersion,
    text: contract.text, textHash: contract.textHash, scope: contract.scope ?? '',
    schedule: contract.schedule as Schedule, checklist: contract.checklist as ChecklistItem[],
    client: await record('client', contract.signatures.client),
    contractor: await record('contractor', contract.signatures.contractor),
  });
  const storagePath = `brands/${brandId}/contracts/${id}/contrato-firmado.pdf`;
  await bucket().file(storagePath).save(Buffer.from(pdf), {
    contentType: 'application/pdf', resumable: false,
    metadata: { metadata: { textSha256: contract.textHash } },
  });
  const fileName = `Contrato firmado · ${brandName}.pdf`;
  return { storagePath, sha256: sha256(pdf), size: pdf.length, fileName };
}

export async function pdfUrl(storagePath: string, fileName: string) {
  const [url] = await bucket().file(storagePath).getSignedUrl({
    version: 'v4', action: 'read', expires: Date.now() + 15 * 60 * 1000,
    responseDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
  });
  return url;
}
