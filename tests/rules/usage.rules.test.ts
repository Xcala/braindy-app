// AI spend (brands/{id}/usage, usageUnassigned): what each brand costs in Claude, Higgsfield and Magnific.
// Only the admin reads it; clients never see costs, not even their own brand's. Nobody writes from the browser.
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { addDoc, collection, collectionGroup, doc, getDoc, getDocs, query, setDoc, updateDoc, where, type Firestore } from 'firebase/firestore';
import { ADMIN, BRAND_A, MEMBER, OUTSIDER, OWNER, as, createEnv, seed } from './setup';

let env: RulesTestEnvironment;
const row = { platform: 'claude', source: 'api', model: 'claude-opus-5-5', input: 10, output: 20, usd: 0.0005, kind: 'brain:plan', month: '2026-10' };

beforeAll(async () => { env = await createEnv(); });
afterAll(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await setDoc(doc(db, `brands/${BRAND_A}/usage/u1`), row);
    await setDoc(doc(db, 'usageUnassigned/s1'), { ...row, source: 'claude-code' });
  });
});

describe('AI spend', () => {
  it('the admin reads one brand, every brand for a month, and the unassigned sessions', async () => {
    await assertSucceeds(getDoc(doc(as(env, ADMIN), `brands/${BRAND_A}/usage/u1`)));
    await assertSucceeds(getDocs(query(collectionGroup(as(env, ADMIN), 'usage'), where('month', '==', '2026-10'))));
    await assertSucceeds(getDocs(collection(as(env, ADMIN), 'usageUnassigned')));
  });

  it("clients never read costs, not even their own brand's", async () => {
    await assertFails(getDoc(doc(as(env, OWNER), `brands/${BRAND_A}/usage/u1`)));
    await assertFails(getDocs(collection(as(env, MEMBER), `brands/${BRAND_A}/usage`)));
    await assertFails(getDocs(query(collectionGroup(as(env, OWNER), 'usage'), where('month', '==', '2026-10'))));
    await assertFails(getDoc(doc(as(env, OUTSIDER), 'usageUnassigned/s1')));
  });

  it('nobody writes spend from the browser, not even the admin', async () => {
    await assertFails(addDoc(collection(as(env, ADMIN), `brands/${BRAND_A}/usage`), row));
    await assertFails(updateDoc(doc(as(env, ADMIN), `brands/${BRAND_A}/usage/u1`), { usd: 0 }));
    await assertFails(addDoc(collection(as(env, OWNER), `brands/${BRAND_A}/usage`), row));
    await assertFails(setDoc(doc(as(env, ADMIN), 'usageUnassigned/s2'), row));
  });
});
