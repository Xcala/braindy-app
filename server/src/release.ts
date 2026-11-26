// «Sube» from Braindy › Admin (2026-11-25, Nicolas): publishes the web app to production without any computer.
// It runs the GitHub workflow "Deploy web" with target=production on main (the workflow builds, checks and publishes).
// The GitHub token (fine-grained: Xcala/braindy-app only, Actions read/write) comes from Secret Manager as
// GITHUB_SUBE_TOKEN and is never sent to the browser. Admin only; every press is written to `audit`.
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { logError } from './guard.js';
import type { AuthEnv } from './auth.js';

const REPO = 'Xcala/braindy-app';
const WORKFLOW = 'deploy-web.yml';
const PROD = 'https://app.braindy.co';
const token = () => process.env.GITHUB_SUBE_TOKEN?.trim() ?? '';

async function gh<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`https://api.github.com/repos/${REPO}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token()}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'braindy-api', ...(init?.headers ?? {}) },
  });
  if (!r.ok) throw new Error(`github ${r.status}`);
  return (r.status === 204 ? null : await r.json()) as T;
}

/** The commit production was built from: GitHub builds carry the full commit id in the main bundle. */
async function liveSha(): Promise<string | null> {
  try {
    const html = await (await fetch(`${PROD}/?x=${Date.now()}`)).text();
    const js = html.match(/\/assets\/index-[^"]+\.js/)?.[0];
    if (!js) return null;
    const code = await (await fetch(PROD + js)).text();
    // The release id is a 40-character commit id; other long hex strings in the bundle are not commits on GitHub.
    for (const sha of [...new Set(code.match(/\b[0-9a-f]{40}\b/g) ?? [])].slice(0, 5)) {
      try { await gh(`commits/${sha}`); return sha; } catch { /* not a commit */ }
    }
    return null;
  } catch { return null; }
}

type Run = { id: number; status: string; conclusion: string | null; created_at: string; html_url: string; display_title: string; event: string; head_sha: string };
type Commit = { sha: string; commit: { message: string; author: { date: string } }; files?: { filename: string }[] };

export const adminRelease = new Hono<AuthEnv>();

adminRelease.use('*', async (c, next) => {
  if ((await db.doc(`users/${c.get('user').uid}`).get()).get('role') !== 'admin') return c.json({ error: 'forbidden' }, 403);
  await next();
});

/** What production has, what main has on top of it (web changes only) and the last production runs. */
adminRelease.get('/release/status', async (c) => {
  if (!token()) return c.json({ configured: false });
  try {
    const [live, main, runs] = await Promise.all([
      liveSha(),
      gh<{ sha: string }>('commits/main'),
      gh<{ workflow_runs: Run[] }>(`actions/workflows/${WORKFLOW}/runs?event=workflow_dispatch&per_page=5`),
    ]);
    let pending: { sha: string; title: string; at: string }[] | null = null;
    if (live) {
      const cmp = await gh<{ commits: Commit[]; files?: { filename: string }[]; total_commits: number }>(`compare/${live}...${main.sha}`);
      const touchesWeb = (cmp.files ?? []).some((f) => f.filename.startsWith('web/'));
      pending = touchesWeb ? cmp.commits.map((k) => ({ sha: k.sha.slice(0, 7), title: k.commit.message.split('\n')[0]!.slice(0, 140), at: k.commit.author.date })).reverse() : [];
    }
    return c.json({
      configured: true,
      live: live?.slice(0, 7) ?? null,
      main: main.sha.slice(0, 7),
      pending,
      runs: runs.workflow_runs.map((r) => ({ id: r.id, status: r.status, conclusion: r.conclusion, at: r.created_at, url: r.html_url, sha: r.head_sha.slice(0, 7) })),
    });
  } catch (e) {
    logError(e, { where: 'release.status' });
    return c.json({ configured: true, error: 'github' }, 502);
  }
});

/** Publishes main to production. */
adminRelease.post('/release/publish', async (c) => {
  if (!token()) return c.json({ error: 'not_configured' }, 503);
  const uid = c.get('user').uid;
  try {
    await gh(`actions/workflows/${WORKFLOW}/dispatches`, { method: 'POST', body: JSON.stringify({ ref: 'main', inputs: { target: 'production' } }) });
    await db.collection('audit').doc().set({ type: 'release_production', by: uid, at: FieldValue.serverTimestamp() });
    return c.json({ started: true });
  } catch (e) {
    logError(e, { where: 'release.publish' });
    return c.json({ error: 'github' }, 502);
  }
});
