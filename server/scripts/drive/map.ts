// DRY-RUN: finds each brand's Drive folder and measures it (files, GB, types). Copies nothing.
//   npm run drive:map -w server
// Output: migration-reports/drive-map-<ts>.md (for Nicolas) and drive-map.json (input for the import).
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { FOLDER, getFile, idFromUrl, list, walk, type WalkedFile } from './client.js';
import { DRIVE_FOLDERS, EXCLUDED_FILE_NAMES, PROPOSALS_FOLDER, PROPOSALS_IGNORED } from './config.js';
import { normalize } from '../migrate/plan.js';

const app = initializeApp({ credential: applicationDefault(), projectId: 'braindy-brand-guideline' });
const appDb = getFirestore(app, 'braindy-app');
const orbitDb = getFirestore(app, 'ai-studio-f47795fa-4e77-4400-aaa0-e3328cfb9828'); // read-only

type Mapping = { brandId: string; name: string; folderId: string | null; source: string; candidates: string[] };

const brands = (await appDb.collection('brands').select('name', 'kind', 'legacyIds').get()).docs
  .map((d) => ({ id: d.id, name: String(d.get('name')), orbitIds: (d.get('legacyIds.orbit') as string[]) ?? [] }))
  .filter((b) => b.id !== 'braindy');

const orbitLinks = new Map(
  (await orbitDb.collection('projects').select('driveLink', 'resourcesLink', 'brandManualLink', 'driveLinks').get())
    .docs.map((d) => [d.id, [d.get('driveLink'), d.get('resourcesLink'), ...((d.get('driveLinks') as unknown[]) ?? []), d.get('brandManualLink')]]),
);

const mappings: Mapping[] = [];
for (const b of brands) {
  if (DRIVE_FOLDERS[b.id]) { mappings.push({ brandId: b.id, name: b.name, folderId: DRIVE_FOLDERS[b.id], source: 'config', candidates: [] }); continue; }

  // Orbit project links that point to a folder.
  let found: string | null = null;
  for (const link of b.orbitIds.flatMap((id) => orbitLinks.get(id) ?? [])) {
    const id = idFromUrl(link);
    if (!id) continue;
    try { if ((await getFile(id)).mimeType === FOLDER) { found = id; break; } } catch { /* not accessible */ }
  }
  if (found) { mappings.push({ brandId: b.id, name: b.name, folderId: found, source: 'orbit link', candidates: [] }); continue; }

  // Folder whose name equals the brand name (normalized).
  const word = b.name.split(/\s+/)[0].replace(/'/g, "\\'");
  const hits = (await list(`mimeType = '${FOLDER}' and name contains '${word}'`))
    .filter((f) => normalize(f.name) === normalize(b.name))
    .sort((x, y) => y.modifiedTime.localeCompare(x.modifiedTime));
  mappings.push({
    brandId: b.id, name: b.name, folderId: hits[0]?.id ?? null,
    source: hits.length ? `name match${hits.length > 1 ? ` (${hits.length} folders, newest chosen)` : ''}` : 'not found',
    candidates: hits.map((h) => h.id),
  });
}

// Measure. Child brand folders are excluded from their group's folder.
const mapped = new Set(mappings.map((m) => m.folderId).filter(Boolean) as string[]);
const kind = (f: WalkedFile) =>
  f.mimeType.startsWith('application/vnd.google-apps') ? 'google' :
  f.mimeType.startsWith('image/') ? 'image' : f.mimeType.startsWith('video/') ? 'video' :
  f.mimeType === 'application/pdf' ? 'pdf' : 'other';
const gb = (n: number) => (n / 1024 ** 3).toFixed(2);

const rows: string[] = [];
const out: Record<string, { folderId: string; files: number; bytes: number }> = {};
let totalFiles = 0, totalBytes = 0;
for (const m of mappings) {
  if (!m.folderId) { rows.push(`| ${m.name} | — | ${m.source} | | | |`); continue; }
  const skip = new Set([...mapped].filter((id) => id !== m.folderId));
  const files = (await walk(m.folderId, skip)).filter((f) => !EXCLUDED_FILE_NAMES.includes(f.name));
  const bytes = files.reduce((n, f) => n + Number(f.size ?? 0), 0);
  const byKind: Record<string, number> = {};
  files.forEach((f) => { byKind[kind(f)] = (byKind[kind(f)] ?? 0) + 1; });
  totalFiles += files.length; totalBytes += bytes;
  out[m.brandId] = { folderId: m.folderId, files: files.length, bytes };
  rows.push(`| ${m.name} | [folder](https://drive.google.com/drive/folders/${m.folderId}) | ${m.source} | ${files.length} | ${gb(bytes)} | ${Object.entries(byKind).map(([k, v]) => `${k} ${v}`).join(', ')} |`);
  console.log(`${m.name}: ${files.length} files, ${gb(bytes)} GB`);
}

const proposals = (await list(`'${PROPOSALS_FOLDER}' in parents`)).filter((p) => !PROPOSALS_IGNORED.includes(p.name));

const dir = resolve(import.meta.dirname, '../../../migration-reports');
mkdirSync(dir, { recursive: true });
writeFileSync(resolve(dir, 'drive-map.json'), JSON.stringify({ brands: out, proposalsFolder: PROPOSALS_FOLDER }, null, 2));
const report = [
  `# Drive map · dry-run · ${new Date().toISOString()}`, '',
  `Read-only. Nothing copied. Total: **${totalFiles} files · ${gb(totalBytes)} GB** (Google Docs/Slides count as 0 bytes; exported to PDF on import).`,
  `Estimated storage: ~USD ${(totalBytes / 1024 ** 3 * 0.02).toFixed(2)}/month.`, '',
  '| Brand | Folder | How found | Files | GB | Types |', '|---|---|---|---|---|---|', ...rows, '',
  `## Proposals (${proposals.length}) · from "Braindy Proposals"`, '',
  ...proposals.map((p) => `- ${p.name} (${p.mimeType === FOLDER ? 'folder' : p.mimeType})`),
].join('\n');
const file = resolve(dir, `drive-map-${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
writeFileSync(file, report);
console.log(`\nTotal ${totalFiles} files, ${gb(totalBytes)} GB. Report: ${file}`);
