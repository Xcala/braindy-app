// Usage analytics (pageViews/{day}): daily aggregate counters written by the API. Only the admin reads them;
// clients cannot read or write them, not even to bump their own counts. Nobody writes from the browser.
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, documentId, getDoc, getDocs, query, setDoc, updateDoc, where, type Firestore } from 'firebase/firestore';
import { ADMIN, MEMBER, OUTSIDER, OWNER, as, createEnv, seed } from './setup';

let env: RulesTestEnvironment;
const day = { day: '2026-11-24', views: { 'client|phone|requests|/requests/:id': 3 }, brands: { 'brand-a|client': 3 } };

beforeAll(async () => { env = await createEnv(); });
afterAll(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore() as unknown as Firestore, 'pageViews/2026-11-24'), day);
  });
});

describe('usage analytics', () => {
  it('the admin reads one day and the last 30 days', async () => {
    await assertSucceeds(getDoc(doc(as(env, ADMIN), 'pageViews/2026-11-24')));
    await assertSucceeds(getDocs(query(collection(as(env, ADMIN), 'pageViews'), where(documentId(), '>=', '2026-10-26'))));
  });

  it('clients and strangers never read it', async () => {
    await assertFails(getDoc(doc(as(env, OWNER), 'pageViews/2026-11-24')));
    await assertFails(getDocs(collection(as(env, MEMBER), 'pageViews')));
    await assertFails(getDoc(doc(as(env, OUTSIDER), 'pageViews/2026-11-24')));
    await assertFails(getDoc(doc(as(env, null), 'pageViews/2026-11-24')));
  });

  it('nobody writes counters from the browser, not even the admin', async () => {
    await assertFails(setDoc(doc(as(env, OWNER), 'pageViews/2026-11-25'), day));
    await assertFails(updateDoc(doc(as(env, MEMBER), 'pageViews/2026-11-24'), { views: {} }));
    await assertFails(setDoc(doc(as(env, ADMIN), 'pageViews/2026-11-25'), day));
    await assertFails(updateDoc(doc(as(env, ADMIN), 'pageViews/2026-11-24'), { views: {} }));
    await assertFails(deleteDoc(doc(as(env, ADMIN), 'pageViews/2026-11-24')));
  });
});
