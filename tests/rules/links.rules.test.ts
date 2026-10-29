// My apps / My research: brand links. The brand's members read them; only the admin creates, edits or deletes.
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';
import { ADMIN, MEMBER, OUTSIDER, OWNER, as, createEnv, seed } from './setup';

let env: RulesTestEnvironment;
const link = (extra: Record<string, unknown> = {}) => ({ section: 'apps', title: 'Sitio web', url: 'https://grupo-alternativas.web.app', ...extra });

beforeAll(async () => { env = await createEnv(); });
afterAll(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore() as unknown as Firestore, 'brands/brand-a/links/web'), link());
  });
});

describe('Brand links', () => {
  it('members of the brand read its links; other brands do not', async () => {
    await assertSucceeds(getDoc(doc(as(env, MEMBER), 'brands/brand-a/links/web')));
    await assertSucceeds(getDoc(doc(as(env, OWNER), 'brands/brand-a/links/web')));
    await assertFails(getDoc(doc(as(env, OUTSIDER), 'brands/brand-a/links/web')));
  });

  it('only the admin creates, edits and deletes links', async () => {
    await assertSucceeds(setDoc(doc(as(env, ADMIN), 'brands/brand-a/links/app1'), link({ title: 'App de pedidos' })));
    await assertSucceeds(setDoc(doc(as(env, ADMIN), 'brands/brand-a/links/r1'), link({ section: 'research', title: 'Market map' })));
    await assertFails(setDoc(doc(as(env, OWNER), 'brands/brand-a/links/app2'), link()));
    await assertFails(deleteDoc(doc(as(env, OWNER), 'brands/brand-a/links/web')));
    await assertSucceeds(deleteDoc(doc(as(env, ADMIN), 'brands/brand-a/links/web')));
  });

  it('rejects links that are not https or have no title', async () => {
    await assertFails(setDoc(doc(as(env, ADMIN), 'brands/brand-a/links/bad1'), link({ url: 'http://insecure.example' })));
    await assertFails(setDoc(doc(as(env, ADMIN), 'brands/brand-a/links/bad2'), link({ url: 'javascript:alert(1)' })));
    await assertFails(setDoc(doc(as(env, ADMIN), 'brands/brand-a/links/bad3'), link({ title: '' })));
    await assertFails(setDoc(doc(as(env, ADMIN), 'brands/brand-a/links/bad4'), link({ section: 'other' })));
  });
});
