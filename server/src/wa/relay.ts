// WhatsApp notices for work delivered from Nicolas's PC. The local connector has no WhatsApp key (it lives only in
// Secret Manager on the backend), so it asks the backend to send the review notice. Auth: the Google identity token
// of his gcloud login (`gcloud auth print-identity-token`), accepted only for a verified admin account.
import { execFile } from 'node:child_process';
import { Hono } from 'hono';
import { OAuth2Client } from 'google-auth-library';
import { adminAuth, db } from '../firebase.js';
import { notifyDelivery } from '../review.js';

const oidc = new OAuth2Client();
export const relay = new Hono();

relay.post('/internal/notify-delivery', async (c) => {
  const token = (c.req.header('Authorization') ?? '').replace(/^Bearer /, '');
  let email = '';
  try {
    const p = (await oidc.verifyIdToken({ idToken: token })).getPayload();
    if (p?.email_verified && /^https:\/\/accounts\.google\.com$|^accounts\.google\.com$/.test(String(p.iss))) email = String(p.email);
  } catch { /* falls through to 401 */ }
  const uid = email ? await adminAuth.getUserByEmail(email).then((u) => u.uid).catch(() => '') : '';
  if (!uid || (await db.doc(`users/${uid}`).get()).get('role') !== 'admin') return c.json({ error: 'unauthorized' }, 401);
  const b = await c.req.json<{ brandId?: string; requestId?: string; versionId?: string }>().catch(() => ({} as Record<string, string>));
  const [brandId, requestId, versionId] = [b.brandId, b.requestId, b.versionId].map((x) => String(x ?? ''));
  const ver = await db.doc(`brands/${brandId}/requests/${requestId}/versions/${versionId}`).get();
  if (!ver.exists || ver.get('published') !== true) return c.json({ error: 'not_found' }, 404);
  const r = await notifyDelivery(brandId, requestId, versionId, uid);
  return c.json({ status: r.status });
});

/** Local side: asks the backend to send the notice. Returns its status, or 'relay_failed'. */
export async function relayDelivery(brandId: string, requestId: string, versionId: string): Promise<string> {
  const api = process.env.PUBLIC_API_URL ?? 'https://braindy-api-283103160183.us-central1.run.app';
  const idToken = await new Promise<string>((res) => execFile(process.platform === 'win32' ? 'gcloud.cmd' : 'gcloud', ['auth', 'print-identity-token'],
    { shell: process.platform === 'win32', timeout: 30_000 }, (err, out) => res(err ? '' : out.trim())));
  if (!idToken) return 'relay_failed';
  const r = await fetch(`${api}/internal/notify-delivery`, {
    method: 'POST', headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ brandId, requestId, versionId }),
  }).catch(() => null);
  return r?.ok ? String(((await r.json()) as { status?: string }).status ?? 'sent') : 'relay_failed';
}
