import type { MiddlewareHandler } from 'hono';
import type { DecodedIdToken } from 'firebase-admin/auth';
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
