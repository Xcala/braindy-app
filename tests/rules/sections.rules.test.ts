// Sections per person: NickMark opens or closes parts of the app for each member. Without a list, owners see everything
// and members all but accesses and billing. A group member's sections apply to every brand of the group.
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, type Firestore } from 'firebase/firestore';
import { ADMIN, MEMBER, OWNER, as, createEnv, seed } from './setup';

let env: RulesTestEnvironment;
const PICKED = 'picked-a';
const GROUP_ALL = 'jaime';
const SUB_ONLY = 'equi';

beforeAll(async () => { env = await createEnv(); });
afterAll(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    const put = (p: string, d: Record<string, unknown>) => setDoc(doc(db, p), d);
    await put(`users/${PICKED}`, { role: 'client', brandIds: ['brand-a'] });
    await put(`brands/brand-a/members/${PICKED}`, { role: 'client_member', sections: ['brand', 'requests', 'accesses'] });
    await put('brands/brand-a/accesses/x', { label: 'Hosting' });
    await put('brands/brand-a/billing/plan', { plan: 'pro' });
    await put('brands/brand-a/assets/f1', { source: 'drive', folder: 'Diseño', title: 'a.png' });
    // A group with one brand under it.
    await put('brands/grp', { name: 'Grupo', kind: 'group', ancestors: [] });
    await put('brands/sub', { name: 'Sub', kind: 'brand', groupId: 'grp', ancestors: ['grp'] });
    await put('brands/sub/accesses/y', { label: 'Web' });
    await put('brands/sub/assets/f2', { source: 'drive', folder: 'Logos', title: 'b.png' });
    await put(`users/${GROUP_ALL}`, { role: 'client', brandIds: ['grp'] });
    await put(`users/${SUB_ONLY}`, { role: 'client', brandIds: ['sub'] });
    await put(`brands/grp/members/${GROUP_ALL}`, { role: 'client_owner' });
    await put(`brands/sub/members/${SUB_ONLY}`, { role: 'client_member', sections: ['brand', 'files'] });
  });
});

describe('Sections per person', () => {
  it('by default owners read accesses and billing, members do not', async () => {
    await assertSucceeds(getDoc(doc(as(env, OWNER), 'brands/brand-a/accesses/x')));
    await assertSucceeds(getDoc(doc(as(env, OWNER), 'brands/brand-a/billing/plan')));
    await assertFails(getDoc(doc(as(env, MEMBER), 'brands/brand-a/accesses/x')));
    await assertFails(getDoc(doc(as(env, MEMBER), 'brands/brand-a/billing/plan')));
    await assertSucceeds(getDoc(doc(as(env, MEMBER), 'brands/brand-a/assets/f1')));
  });

  it('a picked list opens exactly those sections', async () => {
    await assertSucceeds(getDoc(doc(as(env, PICKED), 'brands/brand-a/accesses/x')));
    await assertFails(getDoc(doc(as(env, PICKED), 'brands/brand-a/billing/plan')));
    await assertFails(getDoc(doc(as(env, PICKED), 'brands/brand-a/assets/f1')));
  });

  it('a group owner sees every brand of the group; a brand member only that brand and its sections', async () => {
    await assertSucceeds(getDoc(doc(as(env, GROUP_ALL), 'brands/sub/accesses/y')));
    await assertSucceeds(getDoc(doc(as(env, GROUP_ALL), 'brands/sub/assets/f2')));
    await assertSucceeds(getDoc(doc(as(env, SUB_ONLY), 'brands/sub/assets/f2')));
    await assertFails(getDoc(doc(as(env, SUB_ONLY), 'brands/sub/accesses/y')));
    await assertFails(getDoc(doc(as(env, SUB_ONLY), 'brands/grp')));
    await assertFails(getDoc(doc(as(env, SUB_ONLY), 'brands/brand-a/assets/f1')));
  });

  it('nobody but the admin changes a member’s sections from the browser', async () => {
    await assertFails(updateDoc(doc(as(env, OWNER), `brands/brand-a/members/${MEMBER}`), { sections: ['accesses'] }));
    await assertFails(updateDoc(doc(as(env, PICKED), `brands/brand-a/members/${PICKED}`), { sections: ['billing'] }));
    await assertSucceeds(updateDoc(doc(as(env, ADMIN), `brands/brand-a/members/${MEMBER}`), { sections: ['brand'] }));
  });
});
