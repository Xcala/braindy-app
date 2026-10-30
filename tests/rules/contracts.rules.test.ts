// Contracts: drafts are admin only; once sent, the named signer and billing people read it; nobody writes
// from the client (the backend signs and seals). Contractor profile: admin only.
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc, type Firestore } from 'firebase/firestore';
import { ADMIN, APPROVER, BRAND_A, MEMBER, OUTSIDER, OWNER, as, createEnv, seed } from './setup';

let env: RulesTestEnvironment;
const C = `brands/${BRAND_A}/contracts`;

beforeAll(async () => { env = await createEnv(); });
afterAll(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await setDoc(doc(db, `${C}/draft1`), { status: 'draft', signer: { email: 'p@client.co' } });
    await setDoc(doc(db, `${C}/sent1`), { status: 'sent', signer: { email: 'p@client.co' } });
    await setDoc(doc(db, `${C}/signed1`), { status: 'signed', signer: { email: 'p@client.co' } });
    await setDoc(doc(db, 'config/contractor'), { nombre: 'Nicolas' });
  });
});

/** Signed-in context with an email claim, like the email-link sign-in gives. */
const withEmail = (uid: string, email: string) => env.authenticatedContext(uid, { email }).firestore() as unknown as Firestore;

describe('contracts', () => {
  it('admin reads drafts and sent contracts but cannot write them from the client', async () => {
    const db = as(env, ADMIN);
    await assertSucceeds(getDoc(doc(db, `${C}/draft1`)));
    await assertSucceeds(getDoc(doc(db, `${C}/signed1`)));
    await assertFails(setDoc(doc(db, `${C}/new`), { status: 'draft' }));
    await assertFails(updateDoc(doc(db, `${C}/signed1`), { status: 'draft' }));
    await assertFails(deleteDoc(doc(db, `${C}/signed1`)));
  });

  it('the named signer reads sent and signed contracts, never drafts, and cannot change them', async () => {
    const db = withEmail(APPROVER, 'p@client.co');
    await assertSucceeds(getDoc(doc(db, `${C}/sent1`)));
    await assertSucceeds(getDoc(doc(db, `${C}/signed1`)));
    await assertFails(getDoc(doc(db, `${C}/draft1`)));
    await assertFails(updateDoc(doc(db, `${C}/sent1`), { status: 'signed' }));
  });

  it('owners (billing) read sent contracts; members without billing and other brands do not', async () => {
    await assertSucceeds(getDoc(doc(as(env, OWNER), `${C}/sent1`)));
    await assertFails(getDoc(doc(as(env, OWNER), `${C}/draft1`)));
    await assertFails(getDoc(doc(withEmail(MEMBER, 'm@client.co'), `${C}/sent1`)));
    await assertFails(getDoc(doc(withEmail(OUTSIDER, 'p@client.co'), `${C}/sent1`)));
    await assertFails(getDoc(doc(as(env, null), `${C}/sent1`)));
  });

  it('contractor profile is admin only', async () => {
    await assertSucceeds(getDoc(doc(as(env, ADMIN), 'config/contractor')));
    await assertSucceeds(setDoc(doc(as(env, ADMIN), 'config/contractor'), { nombre: 'Nicolas M.' }));
    await assertFails(getDoc(doc(as(env, OWNER), 'config/contractor')));
    await assertFails(setDoc(doc(as(env, OWNER), 'config/contractor'), { nombre: 'x' }));
  });
});
