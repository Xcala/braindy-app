import type { MiddlewareHandler } from 'hono';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAppCheck } from 'firebase-admin/app-check';
import { adminAuth } from './firebase.js';

export type AuthEnv = { Variables: { user: DecodedIdToken } };

/** Verifies the Firebase ID token sent by the web app as `Authorization: Bearer <token>`. */
export const requireUser: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const header = c.req.header('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return c.json({ error: 'unauthenticated' }, 401);
  try {
    c.set('user', await adminAuth.verifyIdToken(token, true));
  } catch {
    return c.json({ error: 'unauthenticated' }, 401);
  }
  await next();
};

/** App Check: verified when present; required only when APP_CHECK_ENFORCE=1 (turn on after the web sends it). */
export const appCheck: MiddlewareHandler = async (c, next) => {
  if (c.req.method === 'OPTIONS') return next();
  const token = c.req.header('X-Firebase-AppCheck');
  if (token) {
    try { await getAppCheck().verifyToken(token); } catch { return c.json({ error: 'app_check_failed' }, 401); }
  } else if (process.env.APP_CHECK_ENFORCE === '1') {
    return c.json({ error: 'app_check_required' }, 401);
  }
  await next();
};
