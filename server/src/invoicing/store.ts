// Cuentas de cobro y recibos: where everything lives and the shared shapes.
// issuers/{id}                                 who charges (admin only): document, bank, signature, logo, legal lines
// brands/{b}/billing/profile                    the client's accounting data (billing people read it)
// brands/{b}/billingAgreements/{id}             a project charged in n cuentas (admin only)
// brands/{b}/billingDocs/{id}                   one cuenta de cobro or recibo (admin and billing people read)
// issuers/{id}/numbers/{number}                 each number used once per issuer, never reused
import { createHash, randomBytes } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { bucket } from '../contracts/store.js';

export const now = () => FieldValue.serverTimestamp();
export const DEFAULT_ISSUER = 'nicolas';
export const issuerRef = (id = DEFAULT_ISSUER) => db.doc(`issuers/${id}`);
export const profileRef = (b: string) => db.doc(`brands/${b}/billing/profile`);
export const agreementsCol = (b: string) => db.collection(`brands/${b}/billingAgreements`);
export const docsCol = (b: string) => db.collection(`brands/${b}/billingDocs`);
export const sha256 = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex');

export type Issuer = {
  name: string; docType: 'CC' | 'NIT'; docNumber: string; docCity: string; city: string;
  bank: { bankName: string; accountType: string; accountNumber: string; holder: string };
  signatureStoragePath?: string | null; logoStoragePath?: string | null; legalDeclarations: string[];
  email?: string; phone?: string; web?: string; nextReceipt?: number;
};
export type Profile = { legalName: string; taxId: string; address?: string; city?: string; accountingEmail?: string; accountingWhatsApp?: string };
export type Agreement = {
  issuerId: string; title: string; concept: string; packs: Array<{ name: string; description: string }>;
  servicePeriod: { from: string; to: string }; executionPlace: string; projectClose?: string;
  totalAmount: number; currency: 'COP'; installments: number; startMonth: string; issueDay: number;
  numberingPrefix: string; roundingRule: 'remainder_last'; distributionNote: string; autoSend: boolean;
  status: 'draft' | 'active' | 'closed'; sourceSamplePath?: string | null; templateId: 'braindy';
};
export type Payment = { id: string; date: string; amount: number; method: string; proofStoragePath?: string | null; status: 'confirmed' | 'pending'; by: string; receiptId?: string | null };
export type DocStatus = 'scheduled' | 'issued' | 'sent' | 'paid' | 'overdue' | 'void';
export type BillingDoc = {
  agreementId: string | null; type: 'cuenta_cobro' | 'recibo'; number: string; index: number; of: number;
  billingMonth: string; scheduledDate: string; issueDate: string | null; amount: number; amountWords: string;
  status: DocStatus; held?: boolean; pdfStoragePath?: string | null; pdfHash?: string | null;
  sentAt?: unknown; sentVia?: string[]; payments?: Payment[]; paid?: number; voidReason?: string | null;
  covers?: Array<{ docId: string; number: string; amount: number }>; publicTokenHash?: string | null;
};

const clean = (v: unknown, max = 300) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const int = (v: unknown) => { const n = Math.round(Number(String(v ?? '').replace(/[^\d-]/g, ''))); return Number.isFinite(n) ? n : 0; };

export function pickIssuer(b: Record<string, unknown>, prev?: Partial<Issuer>): Issuer {
  const bank = (b.bank ?? {}) as Record<string, unknown>;
  return {
    name: clean(b.name, 120), docType: b.docType === 'NIT' ? 'NIT' : 'CC', docNumber: clean(b.docNumber, 40), docCity: clean(b.docCity, 60), city: clean(b.city, 60),
    bank: { bankName: clean(bank.bankName, 60), accountType: clean(bank.accountType, 40), accountNumber: clean(bank.accountNumber, 40).replace(/[^\d-]/g, ''), holder: clean(bank.holder, 120) },
    legalDeclarations: (Array.isArray(b.legalDeclarations) ? b.legalDeclarations : []).map((x) => clean(x, 600)).filter(Boolean).slice(0, 6),
    email: clean(b.email, 120), phone: clean(b.phone, 40), web: clean(b.web, 80),
    signatureStoragePath: prev?.signatureStoragePath ?? null, logoStoragePath: prev?.logoStoragePath ?? null,
  };
}
export function pickProfile(b: Record<string, unknown>): Profile {
  return { legalName: clean(b.legalName, 160), taxId: clean(b.taxId, 40), address: clean(b.address, 160), city: clean(b.city, 60), accountingEmail: clean(b.accountingEmail, 120).toLowerCase(), accountingWhatsApp: clean(b.accountingWhatsApp, 30) };
}
export function pickAgreement(b: Record<string, unknown>): Omit<Agreement, 'status' | 'issuerId' | 'templateId' | 'roundingRule' | 'currency'> {
  const period = (b.servicePeriod ?? {}) as Record<string, unknown>;
  const month = (v: unknown) => (/^\d{4}-\d{2}$/.test(String(v ?? '')) ? String(v) : '');
  return {
    title: clean(b.title, 140), concept: String(b.concept ?? '').trim().slice(0, 1500),
    packs: (Array.isArray(b.packs) ? b.packs : []).slice(0, 8).map((p) => ({ name: clean((p as Record<string, unknown>).name, 80), description: clean((p as Record<string, unknown>).description, 500) })).filter((p) => p.name),
    servicePeriod: { from: month(period.from), to: month(period.to) }, executionPlace: clean(b.executionPlace, 80), projectClose: clean(b.projectClose, 200),
    totalAmount: int(b.totalAmount), installments: Math.min(60, Math.max(1, int(b.installments))), startMonth: month(b.startMonth),
    issueDay: Math.min(28, Math.max(1, int(b.issueDay) || 1)), numberingPrefix: clean(b.numberingPrefix, 20).toUpperCase().replace(/[^A-Z0-9-]/g, ''),
    distributionNote: clean(b.distributionNote, 300), autoSend: b.autoSend === true, sourceSamplePath: typeof b.sourceSamplePath === 'string' ? b.sourceSamplePath : null,
  };
}
export function agreementProblems(a: ReturnType<typeof pickAgreement>): string[] {
  const p: string[] = [];
  if (!a.title) p.push('title');
  if (!a.concept) p.push('concept');
  if (a.totalAmount <= 0) p.push('totalAmount');
  if (!a.startMonth) p.push('startMonth');
  if (!a.numberingPrefix) p.push('numberingPrefix');
  return p;
}

/** A one-time-readable link token for a cuenta (accounting people without a Braindy account). */
export function newToken() { const t = randomBytes(24).toString('base64url'); return { token: t, hash: sha256(t) }; }

export async function saveFile(path: string, bytes: Uint8Array, contentType: string) {
  await bucket().file(path).save(Buffer.from(bytes), { contentType, resumable: false });
  return path;
}
export async function readFile(path: string) { const [b] = await bucket().file(path).download(); return b; }

export async function audit(type: string, brandId: string, by: string, extra: Record<string, unknown> = {}) {
  await db.collection('audit').doc().set({ type, brandId, by, ...extra, at: now() });
}
