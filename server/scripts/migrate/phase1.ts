// Phase 1 migration: brands, context, assets, members, users.
//   npm run migrate:phase1 -w server              → dry-run (default): reads legacy, writes only a local report
//   npm run migrate:phase1 -w server -- --write   → applies the plan to `braindy-app`
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readLegacy } from './legacy.js';
import { buildPlan } from './plan.js';
import { renderReport } from './report.js';

const write = process.argv.includes('--write');
const mode = write ? 'write' : 'dry-run';

const legacy = await readLegacy();
const plan = buildPlan(legacy);

const dir = resolve(import.meta.dirname, '../../../migration-reports');
mkdirSync(dir, { recursive: true });
const file = resolve(dir, `phase1-${mode}-${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
writeFileSync(file, renderReport(plan, mode));

if (plan.flags.some((f) => f.startsWith('ERROR'))) {
  console.error('Plan has errors; nothing written. See report:', file);
  process.exit(1);
}

if (write) {
  const { applyPlan } = await import('./write.js');
  const n = await applyPlan(plan);
  console.log(`Wrote ${n} documents to braindy-app.`);
}

console.log(`${mode}: ${plan.brands.length} brands, ${plan.users.length} users, ${plan.flags.length} flags. Report: ${file}`);
