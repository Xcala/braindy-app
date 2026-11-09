// AI health (admin): one aiCalls doc per Claude call made by braindy-api — who it was for, how long it took,
// how many tries, what it cost and why it failed. Never the prompt or the answer. Three failures in 15 minutes
// raise one alert an hour (an ERROR line for Error Reporting + a flag the admin Today page shows).
import { Hono } from 'hono';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { logError } from './guard.js';
import type { AuthEnv } from './auth.js';

export type Call = {
  brandId: string | null; kind: string; taskId: string | null; requestId: string | null; model: string;
  ok: boolean; error?: string; ms: number; attempts: number; usd?: number; input?: number; output?: number;
};

const ALERT_WINDOW = 15 * 60_000;
const ALERT_AT = 3;
const ALERT_EVERY = 60 * 60_000;

/** Never throws: logging must not break the work it measures. */
export async function recordCall(c: Call) {
  try {
    await db.collection('aiCalls').add({ ...c, at: FieldValue.serverTimestamp() });
    if (!c.ok) await maybeAlert();
  } catch (e) {
    logError(e, { where: 'aiCalls' });
  }
}

async function maybeAlert() {
  const since = Timestamp.fromMillis(Date.now() - ALERT_WINDOW);
  const recent = await db.collection('aiCalls').where('at', '>=', since).select('ok').get();
  const failed = recent.docs.filter((d) => d.get('ok') === false).length;
  if (failed < ALERT_AT) return;
  const ref = db.doc('ops/aiAlert');
  const last = ((await ref.get()).get('at') as Timestamp | undefined)?.toMillis() ?? 0;
  if (Date.now() - last < ALERT_EVERY) return;
  await ref.set({ at: FieldValue.serverTimestamp(), failed });
  logError(new Error(`AI failing: ${failed} failed calls in 15 minutes`), { where: 'ai-alert' });
}

const pctl = (xs: number[], p: number) => { if (!xs.length) return 0; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

export const adminAiHealth = new Hono<AuthEnv>();
adminAiHealth.use('/ai-health', async (c, next) => {
  if ((await db.doc(`users/${c.get('user').uid}`).get()).get('role') !== 'admin') return c.json({ error: 'forbidden' }, 403);
  await next();
});

/** Summary of the last `days` (1–30): totals, by kind, by brand, by day, latest errors, Brain tasks that fell back or got stuck. */
adminAiHealth.get('/ai-health', async (c) => {
  const days = Math.min(30, Math.max(1, Number(c.req.query('days')) || 7));
  const since = Timestamp.fromMillis(Date.now() - days * 864e5);
  const [calls, tasks, alert] = await Promise.all([
    db.collection('aiCalls').where('at', '>=', since).orderBy('at', 'desc').limit(5000).get(),
    db.collection('brainTasks').where('createdAt', '>=', since).orderBy('createdAt', 'desc').limit(2000).get(),
    db.doc('ops/aiAlert').get(),
  ]);
  const rows = calls.docs.map((d) => ({ ...(d.data() as Call), at: (d.get('at') as Timestamp | undefined)?.toMillis() ?? 0 }));
  const okRows = rows.filter((r) => r.ok);
  const group = (key: (r: (typeof rows)[number]) => string) => {
    const m = new Map<string, { key: string; calls: number; failed: number; retried: number; usd: number; ms: number[] }>();
    for (const r of rows) {
      const k = key(r);
      const g = m.get(k) ?? { key: k, calls: 0, failed: 0, retried: 0, usd: 0, ms: [] };
      g.calls++; if (!r.ok) g.failed++; if (r.attempts > 1) g.retried++; g.usd += r.usd ?? 0; if (r.ok) g.ms.push(r.ms);
      m.set(k, g);
    }
    return [...m.values()].map(({ ms, ...g }) => ({ ...g, p50: pctl(ms, 0.5) })).sort((a, b) => b.calls - a.calls);
  };
  const hourAgo = Date.now() - 3600_000;
  const stuckBefore = Date.now() - 15 * 60_000;
  const taskRows = tasks.docs.map((d) => ({ id: d.id, brain: d.get('brain'), brandId: d.get('brandId'), kind: d.get('kind'), title: d.get('title'), status: d.get('status'), ai: d.get('ai'), at: (d.get('createdAt') as Timestamp | undefined)?.toMillis() ?? 0 }));
  return c.json({
    configured: !!process.env.ANTHROPIC_API_KEY?.trim(),
    days,
    totals: {
      calls: rows.length, failed: rows.length - okRows.length, retried: rows.filter((r) => r.attempts > 1).length,
      usd: Math.round(rows.reduce((n, r) => n + (r.usd ?? 0), 0) * 100) / 100,
      p50: pctl(okRows.map((r) => r.ms), 0.5), p95: pctl(okRows.map((r) => r.ms), 0.95),
      failedLastHour: rows.filter((r) => !r.ok && r.at >= hourAgo).length,
    },
    byKind: group((r) => r.kind.replace(/^brain:/, '')),
    byBrand: group((r) => r.brandId ?? '—'),
    byDay: group((r) => new Date(r.at).toISOString().slice(0, 10)).sort((a, b) => a.key.localeCompare(b.key)),
    errors: rows.filter((r) => !r.ok).slice(0, 20).map((r) => ({ at: r.at, kind: r.kind, brandId: r.brandId, error: r.error, attempts: r.attempts })),
    tasks: {
      total: taskRows.length,
      fallback: taskRows.filter((r) => r.status === 'done' && r.ai === false).length,
      stuck: taskRows.filter((r) => r.status === 'running' && r.at < stuckBefore).slice(0, 20),
    },
    lastAlert: (alert.get('at') as Timestamp | undefined)?.toMillis() ?? null,
  });
});
