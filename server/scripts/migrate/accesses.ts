// Migrates orbit credentials (plain text inside orbit projects[].credentials) into brands/{id}/accesses,
// encrypting each password with Cloud KMS on the way in. Reads orbit only; never prints or logs values.
// Idempotent: ids orbit-<project>-<credential>; existing accesses are left untouched (they may have been edited).
//   npm run migrate:accesses -w server             (dry-run: report with platforms and counts only)
//   npm run migrate:accesses -w server -- --write  (needs the KMS key `accesses` and encrypt permission)
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { seal } from '../../src/vault.js';

const write = process.argv.includes('--write');
const app = initializeApp({ credential: applicationDefault(), projectId: 'braindy-brand-guideline' });
const orbit = getFirestore(app, 'ai-studio-f47795fa-4e77-4400-aaa0-e3328cfb9828'); // read-only
const target = getFirestore(app, 'braindy-app');

type Cred = { id?: string; platform?: string; link?: string; username?: string; password?: string; category?: string };
const safe = (s: string) => s.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60) || 'x';
const report: string[] = [];
let found = 0, created = 0, existing = 0, empty = 0;

const brands = await target.collection('brands').get();
for (const b of brands.docs) {
  const orbitIds = (b.get('legacyIds.orbit') as string[]) ?? [];
  for (const pid of orbitIds) {
    const p = await orbit.doc(`projects/${pid}`).get();
    const creds = ((p.get('credentials') as Cred[]) ?? []).filter((c) => c && (c.platform || c.username || c.password));
    for (const [i, c] of creds.entries()) {
      found++;
      const id = `orbit-${safe(pid)}-${safe(c.id ?? String(i))}`;
      const ref = target.doc(`brands/${b.id}/accesses/${id}`);
      if ((await ref.get()).exists) { existing++; continue; }
      const hasSecret = !!c.password;
      if (!hasSecret) empty++;
      report.push(`- ${b.id}: ${String(c.platform ?? '(no platform)').slice(0, 60)}${hasSecret ? '' : ' · no password'}`);
      if (!write) continue;
      if (hasSecret) {
        const s = await seal(String(c.password), `brands/${b.id}/accesses/${id}`);
        await target.doc(`accessSecrets/${b.id}__${id}`).set({ ...s, brandId: b.id, accessId: id, updatedAt: FieldValue.serverTimestamp() });
      }
      await ref.set({
        platform: String(c.platform ?? 'Access').slice(0, 80), username: String(c.username ?? '').slice(0, 200),
        link: String(c.link ?? '').slice(0, 500), notes: c.category ? String(c.category).slice(0, 200) : '',
        hasSecret, sharedWithBraindy: false, legacy: { orbitProjectId: pid },
        createdBy: 'migration', updatedBy: 'migration', updatedByName: 'Orbit', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      });
      await target.collection(`brands/${b.id}/accessLog`).doc().set({ accessId: id, platform: String(c.platform ?? 'Access'), action: 'added', by: 'migration', byName: 'Orbit', at: FieldValue.serverTimestamp() });
      created++;
    }
  }
}

const dir = resolve(import.meta.dirname, '../../../migration-reports');
mkdirSync(dir, { recursive: true });
const file = resolve(dir, `accesses-${write ? 'write' : 'dry-run'}-${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
writeFileSync(file, [
  `# Orbit credentials → accesses · ${write ? 'write' : 'dry-run'}`, '',
  `${found} credentials found · ${write ? `${created} created` : `${found - existing} to create`} · ${existing} already migrated · ${empty} without password`, '',
  'Platforms only. Values are never printed.', '', ...report,
].join('\n'));
console.log(`${write ? 'Created' : 'Would create'} ${write ? created : found - existing} accesses (${found} found, ${existing} existing). Report: ${file}`);
