import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';
/** Site hosting plans (approved offer 2026-10-30), USD per month. */
export const HOSTING = ['esencial', 'pro', 'ultra'];
export const HOSTING_USD = { esencial: 5, pro: 15, ultra: 35 };
/** The brand's plan and invoices (owners and admin; others get null/[] from the rules). */
export function useBilling(brandId) {
    const [plan, setPlan] = useState(undefined);
    const [invoices, setInvoices] = useState([]);
    useEffect(() => {
        if (!brandId)
            return;
        const a = onSnapshot(doc(db, 'brands', brandId, 'billing', 'plan'), (s) => setPlan(s.exists() ? s.data() : null), () => setPlan(null));
        const b = onSnapshot(query(collection(db, 'brands', brandId, 'invoices'), orderBy('date', 'desc')), (s) => setInvoices(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setInvoices([]));
        return () => { a(); b(); };
    }, [brandId]);
    return { plan, invoices };
}
export const money = (v, currency = 'usd', lang = 'es') => v == null ? '—' : new Intl.NumberFormat(lang === 'es' ? 'es-CO' : 'en-US', { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(v);
const b = (id) => `/v1/brands/${encodeURIComponent(id)}/billing`;
const a = (id) => `/v1/admin/brands/${encodeURIComponent(id)}/billing`;
const post = (body = {}) => ({ method: 'POST', body: JSON.stringify(body) });
export const billingApi = {
    status: (brandId) => api(b(brandId)),
    details: (brandId, d) => api(`${b(brandId)}/details`, { method: 'PUT', body: JSON.stringify(d) }),
    checkout: (brandId, option) => api(`${b(brandId)}/checkout`, post({ option })),
    portal: (brandId) => api(`${b(brandId)}/portal`, post()),
    transfer: (brandId, reference, amount) => api(`${b(brandId)}/transfer`, post({ reference, amount })),
    addon: (brandId) => api(`${b(brandId)}/addon`, post({ addon: 'agents' })),
    cancelRequest: (brandId) => api(`${b(brandId)}/cancel-request`, post()),
    setPlan: (brandId, p) => api(`${a(brandId)}/plan`, { method: 'PUT', body: JSON.stringify(p) }),
    confirmTransfer: (brandId, id) => api(`${a(brandId)}/transfers/${id}/confirm`, post()),
};
