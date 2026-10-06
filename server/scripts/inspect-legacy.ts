// READ-ONLY schema survey of the legacy databases. Prints collection names, counts and
// field names/types only — never values (orbit holds plain-text credentials).
// Usage: npx tsx server/scripts/inspect-legacy.ts
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

const app = initializeApp({ credential: applicationDefault(), projectId: 'braindy-brand-guideline' });

const LEGACY = {
  brands: '(default)',
  brief: 'ai-studio-5a30c0b0-483a-4f53-a864-8d0cc7128673',
  orbit: 'ai-studio-f47795fa-4e77-4400-aaa0-e3328cfb9828',
} as const;

// Namén Vargas website collections in (default): never read.
const SKIP = new Set(['team_members', 'page_content', 'blog_posts', 'testimonials', 'inquiries']);

function typeOf(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return `array(${v.length ? typeOf(v[0]) : '?'})`;
  if (typeof v === 'object' && v && 'toDate' in v) return 'timestamp';
  if (typeof v === 'object') return `{${Object.keys(v as object).slice(0, 12).join(',')}}`;
  return typeof v;
}

async function survey(label: string, db: Firestore, depth = 0, path?: string) {
  const cols = path ? await db.doc(path).listCollections() : await db.listCollections();
  for (const col of cols) {
    if (!path && label === 'brands' && SKIP.has(col.id)) {
      console.log(`  [skipped] ${col.id}`);
      continue;
    }
    const snap = await col.get();
    const fields = new Map<string, string>();
    snap.docs.forEach((d) => Object.entries(d.data()).forEach(([k, v]) => fields.set(k, typeOf(v))));
    const pad = '  '.repeat(depth + 1);
    console.log(`${pad}${col.path}  (${snap.size} docs)`);
    console.log(`${pad}  fields: ${[...fields].map(([k, t]) => `${k}:${t}`).join(' | ')}`);
    if (depth < 1 && snap.docs[0]) await survey(label, db, depth + 1, snap.docs[0].ref.path);
  }
}

for (const [label, id] of Object.entries(LEGACY)) {
  console.log(`\n=== ${label} · ${id}`);
  await survey(label, getFirestore(app, id));
}
