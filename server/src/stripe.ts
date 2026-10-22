// Stripe over REST (no SDK). Keys in Secret Manager: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.
// Card data never touches Braindy: payment happens on Stripe Checkout and the customer portal.
import { createHmac, timingSafeEqual } from 'node:crypto';

const KEY = process.env.STRIPE_SECRET_KEY?.trim();
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET?.trim();

export const stripeConfigured = () => !!KEY;

/** Stripe's form encoding for nested params: a[b][0][c]=v. */
function encode(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v === undefined || v === null) return [];
    if (Array.isArray(v)) return v.flatMap((x, i) => (typeof x === 'object' ? encode(x as Record<string, unknown>, `${key}[${i}]`) : [`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(x))}`]));
    if (typeof v === 'object') return encode(v as Record<string, unknown>, key);
    return [`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`];
  });
}

export async function stripe<T = Record<string, unknown>>(method: 'GET' | 'POST', path: string, params: Record<string, unknown> = {}): Promise<T> {
  if (!KEY) throw new Error('stripe_not_configured');
  const body = encode(params).join('&');
  const r = await fetch(`https://api.stripe.com/v1/${path}${method === 'GET' && body ? `?${body}` : ''}`, {
    method, headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: method === 'POST' ? body : undefined,
  });
  const j = (await r.json()) as T & { error?: { message?: string; type?: string } };
  if (!r.ok) throw new Error(`stripe_${r.status}_${j.error?.type ?? 'error'}`);
  return j;
}

/** Verifies the Stripe-Signature header (v1, HMAC-SHA256, 5-minute tolerance). */
export function verifyWebhook(raw: string, header: string | undefined): boolean {
  if (!WEBHOOK_SECRET || !header) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const expected = createHmac('sha256', WEBHOOK_SECRET).update(`${t}.${raw}`).digest('hex');
  const got = header.split(',').filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  return got.some((g) => g.length === expected.length && timingSafeEqual(Buffer.from(g), Buffer.from(expected)));
}

/** Amounts are stored in major units (e.g. 1500000 COP); Stripe wants minor units for both USD and COP. */
export const toMinor = (amount: number) => Math.round(amount * 100);
