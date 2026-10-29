// Login for the remote Braindy connector (OAuth 2.1 as Claude expects it: discovery, dynamic client registration,
// authorization code with PKCE S256, rotating refresh tokens). Nicolas approves in the web app (/conectar) with his
// Braindy account; only admins can. Codes and tokens are stored hashed; the collections are server-only (rules deny all).
import { createHash, randomBytes } from 'node:crypto';
import { Hono } from 'hono';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import type { AuthEnv } from '../auth.js';
import { APP } from './tools.js';

export const API = process.env.PUBLIC_API_URL ?? 'https://braindy-api-283103160183.us-central1.run.app';
const MIN = 60_000;
const ACCESS_TTL = 60 * MIN;
const REFRESH_TTL = 30 * 24 * 60 * MIN;

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const secret = () => randomBytes(32).toString('base64url');
const later = (ms: number) => Timestamp.fromMillis(Date.now() + ms);
const expired = (t?: Timestamp) => !t || t.toMillis() < Date.now();
const redirectOk = (u: string) => { try { const x = new URL(u); return x.protocol === 'https:' || (x.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(x.hostname)); } catch { return false; } };
const isAdmin = async (uid: string) => (await db.doc(`users/${uid}`).get()).get('role') === 'admin';
const oauthError = (error: string, description?: string) => ({ error, ...(description ? { error_description: description } : {}) });

/** Public OAuth endpoints (discovery, registration, authorize, token). */
export const oauth = new Hono();

const resourceMeta = { resource: `${API}/mcp`, authorization_servers: [API], bearer_methods_supported: ['header'], resource_name: 'Braindy App' };
oauth.get('/.well-known/oauth-protected-resource', (c) => c.json(resourceMeta));
oauth.get('/.well-known/oauth-protected-resource/mcp', (c) => c.json(resourceMeta));
oauth.get('/.well-known/oauth-authorization-server', (c) => c.json({
  issuer: API, authorization_endpoint: `${API}/oauth/authorize`, token_endpoint: `${API}/oauth/token`, registration_endpoint: `${API}/oauth/register`,
  response_types_supported: ['code'], grant_types_supported: ['authorization_code', 'refresh_token'],
  code_challenge_methods_supported: ['S256'], token_endpoint_auth_methods_supported: ['none'], scopes_supported: ['braindy'],
}));

oauth.post('/oauth/register', async (c) => {
  const b = await c.req.json<{ client_name?: string; redirect_uris?: string[] }>().catch(() => ({} as { client_name?: string; redirect_uris?: string[] }));
  const uris = (b.redirect_uris ?? []).map(String).slice(0, 5);
  if (!uris.length || !uris.every(redirectOk)) return c.json(oauthError('invalid_redirect_uri', 'https (or localhost) redirect URIs only'), 400);
  const ref = db.collection('mcpClients').doc();
  const name = String(b.client_name ?? 'Claude').slice(0, 80);
  await ref.set({ name, redirectUris: uris, createdAt: FieldValue.serverTimestamp() });
  return c.json({ client_id: ref.id, client_name: name, redirect_uris: uris, grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'], token_endpoint_auth_method: 'none' }, 201);
});

oauth.get('/oauth/authorize', async (c) => {
  const q = c.req.query();
  const client = q.client_id ? await db.doc(`mcpClients/${q.client_id}`).get() : null;
  if (!client?.exists) return c.text('Cliente desconocido. Vuelve a conectar Braindy App desde Claude.', 400);
  if (!(client.get('redirectUris') as string[]).includes(q.redirect_uri ?? '')) return c.text('Dirección de regreso no registrada.', 400);
  const back = (params: Record<string, string>) => { const u = new URL(q.redirect_uri); for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v); if (q.state) u.searchParams.set('state', q.state); return c.redirect(u.toString()); };
  if (q.response_type !== 'code') return back(oauthError('unsupported_response_type'));
  if (!q.code_challenge || q.code_challenge_method !== 'S256') return back(oauthError('invalid_request', 'PKCE S256 required'));
  const ref = db.collection('mcpAuthRequests').doc(secret());
  await ref.set({ clientId: client.id, clientName: client.get('name'), redirectUri: q.redirect_uri, codeChallenge: q.code_challenge, state: q.state ?? null, expiresAt: later(10 * MIN) });
  return c.redirect(`${APP}/conectar?req=${encodeURIComponent(ref.id)}`);
});

async function issueTokens(uid: string, clientId: string) {
  const access = secret(), refresh = secret();
  await db.batch()
    .set(db.doc(`mcpTokens/${sha(access)}`), { uid, clientId, kind: 'access', expiresAt: later(ACCESS_TTL), createdAt: FieldValue.serverTimestamp() })
    .set(db.doc(`mcpTokens/${sha(refresh)}`), { uid, clientId, kind: 'refresh', expiresAt: later(REFRESH_TTL), createdAt: FieldValue.serverTimestamp() })
    .commit();
  return { access_token: access, token_type: 'Bearer', expires_in: ACCESS_TTL / 1000, refresh_token: refresh, scope: 'braindy' };
}

oauth.post('/oauth/token', async (c) => {
  const f = Object.fromEntries(Object.entries(await c.req.parseBody()).map(([k, v]) => [k, String(v)]));
  if (f.grant_type === 'authorization_code') {
    const ref = db.doc(`mcpCodes/${sha(f.code ?? '')}`);
    const code = await ref.get();
    if (!code.exists) return c.json(oauthError('invalid_grant'), 400);
    await ref.delete(); // one use only
    if (expired(code.get('expiresAt')) || code.get('clientId') !== f.client_id || code.get('redirectUri') !== f.redirect_uri) return c.json(oauthError('invalid_grant'), 400);
    if (createHash('sha256').update(f.code_verifier ?? '').digest('base64url') !== code.get('codeChallenge')) return c.json(oauthError('invalid_grant', 'PKCE check failed'), 400);
    if (!(await isAdmin(code.get('uid')))) return c.json(oauthError('access_denied'), 403);
    return c.json(await issueTokens(code.get('uid'), code.get('clientId')));
  }
  if (f.grant_type === 'refresh_token') {
    const ref = db.doc(`mcpTokens/${sha(f.refresh_token ?? '')}`);
    const tok = await ref.get();
    if (!tok.exists || tok.get('kind') !== 'refresh' || expired(tok.get('expiresAt')) || (f.client_id && tok.get('clientId') !== f.client_id)) return c.json(oauthError('invalid_grant'), 400);
    await ref.delete(); // rotation: each refresh token works once
    if (!(await isAdmin(tok.get('uid')))) return c.json(oauthError('access_denied'), 403);
    return c.json(await issueTokens(tok.get('uid'), tok.get('clientId')));
  }
  return c.json(oauthError('unsupported_grant_type'), 400);
});

/** The admin behind a Bearer token on /mcp, or null. Re-checks the admin role on every call. */
export async function tokenUser(header?: string): Promise<string | null> {
  const m = /^Bearer\s+(.+)$/i.exec(header ?? '');
  if (!m) return null;
  const tok = await db.doc(`mcpTokens/${sha(m[1].trim())}`).get();
  if (!tok.exists || tok.get('kind') !== 'access' || expired(tok.get('expiresAt'))) return null;
  return (await isAdmin(tok.get('uid'))) ? String(tok.get('uid')) : null;
}

/** Signed-in endpoints used by the /conectar page in the web app (under /v1, so the Firebase user is known). */
export const connectorAuth = new Hono<AuthEnv>();

connectorAuth.get('/connector/requests/:id', async (c) => {
  const r = await db.doc(`mcpAuthRequests/${c.req.param('id')}`).get();
  if (!r.exists || expired(r.get('expiresAt'))) return c.json({ error: 'expired' }, 404);
  return c.json({ clientName: r.get('clientName'), redirectHost: new URL(r.get('redirectUri')).host });
});

connectorAuth.post('/connector/requests/:id/:decision', async (c) => {
  const { id, decision } = c.req.param();
  const ref = db.doc(`mcpAuthRequests/${id}`);
  const r = await ref.get();
  if (!r.exists || expired(r.get('expiresAt'))) return c.json({ error: 'expired' }, 404);
  const uid = c.get('user').uid;
  if (!(await isAdmin(uid))) return c.json({ error: 'forbidden' }, 403);
  await ref.delete();
  const back = new URL(r.get('redirectUri'));
  if (r.get('state')) back.searchParams.set('state', r.get('state'));
  if (decision !== 'approve') { back.searchParams.set('error', 'access_denied'); return c.json({ redirect: back.toString() }); }
  const code = secret();
  await db.doc(`mcpCodes/${sha(code)}`).set({ clientId: r.get('clientId'), redirectUri: r.get('redirectUri'), codeChallenge: r.get('codeChallenge'), uid, expiresAt: later(5 * MIN) });
  back.searchParams.set('code', code);
  return c.json({ redirect: back.toString() });
});

/** Disconnects every Claude: deletes all connector tokens (they sign in again next time). */
connectorAuth.post('/connector/revoke', async (c) => {
  if (!(await isAdmin(c.get('user').uid))) return c.json({ error: 'forbidden' }, 403);
  const snap = await db.collection('mcpTokens').get();
  const w = db.bulkWriter();
  snap.docs.forEach((d) => w.delete(d.ref));
  await w.close();
  return c.json({ revoked: snap.size });
});
