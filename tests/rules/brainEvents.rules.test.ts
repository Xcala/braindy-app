// Brand Brain feed: the brand's members read it; nobody writes from the browser (the backend records each event).
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';
import { ADMIN, MEMBER, OUTSIDER, OWNER, as, createEnv, seed } from './setup';

let env: RulesTestEnvironment;
const ev = { kind: 'approved', area: 'work', text: 'Post 4:5: aprobado como se entregó', at: new Date() };

beforeAll(async () => { env = await createEnv(); });
afterAll(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore() as unknown as Firestore, 'brands/brand-a/brainEvents/e1'), ev);
  });
});

describe('Brand Brain feed', () => {
  it('members of the brand and the admin read it; other brands do not', async () => {
    await assertSucceeds(getDoc(doc(as(env, MEMBER), 'brands/brand-a/brainEvents/e1')));
    await assertSucceeds(getDoc(doc(as(env, OWNER), 'brands/brand-a/brainEvents/e1')));
    await assertSucceeds(getDoc(doc(as(env, ADMIN), 'brands/brand-a/brainEvents/e1')));
    await assertFails(getDoc(doc(as(env, OUTSIDER), 'brands/brand-a/brainEvents/e1')));
  });

  it('nobody writes or deletes events from the browser, not even the admin', async () => {
    await assertFails(setDoc(doc(as(env, ADMIN), 'brands/brand-a/brainEvents/e2'), ev));
    await assertFails(setDoc(doc(as(env, OWNER), 'brands/brand-a/brainEvents/e2'), ev));
    await assertFails(setDoc(doc(as(env, MEMBER), 'brands/brand-a/brainEvents/e1'), { ...ev, text: 'otro' }));
    await assertFails(deleteDoc(doc(as(env, ADMIN), 'brands/brand-a/brainEvents/e1')));
  });
});
