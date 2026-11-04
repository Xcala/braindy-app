import { db } from './firebase.js';

export interface Access {
  admin: boolean;
  member: boolean;
  role: 'client_owner' | 'client_member' | null;
  /** App sections this person may use on the brand (all of them for the admin). */
  sections: Section[];
}

/** Parts of the app NickMark can open or close per person. Home is always open. */
export const SECTIONS = ['brand', 'requests', 'files', 'apps', 'research', 'results', 'learn', 'accesses', 'billing'] as const;
export type Section = (typeof SECTIONS)[number];
const SENSITIVE: Section[] = ['accesses', 'billing'];

/** A member's sections: the ones NickMark picked, or by role (owners everything, members all but accesses and billing). Same as firestore.rules allowsAt. */
export function sectionsOf(m: { role?: string; sections?: unknown }): Section[] {
  if (Array.isArray(m.sections)) return SECTIONS.filter((x) => (m.sections as string[]).includes(x));
  return m.role === 'client_owner' ? [...SECTIONS] : SECTIONS.filter((x) => !SENSITIVE.includes(x));
}

/**
 * Same model as firestore.rules: admins see everything; a member of a brand or of any group above it
 * (brand.ancestors) has access. The nearest membership decides the role.
 */
export async function brandAccess(uid: string, brandId: string): Promise<Access> {
  const user = await db.doc(`users/${uid}`).get();
  if (user.get('role') === 'admin') return { admin: true, member: true, role: null, sections: [...SECTIONS] };

  const brand = await db.doc(`brands/${brandId}`).get();
  if (!brand.exists) return { admin: false, member: false, role: null, sections: [] };
  const chain = [brandId, ...((brand.get('ancestors') as string[]) ?? [])];
  for (const id of chain) {
    const m = await db.doc(`brands/${id}/members/${uid}`).get();
    // The brand's own switches (sectionsOff) win over the person's sections, as in firestore.rules.
    const off = (brand.get('sectionsOff') as string[] | undefined) ?? [];
    if (m.exists) return { admin: false, member: true, role: m.get('role') ?? 'client_member', sections: sectionsOf(m.data() ?? {}).filter((s) => !off.includes(s)) };
  }
  return { admin: false, member: false, role: null, sections: [] };
}

type FileAccess = { mode?: string; folders?: string[] };
/** Same rule as firestore.rules fileAllowed: which assets a client sees when NickMark picked the folders. */
export async function fileFilter(brandId: string) {
  const fa = ((await db.doc(`brands/${brandId}`).get()).get('fileAccess') ?? {}) as FileAccess;
  return (asset: FirebaseFirestore.DocumentSnapshot) => {
    if (fa.mode !== 'selected' || asset.get('source') === 'legacy') return true;
    const top = String(asset.get('folder') ?? '').split('/')[0];
    return top === 'Uploads' || (fa.folders ?? []).includes(top);
  };
}
