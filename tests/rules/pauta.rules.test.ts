// Pauta: campaigns, ads and pieces of the brand (connector writes). The brand views them, another brand does not, nobody
// edits from the browser; the numbers only open where Results is switched on.
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc, type Firestore } from 'firebase/firestore';
import { ADMIN, MEMBER, OUTSIDER, OWNER, as, createEnv, seed } from './setup';

let env: RulesTestEnvironment;
const camp = { platform: 'meta', name: 'Blacky · lanzamiento', state: 'live', ads: [{ id: 'a1', text: { primary: 'Hola' }, creatives: [] }] };
const C = 'brands/brand-a/adCampaigns/meta_1';

beforeAll(async () => { env = await createEnv(); });
afterAll(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await setDoc(doc(db, C), camp);
    await setDoc(doc(db, `${C}/stats/totals`), { totals: { spend: 120 } });
  });
});

const results = (on: boolean) => env.withSecurityRulesDisabled(async (ctx) => {
  await updateDoc(doc(ctx.firestore() as unknown as Firestore, 'brands/brand-a'), { resultsOn: on });
});

describe('Pauta', () => {
  it('the brand views its campaigns; another brand does not', async () => {
    await assertSucceeds(getDoc(doc(as(env, MEMBER), C)));
    await assertSucceeds(getDoc(doc(as(env, OWNER), C)));
    await assertSucceeds(getDocs(collection(as(env, OWNER), 'brands/brand-a/adCampaigns')));
    await assertSucceeds(getDoc(doc(as(env, ADMIN), C)));
    await assertFails(getDoc(doc(as(env, OUTSIDER), C)));
    await assertFails(getDocs(collection(as(env, OUTSIDER), 'brands/brand-a/adCampaigns')));
  });

  it('is view only: nobody creates, edits or deletes from the browser, not even the admin', async () => {
    for (const who of [ADMIN, OWNER, MEMBER]) {
      await assertFails(setDoc(doc(as(env, who), 'brands/brand-a/adCampaigns/meta_2'), camp));
      await assertFails(updateDoc(doc(as(env, who), C), { state: 'paused' }));
      await assertFails(deleteDoc(doc(as(env, who), C)));
      await assertFails(setDoc(doc(as(env, who), `${C}/stats/totals`), { totals: { spend: 1 } }));
    }
  });

  it('the numbers open only where Results is on', async () => {
    await results(false);
    await assertFails(getDoc(doc(as(env, OWNER), `${C}/stats/totals`)));
    await assertSucceeds(getDoc(doc(as(env, ADMIN), `${C}/stats/totals`)));
    await results(true);
    await assertSucceeds(getDoc(doc(as(env, OWNER), `${C}/stats/totals`)));
    await assertFails(getDoc(doc(as(env, OUTSIDER), `${C}/stats/totals`)));
  });
});
