// Phase 1 migration knobs. Edit here (not in code) to change how legacy records map to brands.
// Keys are normalized names (see normalize() in plan.ts): lowercase, no accents, no punctuation.

/** Alias → canonical brand key. Merges duplicates across brands/orbit/brandingProjects. */
export const ALIASES: Record<string, string> = {
  'mayo road': 'mayo rd',
  'christine dyer': 'ms dyer',
  'christine dulany dyer': 'ms dyer',
  'marco polo': 'marco polo education',
  'cwi': 'community workforce institut',
  'ga': 'grupo alternativas',
  'namen vargas abogados': 'namen vargas',
};

/** Display name to use for a canonical key when sources disagree. */
export const CANONICAL_NAMES: Record<string, string> = {
  'mayo rd': 'Mayo RD',
  'ms dyer': 'Ms Dyer',
  'marco polo education': 'Marco Polo Education',
  'community workforce institut': 'Community Workforce Institut',
  'grupo alternativas': 'Grupo Alternativas',
  'namen vargas': 'Namén Vargas',
  'braindy': 'Braindy',
};

/** The internal brand for Braindy's own documents. */
export const INTERNAL_BRAND = 'braindy';

/** Market maps / documents that belong to Braindy itself (by normalized title). */
export const INTERNAL_TITLES = ['ai 101', 'braindy prompt repository', 'pronostico world cup 2026'];

/** Generic or placeholder names that never become a brand. */
export const IGNORED_NAMES = ['new branding project', 'new logo presentation'];

/**
 * Pairs that look related but are NOT merged automatically. Reported for Nicolas to decide;
 * to merge one, move it into ALIASES.
 */
export const POSSIBLE_DUPLICATES: Array<[string, string]> = [
  ['ipark', 'equipark'],
  ['sub marcas quimiolab', 'quimiolab'],
];

/** Emails that are Braindy staff, never client members. */
export const STAFF_DOMAINS = ['braindy.co'];
export const ADMIN_EMAILS = ['nicolas@braindy.co'];

/**
 * Manual membership overrides: email → { brandKey, role, canApprove }.
 * Filled after Nicolas reviews the dry-run report.
 */
export const MEMBER_OVERRIDES: Record<
  string,
  { brand: string; role: 'client_owner' | 'client_member'; canApprove?: boolean }
> = {};
