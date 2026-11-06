// Imports Claude Code session spend (tokens and the API-equivalent USD) into brands/{brandId}/usage, one doc per
// session, month and model. The project folder says which brand a session worked for; folders with no brand go to
// usageUnassigned. Reads the local transcripts only (~/.claude/projects); writes only to the braindy-app database.
// Idempotent (fixed doc ids, set); --dry-run prints the report without writing. Optional: --root <dir>.
import { createReadStream, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../../src/firebase.js';
import { claudeCost, tokensOf, type ClaudeUsage, type Tokens } from '../../src/usage.js';

const dry = process.argv.includes('--dry-run');
const rootArg = process.argv.indexOf('--root');
const ROOT = rootArg > 0 ? process.argv[rootArg + 1] : join(homedir(), '.claude', 'projects');

/** Folder words that name a brand differently from its id. */
const ALIASES: Record<string, string> = { level: 'revista-level', 'braindy-app': 'braindy', hacienda: 'hacienda-parrilla-bar', 'marco-polo': 'marco-polo-education' };

type Row = Tokens & { brandId: string | null; project: string; sessionId: string; month: string; model: string; last: string };

function brandFor(folder: string, ids: string[]): string | null {
  const f = `-${folder.toLowerCase().replace(/--claude-worktrees-.*$/, '')}-`;
  // The deepest folder wins: Banco-Familiar-Milohas is Milohas, not Banco Familiar.
  const end = (k: string) => f.lastIndexOf(`-${k}-`) + k.length;
  const hits = [...ids, ...Object.keys(ALIASES)].filter((k) => f.includes(`-${k}-`)).sort((a, b) => end(b) - end(a));
  return hits.length ? (ALIASES[hits[0]] ?? hits[0]) : null;
}

const jsonlIn = (dir: string): string[] => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? jsonlIn(p) : n.endsWith('.jsonl') ? [p] : [];
});

const ids = (await db.collection('brands').get()).docs.filter((d) => d.get('kind') !== 'group').map((d) => d.id);
const rows = new Map<string, Row>();
let lines = 0, bad = 0, files = 0;

for (const project of readdirSync(ROOT)) {
  if (!statSync(join(ROOT, project)).isDirectory()) continue;
  const brandId = brandFor(project, ids);
  for (const file of jsonlIn(join(ROOT, project))) {
    files++;
    // The same assistant message is written once per content block; keep its last usage only.
    const byMsg = new Map<string, { model: string; usage: ClaudeUsage; at: string; session: string }>();
    // Streamed line by line: a long session can be larger than what fits in one string.
    for await (const line of createInterface({ input: createReadStream(file), crlfDelay: Infinity })) {
      if (!line.trim()) continue;
      lines++;
      if (!line.includes('"usage"')) continue;
      try {
        const e = JSON.parse(line);
        const m = e.message;
        if (e.type !== 'assistant' || !m?.usage || !m.id || !m.model || m.model === '<synthetic>') continue;
        byMsg.set(m.id, { model: m.model, usage: m.usage, at: e.timestamp ?? '', session: e.sessionId ?? file });
      } catch { bad++; }
    }
    for (const { model, usage, at, session } of byMsg.values()) {
      const month = at.slice(0, 7) || 'unknown';
      const key = `${brandId ?? project}|${session}|${month}|${model}`;
      const t = tokensOf(usage);
      const r = rows.get(key) ?? { brandId, project, sessionId: session, month, model, last: at, input: 0, output: 0, cacheWrite5m: 0, cacheWrite1h: 0, cacheRead: 0 };
      for (const k of ['input', 'output', 'cacheWrite5m', 'cacheWrite1h', 'cacheRead'] as const) r[k] += t[k];
      if (at > r.last) r.last = at;
      rows.set(key, r);
    }
  }
}

// Report: per brand (or unassigned folder) tokens and API-equivalent USD.
const report = new Map<string, { usd: number; tokens: number; sessions: Set<string> }>();
for (const r of rows.values()) {
  const k = r.brandId ?? `(sin marca) ${r.project}`;
  const x = report.get(k) ?? { usd: 0, tokens: 0, sessions: new Set<string>() };
  x.usd += claudeCost(r.model, r); x.tokens += r.input + r.output + r.cacheWrite5m + r.cacheWrite1h + r.cacheRead; x.sessions.add(r.sessionId);
  report.set(k, x);
}
const total = [...report.values()].reduce((n, x) => n + x.usd, 0);
console.log(`${dry ? 'DRY RUN · ' : ''}${files} transcripts · ${lines} lines · ${bad} unreadable · ${rows.size} rows (session × month × model)`);
for (const [k, x] of [...report].sort((a, b) => b[1].usd - a[1].usd)) {
  console.log(`${k.padEnd(60)} ${String(x.sessions.size).padStart(4)} sessions  ${(x.tokens / 1e6).toFixed(1).padStart(8)}M tokens  US$${x.usd.toFixed(2).padStart(9)}  ${(x.usd / total * 100).toFixed(1).padStart(5)}%`);
}
console.log(`Total API-equivalent: US$${total.toFixed(2)}`);

if (!dry) {
  let batch = db.batch(), n = 0;
  for (const r of rows.values()) {
    const id = `cc-${r.sessionId}-${r.month}-${r.model}`.replace(/[^\w.-]/g, '_').slice(0, 1400);
    const ref = r.brandId ? db.doc(`brands/${r.brandId}/usage/${id}`) : db.doc(`usageUnassigned/${id}`);
    const at = r.last ? Timestamp.fromDate(new Date(r.last)) : Timestamp.now();
    batch.set(ref, {
      platform: 'claude', source: 'claude-code', model: r.model, input: r.input, output: r.output, cacheWrite5m: r.cacheWrite5m,
      cacheWrite1h: r.cacheWrite1h, cacheRead: r.cacheRead, usd: Math.round(claudeCost(r.model, r) * 1e6) / 1e6,
      kind: 'session', mode: 'agency', project: r.project, sessionId: r.sessionId, month: r.month, at,
    });
    if (++n % 400 === 0) { await batch.commit(); batch = db.batch(); }
  }
  await batch.commit();
  console.log(`Wrote ${n} docs.`);
}
