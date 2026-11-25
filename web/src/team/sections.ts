import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';

/** Parts of the app NickMark opens or closes per person (same list as the API and firestore.rules). Home is always open. */
export const SECTIONS = ['brand', 'requests', 'files', 'apps', 'research', 'results', 'learn', 'accesses', 'billing'] as const;
export type Section = (typeof SECTIONS)[number];
const SENSITIVE: Section[] = ['accesses', 'billing'];

/** Ready-made profiles; anything else reads as "custom". */
export const PROFILES = {
  all: [...SECTIONS],
  team: SECTIONS.filter((s) => !SENSITIVE.includes(s)),
  view: ['brand', 'files', 'apps', 'research', 'results', 'learn'] as Section[],
} as const;
export type Profile = keyof typeof PROFILES | 'custom';

export type MemberLike = { role?: string; sections?: string[] | null };

/** A member's sections: the ones NickMark picked, or by role (owners everything, members all but accesses and billing). */
export function sectionsOf(m: MemberLike): Section[] {
  if (Array.isArray(m.sections)) return SECTIONS.filter((x) => m.sections!.includes(x));
  return m.role === 'client_owner' ? [...SECTIONS] : [...PROFILES.team];
}

export function profileOf(m: MemberLike): Profile {
  const s = sectionsOf(m);
  const same = (p: readonly Section[]) => p.length === s.length && p.every((x) => s.includes(x));
  if (m.role === 'client_owner' && same(PROFILES.all)) return 'all';
  return same(PROFILES.team) ? 'team' : same(PROFILES.view) ? 'view' : 'custom';
}

/** Which section each client route belongs to. */
export const ROUTE_SECTION: Record<string, Section> = {
  '/brand': 'brand', '/requests': 'requests', '/assets': 'files', '/deliveries': 'files', '/apps': 'apps', '/calendar': 'files', '/pauta': 'files', '/research': 'research',
  '/report': 'results', '/learn': 'learn', '/accesses': 'accesses', '/pay': 'billing', '/plan': 'billing',
};
export const sectionOfPath = (path: string) => ROUTE_SECTION[`/${path.split('/')[1] ?? ''}`];

/** The signed-in person's sections on the current brand: the nearest membership (brand, then its groups) decides. */
export function useMySections() {
  const { user, profile } = useAuth();
  const { current, brands, loading } = useBrands();
  const isAdmin = profile?.role === 'admin';
  const chain: string[] = [];
  for (let b: typeof current | undefined = current; b && chain.length < 4; b = brands.find((x) => x.id === b!.groupId)) chain.push(b.id);
  const key = chain.join('/');
  const [docs, setDocs] = useState<Record<string, MemberLike | null>>({});
  useEffect(() => {
    if (isAdmin || !user || !key) return;
    const ids = key.split('/');
    const offs = ids.map((id) => onSnapshot(doc(db, 'brands', id, 'members', user.uid),
      (s) => setDocs((d) => ({ ...d, [id]: s.exists() ? (s.data() as MemberLike) : null })), () => setDocs((d) => ({ ...d, [id]: null }))));
    return () => offs.forEach((off) => off());
  }, [isAdmin, user, key]);
  // Results only exists for brands where it was switched on, for everyone (admin included).
  const resultsOk = (s?: Section) => s !== 'results' || !!current?.resultsOn;
  // A group has nothing of its own: Home lists its companies and only Learn stays (2026-11-20), admin included.
  const groupOk = (s?: Section) => current?.kind !== 'group' || !s || s === 'learn';
  if (isAdmin) return { ready: !loading, can: (s?: Section) => resultsOk(s) && groupOk(s) };
  const ids = key ? key.split('/') : [];
  // Not ready until the brand is known: a reload on a deep link must not send the person home before it loads.
  const ready = ids.length > 0 && ids.every((id) => id in docs);
  const nearest = ids.map((id) => docs[id]).find(Boolean);
  // The brand's own switches win over each person's sections.
  const off = current?.sectionsOff ?? [];
  const mine = new Set((nearest ? sectionsOf(nearest) : []).filter((s) => !off.includes(s)));
  return { ready, can: (s?: Section) => !s || (mine.has(s) && resultsOk(s) && groupOk(s)) };
}
