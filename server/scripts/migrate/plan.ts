// Builds the phase 1 migration plan from legacy data. Pure: no reads, no writes.
import {
  ADMIN_EMAILS, ALIASES, CANONICAL_NAMES, IGNORED_NAMES, INTERNAL_BRAND, INTERNAL_TITLES,
  MEMBER_OVERRIDES, POSSIBLE_DUPLICATES, STAFF_DOMAINS,
} from './config.js';
import type { LegacyData, Row } from './legacy.js';

export interface PlannedAsset {
  id: string;
  type: 'logodeck' | 'marketmap' | 'file';
  title: string;
  url: string | null;
  storagePath: string | null;
  publicSlug: string | null;
  status: string;
  data?: Record<string, unknown>;
  legacy: { db: string; collection: string; id: string };
  sizeBytes: number;
}

export interface PlannedMember {
  uid: string;
  email: string;
  role: 'client_owner' | 'client_member';
  canApprove: boolean;
  via: string;
}

export interface PlannedBrand {
  id: string;
  name: string;
  status: string;
  logoUrl: string | null;
  legacyIds: { brands: string[]; orbit: string[]; brandingProjects: string[]; briefEmails: string[] };
  sourceNames: Set<string>;
  context: Record<string, Record<string, unknown>>;
  assets: PlannedAsset[];
  members: PlannedMember[];
}

export interface PlannedUser {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'client';
  brandIds: string[];
}

export interface Plan {
  brands: PlannedBrand[];
  users: PlannedUser[];
  skipped: Array<{ source: string; id: string; name: string; reason: string }>;
  flags: string[];
}

export const normalize = (s: unknown) =>
  String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const slugify = (s: string) => normalize(s).replace(/ /g, '-');
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const millis = (v: unknown) =>
  v && typeof v === 'object' && 'toMillis' in v ? (v as { toMillis(): number }).toMillis() : 0;
const sizeOf = (v: unknown) => Buffer.byteLength(JSON.stringify(v ?? null));

/** Firestore's hard limit is 1 MiB per document; keep a margin for the other fields. */
const MAX_INLINE_BYTES = 800_000;

export function buildPlan(src: LegacyData): Plan {
  const brands = new Map<string, PlannedBrand>();
  const skipped: Plan['skipped'] = [];
  const flags: string[] = [];

  const resolveKey = (name: unknown): string | null => {
    const n = normalize(name);
    if (!n || IGNORED_NAMES.includes(n)) return null;
    return ALIASES[n] ?? n;
  };

  const ensure = (key: string, displayName: string): PlannedBrand => {
    let b = brands.get(key);
    if (!b) {
      const name = CANONICAL_NAMES[key] ?? displayName.trim();
      b = {
        id: slugify(name), name, status: 'active', logoUrl: null,
        legacyIds: { brands: [], orbit: [], brandingProjects: [], briefEmails: [] },
        sourceNames: new Set(), context: {}, assets: [], members: [],
      };
      brands.set(key, b);
    }
    b.sourceNames.add(displayName.trim());
    return b;
  };

  ensure(INTERNAL_BRAND, 'Braindy');

  // 1 · brands.clients
  const clientKey = new Map<string, string>();
  for (const c of src.clients) {
    const key = resolveKey(c.name);
    if (!key) { skipped.push({ source: 'brands.clients', id: c.id, name: String(c.name), reason: 'empty or generic name' }); continue; }
    const b = ensure(key, String(c.name));
    b.legacyIds.brands.push(c.id);
    b.logoUrl ??= str(c.logoUrl);
    clientKey.set(c.id, key);
  }

  // 2 · orbit.projects (credentials are never read)
  const orbitKey = new Map<string, string>();
  for (const p of src.orbitProjects) {
    const key = resolveKey(p.client);
    if (!key) { skipped.push({ source: 'orbit.projects', id: p.id, name: String(p.client), reason: 'empty client name' }); continue; }
    const b = ensure(key, String(p.client));
    b.legacyIds.orbit.push(p.id);
    b.logoUrl ??= str(p.logo);
    if (p.isArchived === true) b.status = b.legacyIds.brands.length ? b.status : 'archived';
    orbitKey.set(p.id, key);
  }

  // 3 · brands.brandingProjects → context (primary) + logodeck assets
  const byBrand = new Map<string, Row[]>();
  for (const bp of src.brandingProjects) {
    if (bp.deleted === true) { skipped.push({ source: 'brandingProjects', id: bp.id, name: String(bp.name), reason: 'marked deleted' }); continue; }
    const key = (str(bp.clientId) && clientKey.get(String(bp.clientId))) || resolveKey(bp.clientName) || resolveKey(bp.name);
    if (!key) { skipped.push({ source: 'brandingProjects', id: bp.id, name: String(bp.name), reason: 'placeholder name' }); continue; }
    if (!brands.has(key)) flags.push(`New brand "${bp.name}" exists only as a brand book (no client in brands or orbit).`);
    const b = ensure(key, String(bp.name));
    b.legacyIds.brandingProjects.push(bp.id);
    byBrand.set(key, [...(byBrand.get(key) ?? []), bp]);
  }
  for (const [key, list] of byBrand) {
    const b = brands.get(key)!;
    const primary = [...list].sort((x, y) =>
      Number(!!y.clientId) - Number(!!x.clientId) || millis(y.updatedAt) - millis(x.updatedAt))[0];
    b.context.identity = {
      logos: primary.logos ?? null,
      colors: primary.colors ?? [],
      typography: primary.typography ?? [],
      designConceptImage: str(primary.designConceptImage),
      heroImage: str(primary.heroImage),
      galleryAssets: primary.galleryAssets ?? [],
      source: { collection: 'brandingProjects', id: primary.id },
    };
    if (primary.brandVoice) b.context.voice = { ...(primary.brandVoice as object), source: { collection: 'brandingProjects', id: primary.id } };
    if (list.length > 1) flags.push(`${b.name}: ${list.length} brand books; context taken from "${primary.name}" (${primary.id}), the rest kept as LogoDeck assets.`);

    for (const bp of list) {
      const data = { heroTitle: bp.heroTitle ?? null, heroSubtitle: bp.heroSubtitle ?? null, sections: bp.sections ?? [], deckSlides: bp.deckSlides ?? [] };
      const size = sizeOf(data);
      const inline = size <= MAX_INLINE_BYTES;
      if (!inline) flags.push(`${b.name}: LogoDeck "${bp.name}" is ${(size / 1024).toFixed(0)} KB, too big to inline; it will be stored as a JSON file in the new bucket.`);
      b.assets.push({
        id: `deck-${bp.id}`, type: 'logodeck', title: String(bp.name), url: null, storagePath: null,
        publicSlug: str(bp.slug), status: bp.shared === true ? 'published' : 'draft',
        data: inline ? data : undefined,
        legacy: { db: '(default)', collection: 'brandingProjects', id: bp.id }, sizeBytes: size,
      });
    }
  }

  // 4 · brands.marketMaps → marketmap assets
  const brandByTitle = (title: string) =>
    [...brands.keys()].filter((k) => k !== INTERNAL_BRAND && k.length > 3).find((k) => normalize(title).includes(k));
  for (const m of src.marketMaps) {
    const title = String(m.title ?? 'Untitled');
    let key: string | undefined;
    let how = '';
    if (INTERNAL_TITLES.includes(normalize(title))) { key = INTERNAL_BRAND; how = 'internal'; }
    else if (str(m.clientId) && clientKey.get(String(m.clientId))) key = clientKey.get(String(m.clientId));
    else if (resolveKey(m.clientName) && brands.has(resolveKey(m.clientName)!)) key = resolveKey(m.clientName)!;
    else if ((key = brandByTitle(title))) how = 'matched by title';
    else { key = INTERNAL_BRAND; how = 'unassigned'; }
    if (how === 'matched by title') flags.push(`Market map "${title}" assigned to ${brands.get(key)!.name} by its title.`);
    if (how === 'unassigned') flags.push(`Market map "${title}" has no client; filed under Braindy (internal) until you say otherwise.`);
    brands.get(key)!.assets.push({
      id: `mm-${m.id}`, type: 'marketmap', title, url: str(m.htmlFileUrl),
      storagePath: null, publicSlug: str(m.slug), status: String(m.status ?? 'draft'),
      data: { description: m.description ?? null, coverImageUrl: m.coverImageUrl ?? null, htmlFiles: m.htmlFiles ?? [] },
      legacy: { db: '(default)', collection: 'marketMaps', id: m.id }, sizeBytes: sizeOf(m),
    });
  }

  // 5 · orbit.documents → file assets
  for (const d of src.orbitDocuments) {
    const key = orbitKey.get(String(d.projectId));
    if (!key) { skipped.push({ source: 'orbit.documents', id: d.id, name: String(d.title), reason: 'project not found' }); continue; }
    brands.get(key)!.assets.push({
      id: `doc-${d.id}`, type: 'file', title: String(d.title), url: str(d.url), storagePath: str(d.storagePath),
      publicSlug: null, status: 'published', data: { mimeType: d.mimeType ?? null, size: d.size ?? null },
      legacy: { db: 'orbit', collection: 'documents', id: d.id }, sizeBytes: sizeOf(d),
    });
  }

  // 6 · orbit.artemisSessions summaries → context.intake
  const emptySessions = src.orbitSessions.filter((s) => !str(s.summary)).length;
  for (const s of src.orbitSessions) {
    const key = orbitKey.get(String(s.projectId));
    if (!str(s.summary) || !key) continue;
    const b = brands.get(key)!;
    const prev = (b.context.intake?.summaries as unknown[]) ?? [];
    b.context.intake = { summaries: [...prev, { text: s.summary, sessionId: s.id }] };
  }
  if (emptySessions) flags.push(`${emptySessions} of ${src.orbitSessions.length} intake sessions have no summary; nothing to migrate from them.`);

  const users = planUsers(src, brands, orbitKey, flags, skipped);

  for (const [a, b] of POSSIBLE_DUPLICATES) {
    if (brands.has(a) || brands.has(b)) flags.push(`Possible duplicate, NOT merged: "${a}" and "${b}". Add to ALIASES in config.ts to merge.`);
  }
  const ids = [...brands.values()].map((b) => b.id);
  ids.filter((id, i) => ids.indexOf(id) !== i).forEach((id) => flags.push(`ERROR: two brands would share id "${id}".`));

  return { brands: [...brands.values()], users, skipped, flags };
}

function planUsers(
  src: LegacyData,
  brands: Map<string, PlannedBrand>,
  orbitKey: Map<string, string>,
  flags: string[],
  skipped: Plan['skipped'],
): PlannedUser[] {
  const authByEmail = new Map(src.authUsers.filter((u) => u.email).map((u) => [u.email!.toLowerCase(), u]));
  const isStaff = (e: string) => STAFF_DOMAINS.some((d) => e.endsWith(`@${d}`));
  const wanted = new Map<string, Set<string>>(); // email → brand keys
  const via = new Map<string, string>();
  const add = (email: unknown, key: string | undefined, source: string) => {
    const e = String(email ?? '').trim().toLowerCase();
    if (!e || !key) return;
    wanted.set(e, (wanted.get(e) ?? new Set()).add(key));
    via.set(`${e}|${key}`, source);
  };

  const emailByUid = new Map(src.authUsers.filter((u) => u.email).map((u) => [u.uid, u.email!]));
  const toEmail = (v: unknown) => (String(v ?? '').includes('@') ? String(v) : emailByUid.get(String(v)));
  const keyOfBrandId = new Map([...brands].map(([k, b]) => [b.id, k]));

  for (const p of src.orbitProjects) {
    for (const e of (p.memberEmails as unknown[]) ?? []) add(e, orbitKey.get(p.id), 'orbit project member');
    for (const id of (p.memberIds as unknown[]) ?? []) add(toEmail(id), orbitKey.get(p.id), 'orbit project member');
  }
  for (const b of brands.values()) {
    for (const bpId of b.legacyIds.brandingProjects) {
      const bp = src.brandingProjects.find((x) => x.id === bpId);
      for (const u of (bp?.usersWithAccess as unknown[]) ?? []) add(toEmail(u), keyOfBrandId.get(b.id), 'brand book access');
    }
  }

  // Email domain matches a brand (e.g. @quimiolab.com → quimiolab). Proposed, flagged for review.
  const allEmails = new Set([
    ...src.authUsers.map((u) => u.email?.toLowerCase()),
    ...src.briefRequests.map((r) => String(r.requestedBy ?? '').toLowerCase()),
  ].filter((e): e is string => !!e && e.includes('@')));
  for (const e of allEmails) {
    if (wanted.has(e) || isStaff(e) || MEMBER_OVERRIDES[e]) continue;
    const domain = e.split('@')[1].split('.')[0];
    const key = [...brands.keys()].find((k) => k !== INTERNAL_BRAND && k.replace(/ /g, '').length > 3 && domain.includes(k.replace(/ /g, '')));
    if (key) {
      add(e, key, 'email domain');
      flags.push(`${e} → ${brands.get(key)!.name} by email domain (confirm).`);
    }
  }

  const briefEmails = new Set(src.briefRequests.map((r) => String(r.requestedBy ?? '').toLowerCase()).filter(Boolean));
  for (const e of briefEmails) {
    if (MEMBER_OVERRIDES[e] || wanted.has(e) || isStaff(e)) continue;
    const sample = src.briefRequests.filter((r) => String(r.requestedBy).toLowerCase() === e).slice(0, 3).map((r) => r.projectName);
    flags.push(`Brief user ${e} has no brand yet (requests: ${sample.join(' / ')}). Set it in MEMBER_OVERRIDES.`);
  }
  for (const [e, o] of Object.entries(MEMBER_OVERRIDES)) add(e, o.brand, 'override');

  const users = new Map<string, PlannedUser>();
  for (const email of ADMIN_EMAILS) {
    const u = authByEmail.get(email);
    if (u) users.set(u.uid, { uid: u.uid, email, name: u.displayName ?? email, role: 'admin', brandIds: [] });
  }

  for (const [email, keys] of wanted) {
    if (isStaff(email)) { skipped.push({ source: 'members', id: email, name: email, reason: 'Braindy staff, not a client member' }); continue; }
    const auth = authByEmail.get(email);
    if (!auth) { skipped.push({ source: 'members', id: email, name: email, reason: 'no Auth account' }); continue; }
    for (const key of keys) {
      const b = brands.get(key);
      if (!b) { flags.push(`Override for ${email} points to unknown brand "${key}".`); continue; }
      if (briefEmails.has(email)) b.legacyIds.briefEmails.push(email);
      const o = MEMBER_OVERRIDES[email];
      b.members.push({
        uid: auth.uid, email, role: o?.role ?? 'client_member',
        canApprove: o?.canApprove ?? false, via: via.get(`${email}|${key}`) ?? '?',
      });
      const u = users.get(auth.uid) ?? { uid: auth.uid, email, name: auth.displayName ?? email, role: 'client' as const, brandIds: [] };
      u.brandIds.push(b.id);
      users.set(auth.uid, u);
    }
  }

  // A brand's only member becomes its owner (unless overridden).
  for (const b of brands.values()) {
    if (b.members.length === 1 && !MEMBER_OVERRIDES[b.members[0].email]) {
      b.members[0].role = 'client_owner';
      b.members[0].canApprove = true;
    } else if (b.members.length > 1 && !b.members.some((m) => m.role === 'client_owner')) {
      flags.push(`${b.name}: ${b.members.length} members and no owner. Pick one in MEMBER_OVERRIDES.`);
    }
  }

  const known = new Set([...users.values()].map((u) => u.email));
  const legacyEmails = [...src.brandsUsers, ...src.orbitUsers].map((u) => String(u.email ?? '').toLowerCase()).filter(Boolean);
  const orphans = [...new Set(legacyEmails)].filter((e) => !known.has(e) && !isStaff(e));
  if (orphans.length) flags.push(`${orphans.length} legacy users have no brand and will see "not connected yet": ${orphans.join(', ')}`);

  return [...users.values()];
}
