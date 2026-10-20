import { db } from './firebase.js';

export interface Access {
  admin: boolean;
  member: boolean;
  role: 'client_owner' | 'client_member' | null;
}

/**
 * Same model as firestore.rules: admins see everything; a member of a brand or of any group above it
 * (brand.ancestors) has access. The nearest membership decides the role.
 */
export async function brandAccess(uid: string, brandId: string): Promise<Access> {
  const user = await db.doc(`users/${uid}`).get();
  if (user.get('role') === 'admin') return { admin: true, member: true, role: null };

  const brand = await db.doc(`brands/${brandId}`).get();
  if (!brand.exists) return { admin: false, member: false, role: null };
  const chain = [brandId, ...((brand.get('ancestors') as string[]) ?? [])];
  for (const id of chain) {
    const m = await db.doc(`brands/${id}/members/${uid}`).get();
    if (m.exists) return { admin: false, member: true, role: m.get('role') ?? 'client_member' };
  }
  return { admin: false, member: false, role: null };
}
