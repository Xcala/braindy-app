// One sign-in: whoever is signed in to Braindy App opens a brand's site in its own editor already signed in.
// Each site lives in its own Firebase project. NickMark gives braindy-api, once per site, the roles to manage that
// project's users and to sign with its admin service account; the link then carries `editorAuth`. Braindy mints a
// custom token there for the same (verified) email, and the site bridge hands it to the site (window.braindySignIn).
// The site's own rules still decide who may publish (its list of editor emails): Braindy only proves who the person is.
import { Hono } from 'hono';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type UserRecord } from 'firebase-admin/auth';
import { db } from './firebase.js';
import { brandAccess } from './access.js';
import type { AuthEnv } from './auth.js';

export type EditorAuth = { projectId: string; serviceAccount: string };

/** The config saved on a link, when it is well formed (a Firebase project id and a service account of that project). */
export function editorAuthOf(v: unknown): EditorAuth | null {
  const o = (v ?? {}) as Partial<EditorAuth>;
  const projectId = String(o.projectId ?? '').trim(), serviceAccount = String(o.serviceAccount ?? '').trim().toLowerCase();
  if (!/^[a-z][a-z0-9-]{4,29}$/.test(projectId)) return null;
  if (!/^[a-z0-9-]+@[a-z0-9-]+\.iam\.gserviceaccount\.com$/.test(serviceAccount)) return null;
  return { projectId, serviceAccount };
}

/** firebase-admin for a site's project, signing through IAM with the service account named on the link (no key files). */
function siteAuth(cfg: EditorAuth) {
  const name = `site:${cfg.projectId}:${cfg.serviceAccount}`;
  const app = getApps().find((a) => a.name === name)
    ?? initializeApp({ credential: applicationDefault(), projectId: cfg.projectId, serviceAccountId: cfg.serviceAccount }, name);
  return getAuth(app);
}

const notFound = (e: unknown) => (e as { code?: string })?.code === 'auth/user-not-found';

export const siteEditor = new Hono<AuthEnv>();

/** A sign-in token for the site of one brand link, for the person asking (brand member with My apps, or the admin). */
siteEditor.post('/brands/:brandId/links/:linkId/editor-token', async (c) => {
  const { brandId, linkId } = c.req.param();
  const user = c.get('user');
  const acc = await brandAccess(user.uid, brandId);
  if (!acc.admin && !(acc.member && acc.sections.includes('apps'))) return c.json({ error: 'forbidden' }, 403);
  const link = await db.doc(`brands/${brandId}/links/${linkId}`).get();
  if (!link.exists || link.get('section') !== 'apps') return c.json({ error: 'not_found' }, 404);
  const cfg = editorAuthOf(link.get('editorAuth'));
  if (!cfg) return c.json({ error: 'no_editor_auth' }, 404);
  // Only an email Braindy has seen verified (Google, or a verified address): never a phone-only sign-in.
  const email = (user.email ?? '').trim().toLowerCase();
  if (!email || user.email_verified !== true) return c.json({ error: 'no_verified_email' }, 409);

  try {
    const auth = siteAuth(cfg);
    let rec: UserRecord | null = await auth.getUserByEmail(email).catch((e) => { if (notFound(e)) return null; throw e; });
    if (!rec) rec = await auth.createUser({ email, emailVerified: true, displayName: user.name ?? undefined });
    // An existing account there that never proved the address is not ours to take over.
    if (!rec.emailVerified) return c.json({ error: 'unverified_on_site' }, 409);
    if (rec.disabled) return c.json({ error: 'disabled_on_site' }, 403);
    const token = await auth.createCustomToken(rec.uid, { braindy: true });
    console.log(JSON.stringify({ msg: 'site_editor_token', brandId, linkId, project: cfg.projectId, uid: user.uid }));
    return c.json({ token });
  } catch (e) {
    // Usually the one-time IAM step is missing on that project.
    console.error(JSON.stringify({ msg: 'site_editor_token_failed', brandId, linkId, project: cfg.projectId, error: String((e as Error)?.message ?? e).slice(0, 300) }));
    return c.json({ error: 'site_auth_failed' }, 502);
  }
});
