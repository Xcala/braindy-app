// Brand versions (rebranding): the brand's members read the earlier versions; nobody writes them from the browser.
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';
import { ADMIN, MEMBER, OUTSIDER, OWNER, as, createEnv, seed } from './setup';

let env: RulesTestEnvironment;
const v = { name: 'iPark', logoUrl: null, identity: { colors: [{ hex: '#E8194A' }] }, to: new Date() };

beforeAll(async () => { env = await createEnv(); });
afterAll(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore() as unknown as Firestore, 'brands/brand-a/versions/v1'), v);
  });
});

describe('Brand versions', () => {
  it('members of the brand and the admin read them; other brands do not', async () => {
    await assertSucceeds(getDoc(doc(as(env, MEMBER), 'brands/brand-a/versions/v1')));
    await assertSucceeds(getDoc(doc(as(env, OWNER), 'brands/brand-a/versions/v1')));
    await assertSucceeds(getDoc(doc(as(env, ADMIN), 'brands/brand-a/versions/v1')));
    await assertFails(getDoc(doc(as(env, OUTSIDER), 'brands/brand-a/versions/v1')));
  });

  it('nobody writes or deletes a version from the browser, not even the admin', async () => {
    await assertFails(setDoc(doc(as(env, ADMIN), 'brands/brand-a/versions/v2'), v));
    await assertFails(setDoc(doc(as(env, OWNER), 'brands/brand-a/versions/v1'), { ...v, name: 'otro' }));
    await assertFails(deleteDoc(doc(as(env, ADMIN), 'brands/brand-a/versions/v1')));
  });
});
