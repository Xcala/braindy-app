// Free resources: every signed-in client reads the published ones; drafts and edits are the admin's.
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, type Firestore } from 'firebase/firestore';
import { ADMIN, MEMBER, OWNER, as, createEnv, seed } from './setup';

let env: RulesTestEnvironment;

beforeAll(async () => { env = await createEnv(); });
afterAll(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await setDoc(doc(db, 'resources/pub'), { status: 'published', title: { es: 'Skill /c', en: 'Skill /c' }, kind: 'skill' });
    await setDoc(doc(db, 'resources/draft'), { status: 'draft', title: { es: 'Borrador', en: 'Draft' }, kind: 'script' });
  });
});

describe('Free resources', () => {
  it('any signed-in client reads published resources, never drafts', async () => {
    await assertSucceeds(getDoc(doc(as(env, MEMBER), 'resources/pub')));
    await assertFails(getDoc(doc(as(env, MEMBER), 'resources/draft')));
    await assertSucceeds(getDocs(query(collection(as(env, OWNER), 'resources'), where('status', '==', 'published'))));
    await assertFails(getDocs(collection(as(env, OWNER), 'resources')));
  });

  it('signed-out visitors read nothing', async () => {
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'resources/pub')));
  });

  it('only the admin reads drafts and creates or edits resources', async () => {
    await assertSucceeds(getDocs(collection(as(env, ADMIN), 'resources')));
    await assertSucceeds(setDoc(doc(as(env, ADMIN), 'resources/new'), { status: 'draft', kind: 'prompt' }));
    await assertFails(setDoc(doc(as(env, OWNER), 'resources/x'), { status: 'published' }));
    await assertFails(updateDoc(doc(as(env, MEMBER), 'resources/pub'), { downloads: 99 }));
  });
});
