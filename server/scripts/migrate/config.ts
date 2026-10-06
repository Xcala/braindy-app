// Phase 1 migration knobs. Edit here (not in code) to change how legacy records map to brands.
// Keys are normalized names (see normalize() in plan.ts): lowercase, no accents, no punctuation.
// Decisions by Nicolas on 2026-10-05 are recorded in docs/decisions.md.

/** Alias → canonical brand key. Merges duplicates across brands/orbit/brandingProjects/Drive. */
export const ALIASES: Record<string, string> = {
  'mayo road': 'mayo rd',
  'christine dyer': 'ms dyer',
  'christine dulany dyer': 'ms dyer',
  'marco polo': 'marco polo education',
  'cwi': 'community workforce institut',
  'ga': 'grupo alternativas',
  'namen vargas abogados': 'namen vargas',
  'sub marcas quimiolab': 'quimiolab',
  'jero66': 'jero berrio',
  'ibmt': 'grupo ibmt',
  'berrio': 'grupo berrio',
  'case en el aire': 'casa en el aire',
  'pls': 'principal learning strategies',
  'max group': 'mex group',
};

/** Display name to use for a canonical key when sources disagree. */
export const CANONICAL_NAMES: Record<string, string> = {
  'mayo rd': 'Mayo RD',
  'ms dyer': 'Ms Dyer',
  'marco polo education': 'Marco Polo Education',
  'community workforce institut': 'Community Workforce Institut',
  'grupo alternativas': 'Grupo Alternativas',
  'namen vargas': 'Namén Vargas',
  'jero berrio': 'Jero Berrío',
  'grupo berrio': 'Grupo Berrío',
  'grupo ibmt': 'Grupo IBMT',
  'ipark': 'iPark',
  'equipark': 'EquiPark',
  'casa en el aire': 'Casa en el Aire',
  'principal learning strategies': 'Principal Learning Strategies',
  'restaurantes': 'Restaurantes',
  'grupo alejandra': 'Grupo Alejandra',
  'mex group': 'MEX Group',
  'braindy': 'Braindy',
};

/**
 * Groups of brands. A group is itself a brand doc with kind "group"; children carry groupId.
 * Groups can nest (IBMT belongs to Berrío). Children listed here are created if missing.
 * Source: Drive folder "Berrio" — every subfolder is a brand that answers to Grupo Berrío.
 */
export const GROUPS: Record<string, { parent?: string; children: string[] }> = {
  'grupo berrio': {
    children: ['simbiotica', 'datanexus', 'hero', 'racering', 'orphipass', 'quindio bio tech', 'jero berrio', 'imedh', 'grupo ibmt'],
  },
  'grupo ibmt': {
    parent: 'grupo berrio',
    children: ['ipark', 'equipark', 'park media y plaza'],
  },
  // Decisions 2026-10-05 (Drive folders "Restaurantes", "Grupo Alejandra", "MEX Group").
  restaurantes: { children: ['puerta del sol', 'hacienda parrilla bar', 'casa en el aire'] },
  'grupo alejandra': { children: ['mayo rd', 'taxcan'] },
  'mex group': { children: ['toro mambo', 'lnsr'] },
};

/**
 * Clients from the Drive folder "Marcas Personales" (an organizing folder, not a group).
 * Not among the current clients, so they start archived; Nicolas activates them from the app.
 */
export const ARCHIVED_BRANDS: Record<string, string> = {
  'mariana duenas': 'Mariana Dueñas',
  'andrea carmona': 'Andrea Carmona',
  'fernanda gil': 'Fernanda Gil',
  'adriana penuela useche': 'Adriana Penuela-Useche',
  'monica bautista': 'Mónica Bautista',
  'nadia olea': 'Nadia Olea',
  'rusmila okuale': 'Rusmila Okuale',
  'andrea perez': 'Andrea Pérez',
  'rocio suarez': 'Rocío Suárez',
  'claudia rojas': 'Claudia Rojas',
  'cote': 'Coté',
  'ivana': 'Ivana',
};

/** Display names for brands that only exist as Drive folders. */
export const DRIVE_BRAND_NAMES: Record<string, string> = {
  simbiotica: 'Simbiótica',
  datanexus: 'Datanexus',
  hero: 'Hero',
  racering: 'RaceRing',
  'quindio bio tech': 'Quindío Bio Tech',
  imedh: 'Imedh',
  'park media y plaza': 'Park Media y Plaza',
};

/** The internal brand for Braindy's own documents. */
export const INTERNAL_BRAND = 'braindy';

/** Market maps / documents that belong to Braindy itself (by normalized title). */
export const INTERNAL_TITLES = ['ai 101', 'braindy prompt repository', 'pronostico world cup 2026'];

/** Generic or placeholder names that never become a brand. */
export const IGNORED_NAMES = ['new branding project', 'new logo presentation', 'pruebas'];

/** Brand books kept as LogoDeck assets but never used as the brand's main context. */
export const CONTEXT_EXCLUDED_NAMES = ['sub marcas quimiolab'];

/** Pairs that look related but are NOT merged automatically (reported only). */
export const POSSIBLE_DUPLICATES: Array<[string, string]> = [];

/** Braindy staff: never client members. Admin emails are Nicolas's accounts. */
export const STAFF_DOMAINS = ['braindy.co'];
export const ADMIN_EMAILS = ['nicolas@braindy.co', 'nicolas@xent.co'];

/**
 * Membership overrides: email → brand. When an email is listed here, every other membership
 * source (orbit, brand books, email domain) is ignored for it. Omit role to let the
 * "single member becomes owner" rule decide.
 */
type Override = { brand: string; role?: 'client_owner' | 'client_member'; canApprove?: boolean };
const quimiolab: Override = { brand: 'quimiolab' };
export const MEMBER_OVERRIDES: Record<string, Override> = {
  // All brief users are Quimiolab.
  'soporte@quimiolab.net': quimiolab,
  'caterinea@gmail.com': quimiolab,
  'danilocabreramendoza31@gmail.com': quimiolab,
  'pavadaniela599@gmail.com': quimiolab,
  'karolindiaz582@gmail.com': quimiolab,
  'danilo.cabrera@quimiolab.com': quimiolab,
  'paginaweb@quimiolab.com': quimiolab,
  'admin@marcopoloeducation.com': { brand: 'marco polo education' },
  // Only Revista Level (orbit also listed it on Banco Familiar and Quimiolab).
  'gerencia@revistalevel.com.co': { brand: 'revista level' },
};
