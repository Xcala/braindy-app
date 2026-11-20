// Cancel a request sent by mistake (2026-11-20, Sanuteam asked the same thing twice and the team did it twice).
// The person who asked, anyone who can approve, or NickMark. Cancelling hides it everywhere (archived) and stops the
// Brains (the worker skips it, the connector leaves it out); it can be undone, back to where it was. A note from the
// person goes into the request's thread, so NickMark gets the alert and the history keeps who and when.
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { brandAccess } from './access.js';
import { canApprove } from './requests.js';
import type { AuthEnv } from './auth.js';

const now = () => FieldValue.serverTimestamp();
export const requestCancel = new Hono<AuthEnv>();

requestCancel.post('/brands/:brandId/requests/:requestId/cancel', async (c) => {
  const { brandId, requestId } = c.req.param();
  const uid = c.get('user').uid;
  const { undo } = await c.req.json<{ undo?: boolean }>().catch(() => ({ undo: false }));
  const ref = db.doc(`brands/${brandId}/requests/${requestId}`);
  const snap = await ref.get();
  if (!snap.exists) return c.json({ error: 'not_found' }, 404);
  const access = await brandAccess(uid, brandId);
  if (!access.member) return c.json({ error: 'forbidden' }, 403);
  if (!access.admin && snap.get('createdBy') !== uid && !(await canApprove(uid, brandId))) return c.json({ error: 'forbidden' }, 403);

  const cancelled = snap.get('cancelled') as { prevArchived?: boolean; prevWork?: string | null } | undefined;
  const status = String(snap.get('status') ?? '');
  if (undo) {
    if (!cancelled) return c.json({ ok: true });
    await ref.update({
      archived: !!cancelled.prevArchived, cancelled: FieldValue.delete(), updatedAt: now(),
      // Work that was waiting goes back in line; anything else stays as it was.
      ...(cancelled.prevWork === 'queued' ? { 'work.state': 'queued' } : {}),
    });
  } else {
    if (cancelled) return c.json({ ok: true });
    if (status === 'approved' || status === 'published') return c.json({ error: 'already_approved' }, 400);
    const work = (snap.get('work.state') as string | undefined) ?? null;
    await ref.update({
      archived: true, updatedAt: now(),
      cancelled: { by: uid, at: now(), prevArchived: !!snap.get('archived'), prevWork: work },
      // A request waiting for the worker leaves the line (a running session finishes, and its delivery is refused).
      ...(work === 'queued' ? { 'work.state': 'cancelled' } : {}),
    });
  }
  await ref.collection('comments').doc().set({ author: uid, kind: undo ? 'reopened' : 'cancelled', text: undo ? 'Volvió a abrir este pedido.' : 'Canceló este pedido.', createdAt: now() });
  await db.collection('audit').doc().set({ type: undo ? 'request_reopened' : 'request_cancelled', brandId, requestId, by: uid, at: now() });
  return c.json({ ok: true });
});
