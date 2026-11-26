// «Sube» from Braindy › Admin (2026-11-25, Nicolas): publishes the web app to production without any computer.
// It runs the GitHub workflows "Deploy web" (target=production) and, when the server changed, "Deploy API", on main.
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

const API_HEALTH = 'https://braindy-api-283103160183.us-central1.run.app/health';
const API_WORKFLOW = 'deploy-api.yml';
const isServer = (f: string) => f.startsWith('server/') || f === 'Dockerfile' || f === 'package-lock.json';

/** The commit the live server was built from (only known when it was published from GitHub). */
async function apiSha(): Promise<string | null> {
  try { return ((await (await fetch(API_HEALTH)).json()) as { release?: string | null }).release ?? null; } catch { return null; }
}

type Pending = { sha: string; title: string; at: string };
/** Commits on main the live part lacks: null when the live commit is unknown, [] when nothing of that part changed. */
async function missing(live: string | null, main: string, touches: (f: string) => boolean): Promise<Pending[] | null> {
  if (!live) return null;
  const cmp = await gh<{ commits: Commit[]; files?: { filename: string }[] }>(`compare/${live}...${main}`);
  if (!(cmp.files ?? []).some((f) => touches(f.filename))) return [];
  return cmp.commits.map((k) => ({ sha: k.sha.slice(0, 7), title: k.commit.message.split('\n')[0]!.slice(0, 140), at: k.commit.author.date })).reverse();
}

/** What production has (app and server), what main has on top of it, and the last production runs. */
adminRelease.get('/release/status', async (c) => {
  if (!token()) return c.json({ configured: false });
  try {
    const [live, apiLive, main, webRuns, apiRuns] = await Promise.all([
      liveSha(), apiSha(),
      gh<{ sha: string }>('commits/main'),
      gh<{ workflow_runs: Run[] }>(`actions/workflows/${WORKFLOW}/runs?event=workflow_dispatch&per_page=5`),
      gh<{ workflow_runs: Run[] }>(`actions/workflows/${API_WORKFLOW}/runs?per_page=5`).catch(() => ({ workflow_runs: [] as Run[] })),
    ]);
    const [web, api] = await Promise.all([missing(live, main.sha, (f) => f.startsWith('web/')), missing(apiLive, main.sha, isServer)]);
    // One list for the card: what goes out when the button is pressed (unknown parts count as pending).
    const seen = new Set<string>();
    const pending = web === null && api === null ? null : [...(web ?? []), ...(api ?? [])].filter((p) => !seen.has(p.sha) && seen.add(p.sha)).sort((a, b) => a.at.localeCompare(b.at));
    const runs = [...webRuns.workflow_runs, ...apiRuns.workflow_runs].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);
    return c.json({
      configured: true,
      live: live?.slice(0, 7) ?? null, apiLive: apiLive?.slice(0, 7) ?? null, main: main.sha.slice(0, 7),
      web: web === null ? 'unknown' : web.length > 0, api: api === null ? 'unknown' : api.length > 0,
      pending: web === null || api === null ? (pending && pending.length ? pending : null) : pending,
      runs: runs.map((r) => ({ id: r.id, status: r.status, conclusion: r.conclusion, at: r.created_at, url: r.html_url, sha: r.head_sha.slice(0, 7) })),
    });
  } catch (e) {
    logError(e, { where: 'release.status' });
    return c.json({ configured: true, error: 'github' }, 502);
  }
});

/** Publishes main to production: the app, and the server when it has changes (or its live commit is unknown). */
adminRelease.post('/release/publish', async (c) => {
  if (!token()) return c.json({ error: 'not_configured' }, 503);
  const uid = c.get('user').uid;
  try {
    const main = (await gh<{ sha: string }>('commits/main')).sha;
    const api = await missing(await apiSha(), main, isServer);
    const parts: string[] = ['web'];
    await gh(`actions/workflows/${WORKFLOW}/dispatches`, { method: 'POST', body: JSON.stringify({ ref: 'main', inputs: { target: 'production' } }) });
    if (api === null || api.length > 0) {
      await gh(`actions/workflows/${API_WORKFLOW}/dispatches`, { method: 'POST', body: JSON.stringify({ ref: 'main' }) });
      parts.push('api');
    }
    await db.collection('audit').doc().set({ type: 'release_production', parts, commit: main.slice(0, 7), by: uid, at: FieldValue.serverTimestamp() });
    return c.json({ started: true, parts });
  } catch (e) {
    logError(e, { where: 'release.publish' });
    return c.json({ error: 'github' }, 502);
  }
});
