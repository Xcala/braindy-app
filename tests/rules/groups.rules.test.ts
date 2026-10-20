// Multi-brand groups: membership in a group grants access to every brand below it.
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, setDoc, updateDoc, type Firestore } from 'firebase/firestore';
import { as, createEnv, serverTimestamp } from './setup';

const GROUP = 'group-x';        // top group
const SUB = 'sub-x';            // subgroup inside GROUP
const CHILD = 'child-x';        // brand inside SUB
const OTHER_GROUP = 'group-y';
const OTHER_CHILD = 'child-y';

const GROUP_OWNER = 'g-owner';
const GROUP_MEMBER = 'g-member';
const CHILD_ONLY = 'c-member';

let env: RulesTestEnvironment;

beforeAll(async () => { env = await createEnv(); });
afterAll(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    const put = (p: string, d: Record<string, unknown>) => setDoc(doc(db, p), d);
    await put(`brands/${GROUP}`, { name: 'Group X', kind: 'group', ancestors: [] });
    await put(`brands/${SUB}`, { name: 'Sub X', kind: 'group', groupId: GROUP, ancestors: [GROUP] });
    await put(`brands/${CHILD}`, { name: 'Child X', kind: 'brand', groupId: SUB, ancestors: [SUB, GROUP] });
    await put(`brands/${OTHER_GROUP}`, { name: 'Group Y', kind: 'group', ancestors: [] });
    await put(`brands/${OTHER_CHILD}`, { name: 'Child Y', kind: 'brand', groupId: OTHER_GROUP, ancestors: [OTHER_GROUP] });
    for (const b of [CHILD, OTHER_CHILD]) {
      await put(`brands/${b}/context/voice`, { tone: 'x' });
      await put(`brands/${b}/assets/a1`, { type: 'file', title: 'Logo' });
      await put(`brands/${b}/requests/r1`, { status: 'to_approve' });
      await put(`brands/${b}/requests/r1/versions/v1`, { n: 1, approval: { state: 'pending' } });
      await put(`brands/${b}/accesses/ig`, { platform: 'instagram' });
    }
    await put(`brands/${GROUP}/members/${GROUP_OWNER}`, { role: 'client_owner', canApprove: true });
    await put(`brands/${GROUP}/members/${GROUP_MEMBER}`, { role: 'client_member', canApprove: false });
    await put(`brands/${CHILD}/members/${CHILD_ONLY}`, { role: 'client_member', canApprove: false });
  });
});

const approve = (by: string) => ({ approval: { state: 'approved', by, at: serverTimestamp() } });

describe('group membership', () => {
  it('a group member reads every brand below the group, at any depth', async () => {
    const db = as(env, GROUP_MEMBER);
    await assertSucceeds(getDoc(doc(db, `brands/${GROUP}`)));
    await assertSucceeds(getDoc(doc(db, `brands/${SUB}`)));
    await assertSucceeds(getDoc(doc(db, `brands/${CHILD}`)));
    await assertSucceeds(getDoc(doc(db, `brands/${CHILD}/context/voice`)));
    await assertSucceeds(getDocs(collection(db, `brands/${CHILD}/assets`)));
    await assertSucceeds(getDocs(collection(db, `brands/${CHILD}/requests`)));
  });

  it('a group member sees nothing of another group', async () => {
    const db = as(env, GROUP_MEMBER);
    await assertFails(getDoc(doc(db, `brands/${OTHER_GROUP}`)));
    await assertFails(getDoc(doc(db, `brands/${OTHER_CHILD}`)));
    await assertFails(getDocs(collection(db, `brands/${OTHER_CHILD}/assets`)));
  });

  it('a member of one brand cannot climb to its group or siblings', async () => {
    const db = as(env, CHILD_ONLY);
    await assertSucceeds(getDoc(doc(db, `brands/${CHILD}`)));
    await assertFails(getDoc(doc(db, `brands/${SUB}`)));
    await assertFails(getDoc(doc(db, `brands/${GROUP}`)));
    await assertFails(getDoc(doc(db, `brands/${OTHER_CHILD}`)));
  });

  it('a group owner approves and sees credentials metadata in child brands; a plain group member does not', async () => {
    await assertSucceeds(updateDoc(doc(as(env, GROUP_OWNER), `brands/${CHILD}/requests/r1/versions/v1`), approve(GROUP_OWNER)));
    await assertFails(updateDoc(doc(as(env, GROUP_MEMBER), `brands/${CHILD}/requests/r1/versions/v1`), approve(GROUP_MEMBER)));
    await assertSucceeds(getDoc(doc(as(env, GROUP_OWNER), `brands/${CHILD}/accesses/ig`)));
    await assertFails(getDoc(doc(as(env, GROUP_MEMBER), `brands/${CHILD}/accesses/ig`)));
  });

  it('a group owner manages members of child brands but cannot edit the group itself', async () => {
    const db = as(env, GROUP_OWNER);
    await assertSucceeds(setDoc(doc(db, `brands/${CHILD}/members/new-user`), { role: 'client_member', canApprove: false }));
    await assertFails(updateDoc(doc(db, `brands/${GROUP}`), { name: 'Renamed' }));
    await assertFails(updateDoc(doc(db, `brands/${CHILD}`), { status: 'archived' }));
  });

  it('a group member opens requests for a child brand', async () => {
    const db = as(env, GROUP_MEMBER);
    await assertSucceeds(setDoc(doc(db, `brands/${CHILD}/requests/new`), {
      category: 'SOCIAL', status: 'in_production', createdBy: GROUP_MEMBER, createdAt: serverTimestamp(),
    }));
  });
});
