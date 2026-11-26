import { api } from '../lib/api';

export type DocStatus = 'scheduled' | 'issued' | 'sent' | 'paid' | 'overdue' | 'void';
export type CuentaPayment = { id: string; date: string; amount: number; method: string; status: 'confirmed' | 'pending'; hasProof: boolean };
export type Cuenta = {
  id: string; type: 'cuenta_cobro' | 'recibo'; number: string; index: number; of: number; billingMonth: string; scheduledDate: string; issueDate: string | null;
  amount: number; amountWords: string; status: DocStatus; held: boolean; paid: number; hasPdf: boolean; sentVia: string[]; voidReason: string | null;
  covers: Array<{ number: string; amount: number }>; paidOn?: string | null; agreementId: string | null; pendingProof: boolean; payments: CuentaPayment[]; currency?: Currency;
};
/** A document NickMark leaves for the client's accounting (RUT, bank certificate…). */
export type BillingFile = { id: string; name: string; type: string; size: number };
/** What «Enviar» did: channels that went out, a wa.me fallback, and how many people got the notice in the app. */
export type SendResult = { via?: string[]; waMe?: string | null; people?: number; email?: string | null; whatsapp?: string | null };
export type Profile ={ legalName: string; taxId: string; address?: string; city?: string; accountingEmail?: string; accountingWhatsApp?: string };
export type AgreementInput = {
  title: string; concept: string; packs: Array<{ name: string; description: string }>; servicePeriod: { from: string; to: string };
  executionPlace: string; projectClose: string; totalAmount: number; installments: number; startMonth: string; issueDay: number;
  numberingPrefix: string; distributionNote: string; autoSend: boolean; sourceSamplePath?: string | null; issuerId?: IssuerId;
};
export type Agreement = AgreementInput & { id: string; status: 'draft' | 'active' | 'closed'; currency?: Currency; stageProgress?: number[] };
export type PlanRow = { index: number; of: number; number: string; billingMonth: string; scheduledDate: string; amount: number; issueNow: boolean };
export type Extracted = {
  issuer: { name: string; docType: string; docNumber: string; docCity: string; bank: { bankName: string; accountType: string; accountNumber: string; holder: string } };
  client: { legalName: string; taxId: string }; concept: string; packs: Array<{ name: string; description: string }>;
  servicePeriod: string; servicePeriodFrom: string; servicePeriodTo: string; executionPlace: string; projectClose: string;
  totalAmount: number; installments: number; amountsPerPage: number[]; numberingPattern: string; numbers: string[]; issueDates: string[];
  paymentModality: string; hasSignature: boolean; warnings: string[];
};
export type IssuerId = 'nicolas' | 'nicolas-us';
export type Currency = 'COP' | 'USD';
export type Issuer = {
  name: string; docType: 'CC' | 'NIT' | 'EIN' | 'ITIN' | 'SSN'; docNumber: string; docCity: string; city: string; address?: string;
  bank: { bankName: string; accountType: string; accountNumber: string; holder: string; routingNumber?: string; swift?: string; bankAddress?: string };
  legalDeclarations: string[]; email?: string; phone?: string; web?: string; hasSignature?: boolean;
};

const json = (body: unknown, method = 'POST'): RequestInit => ({ method, body: JSON.stringify(body) });
const A = (b: string) => `/v1/admin/brands/${b}/invoicing`;

export const cuentasApi = {
  list: (b: string) => api<{ docs: Cuenta[]; cardFeePct?: number }>(`/v1/brands/${b}/cuentas`),
  pdf: (b: string, id: string) => api<{ url: string }>(`/v1/brands/${b}/cuentas/${id}/pdf`),
  paid: (b: string, id: string, x: { proof: string; date: string; amount: number; method: string }) => api<{ ok: true }>(`/v1/brands/${b}/cuentas/${id}/paid`, json(x)),
  checkout: (b: string, id: string, lang: string) => api<{ url: string }>(`/v1/brands/${b}/cuentas/${id}/checkout`, json({ lang })),
  files: (b: string) => api<{ files: BillingFile[] }>(`/v1/brands/${b}/cuentas/files`),
  file: (b: string, id: string) => api<{ url: string }>(`/v1/brands/${b}/cuentas/files/${id}`),
  // admin
  adminFiles: (b: string) => api<{ files: BillingFile[] }>(`${A(b)}/files`),
  adminFile: (b: string, id: string) => api<{ url: string }>(`${A(b)}/files/${id}`),
  addFile: (b: string, file: string, name: string) => api<{ id: string; name: string }>(`${A(b)}/files`, json({ file, name })),
  removeFile: (b: string, id: string) => api<{ ok: true }>(`${A(b)}/files/${id}`, { method: 'DELETE' }),
  proof: (b: string, docId: string, paymentId: string) => api<{ url: string }>(`${A(b)}/docs/${docId}/proofs/${paymentId}`),
  all:(b: string) => api<{ profile: Profile | null; billingPeople?: number; agreements: Agreement[]; docs: Cuenta[] }>(A(b)),
  saveProfile: (b: string, p: Profile) => api<{ profile: Profile; nitOk: boolean | null }>(`${A(b)}/profile`, json(p, 'PUT')),
  importPdf: (b: string, pdf: string) => api<{ extracted: Extracted; sourceSamplePath: string }>(`${A(b)}/import`, json({ pdf })),
  preview: (b: string, a: AgreementInput) => api<{ rows: PlanRow[]; problems: string[]; sum: number; matches: boolean }>(`${A(b)}/preview`, json(a)),
  create: (b: string, a: AgreementInput) => api<{ id: string }>(`${A(b)}/agreements`, json(a)),
  update: (b: string, id: string, a: Partial<AgreementInput>) => api<{ ok: true }>(`${A(b)}/agreements/${id}`, json(a, 'PUT')),
  stages: (b: string, id: string, stageProgress: number[]) => api<{ ok: true; stageProgress: number[] }>(`${A(b)}/agreements/${id}`, json({ stageProgress }, 'PUT')),
  activate: (b: string, id: string) => api<{ issued: string[]; scheduled: string[] }>(`${A(b)}/agreements/${id}/activate`, json({})),
  act: (b: string, id: string, action: 'issue' | 'send' | 'void', reason?: string) =>
    api<SendResult>(`${A(b)}/docs/${id}/${action}`, json({ reason })),
  adminPdf: (b: string, id: string) => api<{ url: string }>(`${A(b)}/docs/${id}/pdf`),
  pay: (b: string, x: { agreementId?: string; date: string; amount: number; method: string; receipt: boolean }) =>
    api<{ receipt: { number: string } | null }>(`${A(b)}/payments`, json(x)),
  confirm: (b: string, id: string, paymentId: string) => api<unknown>(`${A(b)}/docs/${id}/payments/${paymentId}/confirm`, json({ receipt: true })),
  issuers: () => api<{ issuers: Array<{ id: IssuerId; country: 'CO' | 'US'; currency: Currency; issuer: Issuer | null }> }>('/v1/admin/issuers'),
  issuer: (id: IssuerId = 'nicolas') => api<{ issuer: Issuer | null }>(`/v1/admin/issuers/${id}`),
  saveIssuer: (i: Issuer, id: IssuerId = 'nicolas') => api<{ issuer: Issuer }>(`/v1/admin/issuers/${id}`, json(i, 'PUT')),
  signature: (png: string, id: IssuerId = 'nicolas') => api<{ ok: true }>(`/v1/admin/issuers/${id}/signature`, json({ png }, 'PUT')),
  copySignature: (id: IssuerId, from: IssuerId) => api<{ ok: true }>(`/v1/admin/issuers/${id}/signature`, json({ copyFrom: from }, 'PUT')),
};

/** The server's short error code («no_profile»…) as a translation key. */
export const errKey = (e: unknown) => {
  const code = String((e as { body?: { error?: string } })?.body?.error ?? 'failed');
  return ['no_issuer', 'no_profile', 'no_signature', 'number_taken', 'sum_mismatch', 'more_than_owed', 'nothing_open', 'has_payments', 'not_open', 'stripe_not_configured'].includes(code) ? `cc.e.${code}` : 'cc.e.failed';
};
export const cop = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;
/** Amounts travel as integers: pesos for COP, cents for USD. */
export const money = (n: number, cur: Currency = 'COP') =>
  cur === 'USD' ? `US$${(Math.round(n) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : cop(n);
/** What a person types («6,500.50» or «6.500.000») as the integer the server keeps. */
export const toMinor = (s: string, cur: Currency = 'COP') => {
  if (cur === 'COP') return Number(s.replace(/\D/g, '')) || 0;
  const v = Number(s.replace(/[^\d.]/g, ''));
  return Number.isFinite(v) ? Math.round(v * 100) : 0;
};
export const fromMinor = (n: number, cur: Currency = 'COP') => (!n ? '' : cur === 'USD' ? String(n / 100) : String(n));
export const currencyOf = (issuerId?: IssuerId): Currency => (issuerId === 'nicolas-us' ? 'USD' : 'COP');
export const monthName = (ym: string, lang: 'en' | 'es') => { const s = new Date(`${ym}-15T12:00:00`).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'long', year: 'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1); };
export const readAsDataUrl = (f: File) => new Promise<string>((ok, ko) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = ko; r.readAsDataURL(f); });
export const openUrl = async (p: Promise<{ url: string }>) => { const w = window.open('', '_blank'); const { url } = await p; if (w) w.location.href = url; else window.location.href = url; };
