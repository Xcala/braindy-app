// Loads the first NickMark Taste catalog (10 lessons, 10 objections) into `braindy-app` as DRAFTS.
// Idempotent: existing documents are left alone (Nicolas's edits win) unless --force. Prints a report.
//   npx tsx scripts/criterio/seed.ts --dry-run
//   npx tsx scripts/criterio/seed.ts            (writes missing ones)
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { LOGO_LESSONS } from './lessons-logos.js';
import { STRATEGY_LESSONS } from './lessons-strategy.js';
import { WEB_LESSONS } from './lessons-web.js';
import { OBJECTIONS } from './objections.js';

const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');
const db = getFirestore(initializeApp({ credential: applicationDefault(), projectId: 'braindy-brand-guideline' }), 'braindy-app');

const lessons = [...WEB_LESSONS.filter((l) => l.area === 'process'), ...LOGO_LESSONS, ...STRATEGY_LESSONS, ...WEB_LESSONS.filter((l) => l.area !== 'process')];
const ids = new Set(lessons.map((l) => l.id));
const broken = OBJECTIONS.filter((o) => o.lessonId && !ids.has(o.lessonId));
if (broken.length) throw new Error(`Objections link to missing lessons: ${broken.map((o) => o.id).join(', ')}`);

const report = { lessons: { write: 0, kept: 0 }, objections: { write: 0, kept: 0 } };
async function put(col: 'lessons' | 'objections', id: string, data: Record<string, unknown>) {
  const ref = db.doc(`${col}/${id}`);
  if (!force && (await ref.get()).exists) { report[col].kept++; return; }
  report[col].write++;
  if (!dryRun) await ref.set({ ...data, status: 'draft', updatedAt: FieldValue.serverTimestamp() });
}

for (const { id, ...l } of lessons) await put('lessons', id, l);
for (const { id, ...o } of OBJECTIONS) await put('objections', id, o);

console.log(`NickMark Taste seed${dryRun ? ' · DRY RUN' : ''}${force ? ' · FORCE' : ''}`);
console.log(`lessons:    ${report.lessons.write} ${dryRun ? 'would be written' : 'written'}, ${report.lessons.kept} already there (kept)`);
console.log(`objections: ${report.objections.write} ${dryRun ? 'would be written' : 'written'}, ${report.objections.kept} already there (kept)`);
