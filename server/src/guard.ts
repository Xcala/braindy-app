// Hardening: per-IP rate limits for public routes, structured error logs (Cloud Error Reporting groups
// them automatically on Cloud Run) and a small endpoint for browser errors. No secrets, no PII in logs.
import { Hono, type Context, type MiddlewareHandler } from 'hono';

type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();
setInterval(() => { const now = Date.now(); for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k); }, 60_000).unref();

/** Client IP behind Cloud Run / Google Front End (first X-Forwarded-For hop). */
export const clientIp = (c: Context) => (c.req.header('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';

/**
 * Fixed-window limit per IP and route group. In memory per instance: with a few Cloud Run instances
 * the effective limit is a small multiple, which is fine for abuse protection (not for billing).
 */
export function rateLimit(name: string, max: number, windowMs: number): MiddlewareHandler {
  return async (c, next) => {
    if (c.req.method === 'OPTIONS') return next();
    const key = `${name}:${clientIp(c)}`;
    const now = Date.now();
    const b = buckets.get(key);
    if (!b || b.reset < now) buckets.set(key, { count: 1, reset: now + windowMs });
    else if (++b.count > max) {
      c.header('Retry-After', String(Math.ceil((b.reset - now) / 1000)));
      return c.json({ error: 'rate_limited' }, 429);
    }
    await next();
  };
}

/** One JSON line per error with severity, so Error Reporting picks it up. Never logs bodies or tokens. */
export function logError(err: unknown, ctx: Record<string, string> = {}) {
  const e = err instanceof Error ? err : new Error(String(err));
  console.error(JSON.stringify({
    severity: 'ERROR', message: e.stack ?? e.message,
    '@type': 'type.googleapis.com/google.devtools.clouderrorreporting.v1beta1.ReportedErrorEvent',
    serviceContext: { service: 'braindy-api' }, context: ctx,
  }));
}

/** Browser errors from the web app (rate limited, truncated). */
export const clientErrors = new Hono();
clientErrors.post('/client-errors', rateLimit('client-errors', 20, 60_000), async (c) => {
  const b = await c.req.json<{ message?: string; stack?: string; path?: string; release?: string }>().catch(() => ({} as Record<string, string>));
  const msg = String(b.message ?? '').slice(0, 500);
  if (!msg) return c.json({ ok: false }, 400);
  console.error(JSON.stringify({
    severity: 'ERROR', message: `${msg}\n${String(b.stack ?? '').slice(0, 4000)}`,
    '@type': 'type.googleapis.com/google.devtools.clouderrorreporting.v1beta1.ReportedErrorEvent',
    serviceContext: { service: 'braindy-web', version: String(b.release ?? '').slice(0, 40) },
    context: { httpRequest: { url: String(b.path ?? '').replace(/[?#].*$/, '').slice(0, 200) } },
  }));
  return c.json({ ok: true });
});
