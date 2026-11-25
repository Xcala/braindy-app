// Social media calendar (mirrored from Metricool by the server). The brand only reads it; nobody writes from the browser.
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc, type Firestore } from 'firebase/firestore';
import { ADMIN, MEMBER, OUTSIDER, OWNER, as, createEnv, seed } from './setup';

let env: RulesTestEnvironment;
const post = { text: 'Reel del summit', status: 'published', networks: [{ network: 'instagram', status: 'published' }] };

beforeAll(async () => { env = await createEnv(); });
afterAll(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore() as unknown as Firestore, 'brands/brand-a/socialPosts/p1'), post);
  });
});

describe('Social calendar', () => {
  it('members and owners of the brand read its posts; other brands do not', async () => {
    await assertSucceeds(getDoc(doc(as(env, MEMBER), 'brands/brand-a/socialPosts/p1')));
    await assertSucceeds(getDoc(doc(as(env, OWNER), 'brands/brand-a/socialPosts/p1')));
    await assertSucceeds(getDoc(doc(as(env, ADMIN), 'brands/brand-a/socialPosts/p1')));
    await assertFails(getDoc(doc(as(env, OUTSIDER), 'brands/brand-a/socialPosts/p1')));
  });

  it('is view only: nobody creates, edits or deletes posts from the browser, not even the admin', async () => {
    for (const who of [ADMIN, OWNER, MEMBER]) {
      await assertFails(setDoc(doc(as(env, who), 'brands/brand-a/socialPosts/p2'), post));
      await assertFails(updateDoc(doc(as(env, who), 'brands/brand-a/socialPosts/p1'), { status: 'scheduled' }));
      await assertFails(deleteDoc(doc(as(env, who), 'brands/brand-a/socialPosts/p1')));
    }
  });
});

describe('Calendar «Update» request', () => {
  const ask = (uid: string) => ({ at: serverTimestamp(), by: uid, state: 'queued' });
  it('anyone who sees the brand asks for an update, as themselves', async () => {
    await assertSucceeds(setDoc(doc(as(env, MEMBER), 'brands/brand-a/syncRequests/social'), ask(MEMBER)));
    await assertSucceeds(setDoc(doc(as(env, ADMIN), 'brands/brand-a/syncRequests/social'), ask(ADMIN)));
    await assertSucceeds(getDoc(doc(as(env, OWNER), 'brands/brand-a/syncRequests/social')));
  });
  it('other brands, other names, other states and other kinds are refused', async () => {
    await assertFails(setDoc(doc(as(env, OUTSIDER), 'brands/brand-a/syncRequests/social'), ask(OUTSIDER)));
    await assertFails(getDoc(doc(as(env, OUTSIDER), 'brands/brand-a/syncRequests/social')));
    await assertFails(setDoc(doc(as(env, MEMBER), 'brands/brand-a/syncRequests/social'), ask(OWNER)));
    await assertFails(setDoc(doc(as(env, MEMBER), 'brands/brand-a/syncRequests/social'), { ...ask(MEMBER), state: 'done' }));
    await assertFails(setDoc(doc(as(env, MEMBER), 'brands/brand-a/syncRequests/social'), { ...ask(MEMBER), doneAt: serverTimestamp() }));
    await assertFails(setDoc(doc(as(env, MEMBER), 'brands/brand-a/syncRequests/stats'), ask(MEMBER)));
    await assertFails(deleteDoc(doc(as(env, MEMBER), 'brands/brand-a/syncRequests/social')));
  });
});
