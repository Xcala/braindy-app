// NickMark Taste: records when a typical objection shows up in a comment (shown, lesson opened, sent anyway),
// so NickMark knows what to teach next. Only ids and the outcome are stored, never the comment text.
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { brandAccess } from './access.js';
import type { AuthEnv } from './auth.js';

const OUTCOMES = new Set(['shown', 'opened', 'sent']);

export const criterio = new Hono<AuthEnv>();

criterio.post('/criterio/hits', async (c) => {
  const uid = c.get('user').uid;
  const b = await c.req.json<{ brandId?: string; objectionId?: string; outcome?: string }>().catch(() => ({} as Record<string, string>));
  const brandId = String(b.brandId ?? '').slice(0, 80);
  const objectionId = String(b.objectionId ?? '').slice(0, 80);
  const outcome = String(b.outcome ?? '');
  if (!brandId || !objectionId || !OUTCOMES.has(outcome)) return c.json({ error: 'invalid' }, 400);
  const access = await brandAccess(uid, brandId);
  if (!access.member && !access.admin) return c.json({ error: 'forbidden' }, 403);
  if (access.admin) return c.json({ ok: true, skipped: 'admin' }); // NickMark testing his own answers doesn't count
  if (!(await db.doc(`objections/${objectionId}`).get()).exists) return c.json({ error: 'not_found' }, 404);
  await db.collection('criterioHits').add({ brandId, objectionId, outcome, uid, at: FieldValue.serverTimestamp() });
  return c.json({ ok: true });
});
