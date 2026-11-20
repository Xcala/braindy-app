// Imports a Dapta call-log CSV into a brand's call history (`brands/{brandId}/calls/{call_id}`, source "dapta").
// Idempotent (the Dapta call_id is the document id). Test calls are skipped. Prints counts only, never phones or names.
//   npx tsx server/scripts/voice-import-dapta.ts <brandId> <file.csv> [--dry-run]
import { readFileSync } from 'node:fs';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../src/firebase.js';

const [brandId, file] = process.argv.slice(2);
const dry = process.argv.includes('--dry-run');
if (!brandId || !file) { console.error('Usage: voice-import-dapta.ts <brandId> <file.csv> [--dry-run]'); process.exit(1); }

function parseCsv(text: string): Record<string, string>[] {
  const t = text.replace(/^﻿/, '');
  const rows: string[][] = []; let row: string[] = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const [h, ...rest] = rows;
  return rest.filter((r) => r.length > 5).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i] ?? ''])));
}

const rows = parseCsv(readFileSync(file, 'utf8'));
const real = rows.filter((r) => r.is_test_call !== 'true' && r.call_id);
const sentiment = (s: string) => (s ? s.toLowerCase() : null);
let batch = db.batch(), n = 0;
for (const r of real) {
  const doc = {
    source: 'dapta', channel: 'telefono', direction: r.direction || 'inbound',
    startedAt: Timestamp.fromDate(new Date(r.created_at)),
    durationSec: Math.round((Number(r.duration_ms) || 0) / 1000),
    from: r.from_number || null,
    ended: r.disconnection_reason || null,
    summary: r['call_analysis.call_summary'] || null,
    sentiment: sentiment(r['call_analysis.user_sentiment']),
    credits: Number(r.credits) || null,
    importedAt: Timestamp.now(),
  };
  if (!dry) batch.set(db.doc(`brands/${brandId}/calls/${r.call_id}`), doc, { merge: true });
  if (++n % 400 === 0 && !dry) { await batch.commit(); batch = db.batch(); }
}
if (!dry && n % 400) await batch.commit();
const mins = real.reduce((a, r) => a + (Number(r.duration_ms) || 0), 0) / 60000;
console.log(`${dry ? '[dry-run] ' : ''}${n} calls ${dry ? 'would be' : ''} imported into brands/${brandId}/calls (${rows.length - real.length} test calls skipped, ${mins.toFixed(0)} min).`);
