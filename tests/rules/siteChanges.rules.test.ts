// Site changes (website triage) and the Claude work log. The brand reads its site changes; only the admin writes.
// The work log is internal: only the admin reads or writes it.
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc, type Firestore } from 'firebase/firestore';
import { ADMIN, MEMBER, OUTSIDER, OWNER, as, createEnv, seed } from './setup';

let env: RulesTestEnvironment;
const change = (extra: Record<string, unknown> = {}) => ({ key: 'H01', group: 'Home', title: 'Hero nuevo', status: 'delivered', ...extra });

beforeAll(async () => { env = await createEnv(); });
afterAll(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await setDoc(doc(db, 'brands/brand-a/siteChanges/H01'), change());
    await setDoc(doc(db, 'brands/brand-a/activity/a1'), { text: 'Sesión: ajustes del hero' });
  });
});

describe('Site changes', () => {
  it('members of the brand read its site changes; other brands do not', async () => {
    await assertSucceeds(getDoc(doc(as(env, MEMBER), 'brands/brand-a/siteChanges/H01')));
    await assertSucceeds(getDoc(doc(as(env, OWNER), 'brands/brand-a/siteChanges/H01')));
    await assertFails(getDoc(doc(as(env, OUTSIDER), 'brands/brand-a/siteChanges/H01')));
  });

  it('only the admin creates, changes the state of and deletes site changes', async () => {
    await assertSucceeds(setDoc(doc(as(env, ADMIN), 'brands/brand-a/siteChanges/H02'), change({ key: 'H02' })));
    await assertSucceeds(updateDoc(doc(as(env, ADMIN), 'brands/brand-a/siteChanges/H01'), { status: 'client' }));
    await assertFails(updateDoc(doc(as(env, OWNER), 'brands/brand-a/siteChanges/H01'), { status: 'discarded' }));
    await assertFails(setDoc(doc(as(env, MEMBER), 'brands/brand-a/siteChanges/H03'), change()));
    await assertFails(deleteDoc(doc(as(env, OWNER), 'brands/brand-a/siteChanges/H01')));
    await assertSucceeds(deleteDoc(doc(as(env, ADMIN), 'brands/brand-a/siteChanges/H01')));
  });

  it('rejects unknown states and empty titles', async () => {
    await assertFails(setDoc(doc(as(env, ADMIN), 'brands/brand-a/siteChanges/b1'), change({ status: 'done' })));
    await assertFails(setDoc(doc(as(env, ADMIN), 'brands/brand-a/siteChanges/b2'), change({ title: '' })));
  });
});

describe('Claude work log', () => {
  it('is internal: the brand cannot read it', async () => {
    await assertSucceeds(getDoc(doc(as(env, ADMIN), 'brands/brand-a/activity/a1')));
    await assertFails(getDoc(doc(as(env, OWNER), 'brands/brand-a/activity/a1')));
    await assertFails(getDoc(doc(as(env, MEMBER), 'brands/brand-a/activity/a1')));
  });

  it('only the admin adds entries, and entries are never edited', async () => {
    await assertSucceeds(setDoc(doc(as(env, ADMIN), 'brands/brand-a/activity/a2'), { text: 'Subí el logo' }));
    await assertFails(setDoc(doc(as(env, OWNER), 'brands/brand-a/activity/a3'), { text: 'x' }));
    await assertFails(setDoc(doc(as(env, ADMIN), 'brands/brand-a/activity/a4'), { text: '' }));
    await assertFails(updateDoc(doc(as(env, ADMIN), 'brands/brand-a/activity/a1'), { text: 'cambiado' }));
  });
});

describe('Remote connector login', () => {
  it('clients, approvals, codes and tokens are server-only, even for the admin', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as unknown as Firestore, 'mcpTokens/t1'), { uid: 'admin', kind: 'access' });
    });
    for (const col of ['mcpClients', 'mcpAuthRequests', 'mcpCodes', 'mcpTokens']) {
      await assertFails(getDoc(doc(as(env, ADMIN), `${col}/t1`)));
      await assertFails(setDoc(doc(as(env, ADMIN), `${col}/x`), { a: 1 }));
      await assertFails(getDoc(doc(as(env, OWNER), `${col}/t1`)));
    }
  });
});
