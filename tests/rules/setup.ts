import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, serverTimestamp, type Firestore } from 'firebase/firestore';

export const PROJECT_ID = 'demo-braindy';

export const ADMIN = 'nicolas';
export const OWNER = 'owner-a';
export const MEMBER = 'member-a';
export const APPROVER = 'approver-a';
export const OUTSIDER = 'owner-b';
export const NO_PROFILE = 'stranger';

export const BRAND_A = 'brand-a';
export const BRAND_B = 'brand-b';

export async function createEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
}

/** Seeds two brands with members, one request with a version and a comment. Bypasses rules. */
export async function seed(env: RulesTestEnvironment): Promise<void> {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    const put = (path: string, data: Record<string, unknown>) => setDoc(doc(db, path), data);

    await put(`users/${ADMIN}`, { email: 'nicolas@braindy.co', name: 'Nicolas', role: 'admin', brandIds: [] });
    await put(`users/${OWNER}`, { email: 'a@client.co', name: 'Ana', role: 'client', brandIds: [BRAND_A] });
    await put(`users/${MEMBER}`, { email: 'm@client.co', name: 'Mar', role: 'client', brandIds: [BRAND_A] });
    await put(`users/${APPROVER}`, { email: 'p@client.co', name: 'Pia', role: 'client', brandIds: [BRAND_A] });
    await put(`users/${OUTSIDER}`, { email: 'b@other.co', name: 'Beto', role: 'client', brandIds: [BRAND_B] });

    for (const brand of [BRAND_A, BRAND_B]) {
      await put(`brands/${brand}`, { name: brand, slug: brand, status: 'active' });
      await put(`brands/${brand}/context/voice`, { tone: 'warm' });
      await put(`brands/${brand}/assets/deck`, { type: 'logodeck', title: 'Deck' });
      await put(`brands/${brand}/accesses/ig`, { platform: 'instagram', username: 'x', secretRef: 'kms://ref' });
      await put(`brands/${brand}/requests/r1`, { category: 'SOCIAL', status: 'to_approve', createdBy: 'seed' });
      await put(`brands/${brand}/requests/r1/versions/v1`, { n: 1, files: [], brain: 'creator', approval: { state: 'pending' } });
      await put(`brands/${brand}/requests/r1/comments/c1`, { author: 'seed', text: 'hi' });
    }

    await put(`brands/${BRAND_A}/members/${OWNER}`, { role: 'client_owner', canApprove: true });
    await put(`brands/${BRAND_A}/members/${MEMBER}`, { role: 'client_member', canApprove: false });
    await put(`brands/${BRAND_A}/members/${APPROVER}`, { role: 'client_member', canApprove: true });
    await put(`brands/${BRAND_B}/members/${OUTSIDER}`, { role: 'client_owner', canApprove: true });

    await put('audit/e1', { type: 'reveal', by: ADMIN });
    await put('brains/creator', { name: 'Creator', status: 'idle' });
  });
}

export function as(env: RulesTestEnvironment, uid: string | null): Firestore {
  const ctx = uid ? env.authenticatedContext(uid) : env.unauthenticatedContext();
  return ctx.firestore() as unknown as Firestore;
}

export { serverTimestamp };
