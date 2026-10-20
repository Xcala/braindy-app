// Proposals are an admin-only module: clients and prospects never read them from the client SDK.
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, type Firestore } from 'firebase/firestore';
import { ADMIN, OWNER, as, createEnv, seed } from './setup';

let env: RulesTestEnvironment;

beforeAll(async () => { env = await createEnv(); });
afterAll(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await setDoc(doc(db, 'proposals/p1'), { title: 'Brand transformation', prospect: 'CWI', status: 'sent' });
    await setDoc(doc(db, 'proposals/p1/files/f1'), { title: 'Proposal.pdf' });
    await setDoc(doc(db, 'proposals/p1/sends/s1'), { channel: 'email', to: 'juan@x.com', token: 'abc' });
    await setDoc(doc(db, 'proposals/p1/sends/s1/events/e1'), { type: 'open' });
    await setDoc(doc(db, 'proposalLinks/abc'), { proposalId: 'p1', sendId: 's1' });
  });
});

describe('proposals', () => {
  it('admin reads and edits proposals, files and sends', async () => {
    const db = as(env, ADMIN);
    await assertSucceeds(getDocs(collection(db, 'proposals')));
    await assertSucceeds(updateDoc(doc(db, 'proposals/p1'), { status: 'won' }));
    await assertSucceeds(setDoc(doc(db, 'proposals/p1/files/f2'), { title: 'Deck.pdf' }));
    await assertSucceeds(getDocs(collection(db, 'proposals/p1/sends/s1/events')));
    await assertSucceeds(setDoc(doc(db, 'proposals/p1/sends/s2'), { channel: 'link', token: 'def' }));
  });

  it('clients and anonymous visitors see nothing', async () => {
    for (const db of [as(env, OWNER), as(env, null)]) {
      await assertFails(getDoc(doc(db, 'proposals/p1')));
      await assertFails(getDocs(collection(db, 'proposals')));
      await assertFails(getDoc(doc(db, 'proposals/p1/sends/s1')));
      await assertFails(getDoc(doc(db, 'proposalLinks/abc')));
    }
  });

  it('tracking is append-only from the backend: nobody edits sends or events from the client', async () => {
    const db = as(env, ADMIN);
    await assertFails(updateDoc(doc(db, 'proposals/p1/sends/s1'), { to: 'other@x.com' }));
    await assertFails(setDoc(doc(db, 'proposals/p1/sends/s1/events/e2'), { type: 'open' }));
    await assertFails(getDoc(doc(db, 'proposalLinks/abc')));
  });
});
