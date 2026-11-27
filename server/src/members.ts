// Brand members: invite by email, change role / approval rights, remove. Admin or brand owners
// (also owners of a group above the brand). Pending invites are claimed on first sign-in.
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, db } from './firebase.js';
import { brandAccess, SECTIONS } from './access.js';
import type { AuthEnv } from './auth.js';
import { normalizePhone } from './whatsapp.js';
import { contactRef, linkPhone } from './wa/contacts.js';

const now = () => FieldValue.serverTimestamp();
const ROLES = ['client_owner', 'client_member'] as const;
type Role = (typeof ROLES)[number];
/** Sections NickMark picked for a person; null keeps the default of their role. */
const cleanSections = (v: unknown) => (Array.isArray(v) ? SECTIONS.filter((x) => v.includes(x)) : null);

async function canManage(uid: string, brandId: string) {
  const a = await brandAccess(uid, brandId);
  return a.admin || a.role === 'client_owner';
}

export async function addMember(brandId: string, uid: string, email: string, name: string, role: Role, canApprove: boolean, by: string, sections: string[] | null = null) {
  const userRef = db.doc(`users/${uid}`);
  const user = await userRef.get();
  await db.batch()
    .set(db.doc(`brands/${brandId}/members/${uid}`), { role, canApprove: role === 'client_owner' || canApprove, email, name, addedBy: by, addedAt: now(), ...(sections ? { sections } : {}) }, { merge: true })
    .set(userRef, {
      email, name: user.get('name') ?? name, role: user.get('role') === 'admin' ? 'admin' : 'client',
      brandIds: FieldValue.arrayUnion(brandId),
    }, { merge: true })
    .set(db.collection('audit').doc(), { type: 'member_added', brandId, uid, role, by, at: now() })
    .commit();
}

export const members = new Hono<AuthEnv>();

members.post('/brands/:brandId/members', async (c) => {
  const { brandId } = c.req.param();
  const by = c.get('user').uid;
  if (!(await canManage(by, brandId))) return c.json({ error: 'forbidden' }, 403);
  const b = await c.req.json<{ email?: string; phone?: string; name?: string; role?: string; canApprove?: boolean; sections?: string[] }>();
  // Only NickMark decides which sections a person sees.
  const sections = (await brandAccess(by, brandId)).admin ? cleanSections(b.sections) : null;
  const email = String(b.email ?? '').trim().toLowerCase();
  const role: Role = b.role === 'client_owner' ? 'client_owner' : 'client_member';
  // By WhatsApp number (with or without an email): the person exists from now on, so a sign-in link can reach them.
  if (b.phone?.trim()) {
    const phone = normalizePhone(b.phone);
    if (!phone) return c.json({ error: 'invalid_phone' }, 400);
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return c.json({ error: 'invalid_email' }, 400);
    const linked = (await contactRef(phone).get()).get('uid') as string | null | undefined;
    const byEmail = email ? await adminAuth.getUserByEmail(email).catch(() => null) : null;
    if (linked && byEmail && linked !== byEmail.uid) return c.json({ error: 'phone_taken' }, 409);
    const name = String(b.name ?? '').trim().slice(0, 80);
    const user = linked ? await adminAuth.getUser(linked) : byEmail
      ?? await adminAuth.createUser({ ...(email ? { email } : {}), ...(name ? { displayName: name } : {}) });
    await addMember(brandId, user.uid, user.email ?? email, name || user.displayName || user.email || `+${phone}`, role, b.canApprove !== false, by, sections);
    if (!linked) await linkPhone(phone, user.uid, 'admin');
    return c.json({ status: 'added', uid: user.uid });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return c.json({ error: 'invalid_email' }, 400);

  const existing = await adminAuth.getUserByEmail(email).catch(() => null);
  if (existing) {
    await addMember(brandId, existing.uid, email, existing.displayName ?? email, role, b.canApprove !== false, by, sections);
    return c.json({ status: 'added', uid: existing.uid });
  }
  await db.collection('invites').doc(`${brandId}__${email}`).set({ email, brandId, role, canApprove: b.canApprove !== false, invitedBy: by, at: now(), ...(sections ? { sections } : {}) });
  return c.json({ status: 'invited' });
});

members.patch('/brands/:brandId/members/:uid', async (c) => {
  const { brandId, uid } = c.req.param();
  const by = c.get('user').uid;
  if (!(await canManage(by, brandId))) return c.json({ error: 'forbidden' }, 403);
  if (uid === by) return c.json({ error: 'cannot_edit_self' }, 400);
  const b = await c.req.json<{ role?: string; canApprove?: boolean; sections?: string[] | null; name?: string }>();
  const ref = db.doc(`brands/${brandId}/members/${uid}`);
  if (!(await ref.get()).exists) return c.json({ error: 'not_found' }, 404);
  const patch: Record<string, unknown> = { updatedBy: by, updatedAt: now() };
  if (ROLES.includes(b.role as Role)) patch.role = b.role;
  if (typeof b.canApprove === 'boolean') patch.canApprove = b.canApprove;
  // The name the brand knows them by (audit C5): many were invited with only a phone number or an email.
  if (typeof b.name === 'string' && b.name.trim()) patch.name = b.name.trim().slice(0, 80);
  if (patch.role === 'client_owner') patch.canApprove = true;
  if ('sections' in b) {
    if (!(await brandAccess(by, brandId)).admin) return c.json({ error: 'forbidden' }, 403);
    patch.sections = cleanSections(b.sections) ?? FieldValue.delete();
  }
  await db.batch().update(ref, patch).set(db.collection('audit').doc(), { type: 'member_updated', brandId, uid, patch: { role: patch.role ?? null, canApprove: patch.canApprove ?? null, name: patch.name ?? null, sections: Array.isArray(patch.sections) ? patch.sections : null }, by, at: now() }).commit();
  return c.json({ ok: true });
});

members.delete('/brands/:brandId/members/:uid', async (c) => {
  const { brandId, uid } = c.req.param();
  const by = c.get('user').uid;
  if (!(await canManage(by, brandId))) return c.json({ error: 'forbidden' }, 403);
  if (uid === by) return c.json({ error: 'cannot_remove_self' }, 400);
  await db.batch()
    .delete(db.doc(`brands/${brandId}/members/${uid}`))
    .set(db.doc(`users/${uid}`), { brandIds: FieldValue.arrayRemove(brandId) }, { merge: true })
    .set(db.collection('audit').doc(), { type: 'member_removed', brandId, uid, by, at: now() })
    .commit();
  return c.json({ ok: true });
});

members.get('/brands/:brandId/invites', async (c) => {
  const { brandId } = c.req.param();
  if (!(await canManage(c.get('user').uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const s = await db.collection('invites').where('brandId', '==', brandId).get();
  return c.json({ invites: s.docs.map((d) => ({ id: d.id, email: d.get('email'), role: d.get('role'), sections: d.get('sections') ?? null })) });
});

members.delete('/brands/:brandId/invites/:inviteId', async (c) => {
  const { brandId, inviteId } = c.req.param();
  if (!(await canManage(c.get('user').uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  if (!inviteId.startsWith(`${brandId}__`)) return c.json({ error: 'not_found' }, 404);
  await db.doc(`invites/${inviteId}`).delete();
  return c.json({ ok: true });
});

/** Claims pending invites for the signed-in user's verified email. */
members.post('/me/claim', async (c) => {
  const user = c.get('user');
  const email = String(user.email ?? '').toLowerCase();
  if (!email || user.email_verified === false) return c.json({ claimed: 0 });
  const s = await db.collection('invites').where('email', '==', email).get();
  for (const inv of s.docs) {
    await addMember(inv.get('brandId'), user.uid, email, String(user.name ?? email), inv.get('role'), inv.get('canApprove') === true, inv.get('invitedBy'), cleanSections(inv.get('sections')));
    await inv.ref.delete();
  }
  return c.json({ claimed: s.size });
});
