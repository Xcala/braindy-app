// Client credential encryption. Production: Cloud KMS key `accesses` (REST, via the service account).
// Local emulator only: AES-256-GCM with a dev key, so QA works without KMS. Values are never logged.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { GoogleAuth } from 'google-auth-library';

const KEY = process.env.KMS_KEY
  ?? 'projects/braindy-brand-guideline/locations/us-central1/keyRings/braindy-app/cryptoKeys/accesses';
const LOCAL = !!process.env.FIRESTORE_EMULATOR_HOST && !process.env.KMS_FORCE;
const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloudkms'] });

async function kms(op: 'encrypt' | 'decrypt', body: Record<string, string>) {
  const client = await auth.getClient();
  const r = await client.request<{ ciphertext?: string; plaintext?: string }>({
    url: `https://cloudkms.googleapis.com/v1/${KEY}:${op}`, method: 'POST', data: body,
  });
  return r.data;
}

const devKey = createHash('sha256').update('braindy-local-emulator-only').digest();
const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');

/** Encrypts `value`, bound to `aad` (the brand/access path) so a ciphertext cannot be moved to another access. */
export async function seal(value: string, aad: string): Promise<{ ciphertext: string; scheme: 'kms' | 'local' }> {
  if (LOCAL) {
    const iv = randomBytes(12);
    const c = createCipheriv('aes-256-gcm', devKey, iv);
    c.setAAD(Buffer.from(aad));
    const enc = Buffer.concat([c.update(value, 'utf8'), c.final()]);
    return { ciphertext: Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64'), scheme: 'local' };
  }
  const r = await kms('encrypt', { plaintext: b64(value), additionalAuthenticatedData: b64(aad) });
  return { ciphertext: r.ciphertext!, scheme: 'kms' };
}

export async function open(ciphertext: string, aad: string, scheme: 'kms' | 'local'): Promise<string> {
  if (scheme === 'local') {
    if (!LOCAL) throw new Error('local_scheme_outside_emulator');
    const buf = Buffer.from(ciphertext, 'base64');
    const d = createDecipheriv('aes-256-gcm', devKey, buf.subarray(0, 12));
    d.setAAD(Buffer.from(aad));
    d.setAuthTag(buf.subarray(12, 28));
    return Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString('utf8');
  }
  const r = await kms('decrypt', { ciphertext, additionalAuthenticatedData: b64(aad) });
  return Buffer.from(r.plaintext!, 'base64').toString('utf8');
}
