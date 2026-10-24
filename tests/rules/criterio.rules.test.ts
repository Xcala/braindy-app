// NickMark Taste: published lessons and objections are readable by signed-in users; drafts only by the admin.
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, setDoc, where, type Firestore } from 'firebase/firestore';
import { ADMIN, MEMBER, OWNER, as, createEnv, seed } from './setup';

let env: RulesTestEnvironment;

beforeAll(async () => { env = await createEnv(); });
afterAll(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await setDoc(doc(db, 'lessons/pub'), { status: 'published', title: { es: 'Una marca no es un logo', en: 'A brand is not a logo' } });
    await setDoc(doc(db, 'lessons/draft'), { status: 'draft', title: { es: 'Borrador', en: 'Draft' } });
    await setDoc(doc(db, 'objections/bigger'), { status: 'published', triggers: ['logo más grande'] });
    await setDoc(doc(db, 'criterioHits/h1'), { objectionId: 'bigger', brandId: 'brand-a', outcome: 'shown' });
  });
});

describe('NickMark Taste', () => {
  it('clients read published lessons and objections, never drafts', async () => {
    await assertSucceeds(getDoc(doc(as(env, MEMBER), 'lessons/pub')));
    await assertFails(getDoc(doc(as(env, MEMBER), 'lessons/draft')));
    await assertSucceeds(getDocs(query(collection(as(env, OWNER), 'lessons'), where('status', '==', 'published'))));
    await assertFails(getDocs(collection(as(env, OWNER), 'lessons')));
    await assertSucceeds(getDoc(doc(as(env, MEMBER), 'objections/bigger')));
  });

  it('signed-out visitors read nothing', async () => {
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'lessons/pub')));
  });

  it('only the admin reads drafts and edits lessons and objections', async () => {
    await assertSucceeds(getDoc(doc(as(env, ADMIN), 'lessons/draft')));
    await assertSucceeds(setDoc(doc(as(env, ADMIN), 'lessons/new'), { status: 'draft' }));
    await assertFails(setDoc(doc(as(env, OWNER), 'lessons/new'), { status: 'published' }));
    await assertFails(setDoc(doc(as(env, OWNER), 'objections/x'), { status: 'published' }));
  });

  it('objection hits: admin reads, nobody writes from the client', async () => {
    await assertSucceeds(getDoc(doc(as(env, ADMIN), 'criterioHits/h1')));
    await assertFails(getDoc(doc(as(env, OWNER), 'criterioHits/h1')));
    await assertFails(setDoc(doc(as(env, MEMBER), 'criterioHits/h2'), { objectionId: 'bigger' }));
    await assertFails(setDoc(doc(as(env, ADMIN), 'criterioHits/h3'), { objectionId: 'bigger' }));
  });
});
