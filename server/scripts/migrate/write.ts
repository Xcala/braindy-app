// Applies a phase 1 plan to the `braindy-app` database. Idempotent: deterministic ids,
// merge writes, createdAt set only on first write. Never touches legacy databases.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { FieldValue, getFirestore, type WriteBatch } from 'firebase-admin/firestore';
import type { Plan } from './plan.js';

const app = initializeApp({ credential: applicationDefault(), projectId: 'braindy-brand-guideline' }, 'braindy-app-writer');
const db = getFirestore(app, 'braindy-app');
db.settings({ ignoreUndefinedProperties: true });

export async function applyPlan(plan: Plan): Promise<number> {
  let batch: WriteBatch = db.batch();
  let pending = 0;
  let total = 0;
  const flush = async () => {
    if (pending) await batch.commit();
    total += pending;
    batch = db.batch();
    pending = 0;
  };
  const set = async (path: string, data: Record<string, unknown>, merge = true) => {
    batch.set(db.doc(path), data, { merge });
    if (++pending === 400) await flush();
  };

  const existing = new Set((await db.collection('brands').select().get()).docs.map((d) => d.id));
  const migratedAt = FieldValue.serverTimestamp();

  for (const b of plan.brands) {
    const base = `brands/${b.id}`;
    await set(base, {
      name: b.name, slug: b.id, status: b.status, logoUrl: b.logoUrl, legacyIds: b.legacyIds, migratedAt,
      ...(existing.has(b.id) ? {} : { createdAt: migratedAt }),
    });
    for (const [doc, data] of Object.entries(b.context)) await set(`${base}/context/${doc}`, data, false);
    for (const a of b.assets) {
      await set(`${base}/assets/${a.id}`, {
        type: a.type, title: a.title, url: a.url, storagePath: a.storagePath, publicSlug: a.publicSlug,
        status: a.status, data: a.data, legacy: a.legacy, migratedAt,
      }, false);
    }
    for (const m of b.members) await set(`${base}/members/${m.uid}`, { role: m.role, canApprove: m.canApprove });
  }
  for (const u of plan.users) {
    await set(`users/${u.uid}`, { email: u.email, name: u.name, role: u.role, brandIds: u.brandIds });
  }
  await flush();
  return total;
}
