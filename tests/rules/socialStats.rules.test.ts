// Social results (mirrored from Metricool by the server): readable only where NickMark switched Results on, and by the admin.
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, type Firestore } from 'firebase/firestore';
import { ADMIN, MEMBER, OUTSIDER, OWNER, as, createEnv, seed } from './setup';

let env: RulesTestEnvironment;
const stats = { network: 'instagram', daily: [{ d: '2026-11-01', followers: 94 }], posts: [] };
const brand = (data: Record<string, unknown>) => env.withSecurityRulesDisabled(async (ctx) => {
  await updateDoc(doc(ctx.firestore() as unknown as Firestore, 'brands/brand-a'), data);
});

beforeAll(async () => { env = await createEnv(); });
afterAll(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore() as unknown as Firestore, 'brands/brand-a/socialStats/instagram'), stats);
  });
});

describe('Social results', () => {
  it('hidden from the client until Results is switched on for the brand; the admin always reads', async () => {
    await assertFails(getDoc(doc(as(env, OWNER), 'brands/brand-a/socialStats/instagram')));
    await assertSucceeds(getDoc(doc(as(env, ADMIN), 'brands/brand-a/socialStats/instagram')));
    await brand({ resultsOn: true });
    await assertSucceeds(getDoc(doc(as(env, OWNER), 'brands/brand-a/socialStats/instagram')));
    await assertSucceeds(getDoc(doc(as(env, MEMBER), 'brands/brand-a/socialStats/instagram')));
    await assertFails(getDoc(doc(as(env, OUTSIDER), 'brands/brand-a/socialStats/instagram')));
  });

  it('the brand switch off wins', async () => {
    await brand({ resultsOn: true, sectionsOff: ['results'] });
    await assertFails(getDoc(doc(as(env, OWNER), 'brands/brand-a/socialStats/instagram')));
  });

  it('nobody writes from the browser, not even the admin', async () => {
    await brand({ resultsOn: true });
    for (const who of [ADMIN, OWNER, MEMBER]) await assertFails(setDoc(doc(as(env, who), 'brands/brand-a/socialStats/facebook'), stats));
  });
});
