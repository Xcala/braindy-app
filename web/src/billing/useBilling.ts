import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';

export type Plan = {
  path?: 'transform' | 'continuity' | 'launch'; monthly?: number | null; project?: number | null; currency?: string; addons?: string[];
  status?: 'pending' | 'active' | 'past_due' | 'transfer_review' | 'canceled'; nextChargeAt?: Timestamp; stripeCustomerId?: string;
  invoiceDetails?: { company?: string; taxId?: string; email?: string; whatsapp?: string }; cancelRequestedAt?: Timestamp;
};
export type Invoice = { id: string; concept: string; amount: number | null; currency: string; status: 'paid' | 'failed'; date?: Timestamp; pdfUrl?: string | null; hostedUrl?: string | null };

/** The brand's plan and invoices (owners and admin; others get null/[] from the rules). */
export function useBilling(brandId?: string) {
  const [plan, setPlan] = useState<Plan | null | undefined>(undefined);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  useEffect(() => {
    if (!brandId) return;
    const a = onSnapshot(doc(db, 'brands', brandId, 'billing', 'plan'), (s) => setPlan(s.exists() ? (s.data() as Plan) : null), () => setPlan(null));
    const b = onSnapshot(query(collection(db, 'brands', brandId, 'invoices'), orderBy('date', 'desc')),
      (s) => setInvoices(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Invoice)), () => setInvoices([]));
    return () => { a(); b(); };
  }, [brandId]);
  return { plan, invoices };
}

export const money = (v: number | null | undefined, currency = 'usd', lang: 'en' | 'es' = 'es') =>
  v == null ? '—' : new Intl.NumberFormat(lang === 'es' ? 'es-CO' : 'en-US', { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(v);

const b = (id: string) => `/v1/brands/${encodeURIComponent(id)}/billing`;
const a = (id: string) => `/v1/admin/brands/${encodeURIComponent(id)}/billing`;
const post = (body: unknown = {}): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

export const billingApi = {
  status: (brandId: string) => api<{ stripe: boolean }>(b(brandId)),
  details: (brandId: string, d: Plan['invoiceDetails']) => api(`${b(brandId)}/details`, { method: 'PUT', body: JSON.stringify(d) }),
  checkout: (brandId: string, option: 'monthly' | 'project') => api<{ url: string }>(`${b(brandId)}/checkout`, post({ option })),
  portal: (brandId: string) => api<{ url: string }>(`${b(brandId)}/portal`, post()),
  transfer: (brandId: string, reference: string, amount?: number) => api(`${b(brandId)}/transfer`, post({ reference, amount })),
  cancelRequest: (brandId: string) => api(`${b(brandId)}/cancel-request`, post()),
  setPlan: (brandId: string, p: Plan) => api(`${a(brandId)}/plan`, { method: 'PUT', body: JSON.stringify(p) }),
  confirmTransfer: (brandId: string, id: string) => api(`${a(brandId)}/transfers/${id}/confirm`, post()),
};
