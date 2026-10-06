import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, getDocs, collection, setDoc, updateDoc } from 'firebase/firestore';
import {
  ADMIN, APPROVER, BRAND_A, BRAND_B, MEMBER, NO_PROFILE, OUTSIDER, OWNER,
  as, createEnv, seed, serverTimestamp,
} from './setup';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
});

afterAll(async () => {
  await env.cleanup();
});

const newRequest = (createdBy: string) => ({
  category: 'SOCIAL',
  subcategory: 'Post',
  formatType: 'carousel',
  cards: { product: 'x', application: 'y', scene: 'z' },
  moodboard: [],
  status: 'in_production',
  createdBy,
  createdAt: serverTimestamp(),
});

describe('unauthenticated', () => {
  it('cannot read anything', async () => {
    const db = as(env, null);
    await assertFails(getDoc(doc(db, `brands/${BRAND_A}`)));
    await assertFails(getDoc(doc(db, `users/${OWNER}`)));
    await assertFails(getDoc(doc(db, 'brains/creator')));
  });
});

describe('users', () => {
  it('a user reads their own profile but not others', async () => {
    const db = as(env, OWNER);
    await assertSucceeds(getDoc(doc(db, `users/${OWNER}`)));
    await assertFails(getDoc(doc(db, `users/${MEMBER}`)));
  });

  it('a user can rename themselves but not change role or brands', async () => {
    const db = as(env, OWNER);
    await assertSucceeds(updateDoc(doc(db, `users/${OWNER}`), { name: 'Ana M.' }));
    await assertFails(updateDoc(doc(db, `users/${OWNER}`), { role: 'admin' }));
    await assertFails(updateDoc(doc(db, `users/${OWNER}`), { brandIds: [BRAND_A, BRAND_B] }));
  });

  it('an existing Auth user without a profile cannot create one for themselves', async () => {
    const db = as(env, NO_PROFILE);
    await assertFails(setDoc(doc(db, `users/${NO_PROFILE}`), { role: 'admin' }));
    await assertFails(getDoc(doc(db, `brands/${BRAND_A}`)));
  });

  it('admin reads and writes any profile', async () => {
    const db = as(env, ADMIN);
    await assertSucceeds(getDoc(doc(db, `users/${OWNER}`)));
    await assertSucceeds(updateDoc(doc(db, `users/${OWNER}`), { brandIds: [BRAND_A] }));
  });
});

describe('brand isolation', () => {
  it('members read their brand and its context, assets, requests', async () => {
    const db = as(env, MEMBER);
    await assertSucceeds(getDoc(doc(db, `brands/${BRAND_A}`)));
    await assertSucceeds(getDoc(doc(db, `brands/${BRAND_A}/context/voice`)));
    await assertSucceeds(getDoc(doc(db, `brands/${BRAND_A}/assets/deck`)));
    await assertSucceeds(getDocs(collection(db, `brands/${BRAND_A}/requests`)));
    await assertSucceeds(getDoc(doc(db, `brands/${BRAND_A}/requests/r1/versions/v1`)));
  });

  it('clients never see another brand', async () => {
    const db = as(env, OUTSIDER);
    await assertFails(getDoc(doc(db, `brands/${BRAND_A}`)));
    await assertFails(getDoc(doc(db, `brands/${BRAND_A}/context/voice`)));
    await assertFails(getDocs(collection(db, `brands/${BRAND_A}/requests`)));
    await assertFails(getDoc(doc(db, `brands/${BRAND_A}/requests/r1/comments/c1`)));
  });

  it('clients cannot list all brands', async () => {
    await assertFails(getDocs(collection(as(env, OWNER), 'brands')));
  });

  it('admin sees every brand', async () => {
    const db = as(env, ADMIN);
    await assertSucceeds(getDocs(collection(db, 'brands')));
    await assertSucceeds(getDoc(doc(db, `brands/${BRAND_B}/context/voice`)));
  });

  it('only admin edits brand, context and assets', async () => {
    const owner = as(env, OWNER);
    await assertFails(updateDoc(doc(owner, `brands/${BRAND_A}`), { name: 'Hacked' }));
    await assertFails(setDoc(doc(owner, `brands/${BRAND_A}/context/voice`), { tone: 'loud' }));
    await assertFails(setDoc(doc(owner, `brands/${BRAND_A}/assets/new`), { type: 'file' }));
    await assertSucceeds(setDoc(doc(as(env, ADMIN), `brands/${BRAND_A}/context/voice`), { tone: 'calm' }));
  });
});

describe('members', () => {
  it('owner invites and removes members of their brand', async () => {
    const db = as(env, OWNER);
    await assertSucceeds(setDoc(doc(db, `brands/${BRAND_A}/members/new-user`), { role: 'client_member', canApprove: false }));
    await assertSucceeds(deleteDoc(doc(db, `brands/${BRAND_A}/members/${MEMBER}`)));
  });

  it('owner cannot grant invalid roles or edit their own entry', async () => {
    const db = as(env, OWNER);
    await assertFails(setDoc(doc(db, `brands/${BRAND_A}/members/new-user`), { role: 'admin' }));
    await assertFails(setDoc(doc(db, `brands/${BRAND_A}/members/new-user`), { role: 'client_member', extra: 1 }));
    await assertFails(updateDoc(doc(db, `brands/${BRAND_A}/members/${OWNER}`), { canApprove: false }));
  });

  it('members cannot manage members, and owners cannot touch other brands', async () => {
    await assertFails(setDoc(doc(as(env, MEMBER), `brands/${BRAND_A}/members/${MEMBER}`), { role: 'client_owner' }));
    await assertFails(setDoc(doc(as(env, OUTSIDER), `brands/${BRAND_A}/members/x`), { role: 'client_member' }));
  });
});

describe('requests', () => {
  it('a member opens a request for their brand', async () => {
    const db = as(env, MEMBER);
    await assertSucceeds(setDoc(doc(db, `brands/${BRAND_A}/requests/new`), newRequest(MEMBER)));
  });

  it('cannot open a request for another brand, as someone else, or pre-set server fields', async () => {
    await assertFails(setDoc(doc(as(env, OUTSIDER), `brands/${BRAND_A}/requests/new`), newRequest(OUTSIDER)));
    await assertFails(setDoc(doc(as(env, MEMBER), `brands/${BRAND_A}/requests/new`), newRequest(OWNER)));
    await assertFails(setDoc(doc(as(env, MEMBER), `brands/${BRAND_A}/requests/new`), { ...newRequest(MEMBER), status: 'approved' }));
    await assertFails(setDoc(doc(as(env, MEMBER), `brands/${BRAND_A}/requests/new`), { ...newRequest(MEMBER), leadBrain: 'creator' }));
  });

  it('clients cannot change request status', async () => {
    await assertFails(updateDoc(doc(as(env, OWNER), `brands/${BRAND_A}/requests/r1`), { status: 'published' }));
    await assertSucceeds(updateDoc(doc(as(env, ADMIN), `brands/${BRAND_A}/requests/r1`), { status: 'approved' }));
  });
});

describe('approvals on versions', () => {
  const decision = (by: string) => ({
    approval: { state: 'approved', by, at: serverTimestamp() },
  });

  it('owner and granted members approve', async () => {
    await assertSucceeds(updateDoc(doc(as(env, OWNER), `brands/${BRAND_A}/requests/r1/versions/v1`), decision(OWNER)));
    await assertSucceeds(updateDoc(doc(as(env, APPROVER), `brands/${BRAND_A}/requests/r1/versions/v1`), decision(APPROVER)));
  });

  it('members without the grant cannot approve', async () => {
    await assertFails(updateDoc(doc(as(env, MEMBER), `brands/${BRAND_A}/requests/r1/versions/v1`), decision(MEMBER)));
  });

  it('approvers cannot sign as someone else or change files', async () => {
    const db = as(env, OWNER);
    await assertFails(updateDoc(doc(db, `brands/${BRAND_A}/requests/r1/versions/v1`), decision(MEMBER)));
    await assertFails(updateDoc(doc(db, `brands/${BRAND_A}/requests/r1/versions/v1`), { ...decision(OWNER), files: ['x'] }));
    await assertFails(updateDoc(doc(db, `brands/${BRAND_A}/requests/r1/versions/v1`), {
      approval: { state: 'published', by: OWNER, at: serverTimestamp() },
    }));
  });

  it('other brands cannot approve', async () => {
    await assertFails(updateDoc(doc(as(env, OUTSIDER), `brands/${BRAND_A}/requests/r1/versions/v1`), decision(OUTSIDER)));
  });
});

describe('comments', () => {
  const comment = (author: string) => ({ author, text: 'Looks good', createdAt: serverTimestamp() });

  it('members comment as themselves and delete only their own', async () => {
    const db = as(env, MEMBER);
    await assertSucceeds(setDoc(doc(db, `brands/${BRAND_A}/requests/r1/comments/mine`), comment(MEMBER)));
    await assertSucceeds(deleteDoc(doc(db, `brands/${BRAND_A}/requests/r1/comments/mine`)));
    await assertFails(deleteDoc(doc(db, `brands/${BRAND_A}/requests/r1/comments/c1`)));
  });

  it('cannot impersonate or comment on another brand', async () => {
    await assertFails(setDoc(doc(as(env, MEMBER), `brands/${BRAND_A}/requests/r1/comments/x`), comment(OWNER)));
    await assertFails(setDoc(doc(as(env, OUTSIDER), `brands/${BRAND_A}/requests/r1/comments/x`), comment(OUTSIDER)));
  });
});

describe('accesses (credentials)', () => {
  it('owner and admin read metadata; plain members and other brands do not', async () => {
    await assertSucceeds(getDoc(doc(as(env, OWNER), `brands/${BRAND_A}/accesses/ig`)));
    await assertSucceeds(getDoc(doc(as(env, ADMIN), `brands/${BRAND_A}/accesses/ig`)));
    await assertFails(getDoc(doc(as(env, MEMBER), `brands/${BRAND_A}/accesses/ig`)));
    await assertFails(getDoc(doc(as(env, OUTSIDER), `brands/${BRAND_A}/accesses/ig`)));
  });

  it('nobody writes credentials from the client, not even admin', async () => {
    await assertFails(setDoc(doc(as(env, OWNER), `brands/${BRAND_A}/accesses/x`), { platform: 'email', password: 'plain' }));
    await assertFails(setDoc(doc(as(env, ADMIN), `brands/${BRAND_A}/accesses/x`), { platform: 'email' }));
  });
});

describe('audit and brains', () => {
  it('only admin reads audit; nobody writes it from the client', async () => {
    await assertSucceeds(getDoc(doc(as(env, ADMIN), 'audit/e1')));
    await assertFails(getDoc(doc(as(env, OWNER), 'audit/e1')));
    await assertFails(setDoc(doc(as(env, ADMIN), 'audit/e2'), { type: 'fake' }));
  });

  it('signed-in users read Brain status; only admin edits it', async () => {
    await assertSucceeds(getDoc(doc(as(env, MEMBER), 'brains/creator')));
    await assertFails(updateDoc(doc(as(env, MEMBER), 'brains/creator'), { status: 'working' }));
    await assertSucceeds(updateDoc(doc(as(env, ADMIN), 'brains/creator'), { status: 'working' }));
  });
});
