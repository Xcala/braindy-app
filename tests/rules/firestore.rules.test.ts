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

  it('authors and approvers resolve comments; plain members cannot resolve others, nobody edits text', async () => {
    const resolve = (by: string) => ({ resolved: true, resolvedBy: by, resolvedAt: serverTimestamp() });
    await setDoc(doc(as(env, MEMBER), `brands/${BRAND_A}/requests/r1/comments/mine`), comment(MEMBER));
    await assertSucceeds(updateDoc(doc(as(env, MEMBER), `brands/${BRAND_A}/requests/r1/comments/mine`), resolve(MEMBER)));
    await assertSucceeds(updateDoc(doc(as(env, APPROVER), `brands/${BRAND_A}/requests/r1/comments/c1`), resolve(APPROVER)));
    await assertFails(updateDoc(doc(as(env, MEMBER), `brands/${BRAND_A}/requests/r1/comments/c1`), resolve(MEMBER)));
    await assertFails(updateDoc(doc(as(env, MEMBER), `brands/${BRAND_A}/requests/r1/comments/mine`), { text: 'edited' }));
    await assertFails(updateDoc(doc(as(env, APPROVER), `brands/${BRAND_A}/requests/r1/comments/c1`), resolve(OWNER)));
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

  it('access log: owner and admin read, nobody writes from the client', async () => {
    await assertSucceeds(getDoc(doc(as(env, OWNER), `brands/${BRAND_A}/accessLog/e1`)));
    await assertSucceeds(getDoc(doc(as(env, ADMIN), `brands/${BRAND_A}/accessLog/e1`)));
    await assertFails(getDoc(doc(as(env, MEMBER), `brands/${BRAND_A}/accessLog/e1`)));
    await assertFails(getDoc(doc(as(env, OUTSIDER), `brands/${BRAND_A}/accessLog/e1`)));
    await assertFails(setDoc(doc(as(env, OWNER), `brands/${BRAND_A}/accessLog/e2`), { action: 'revealed' }));
    await assertFails(setDoc(doc(as(env, ADMIN), `brands/${BRAND_A}/accessLog/e2`), { action: 'revealed' }));
  });

  it('brand settings: members read, nobody writes; review links are backend only', async () => {
    await assertSucceeds(getDoc(doc(as(env, MEMBER), `brands/${BRAND_A}/settings/notices`)));
    await assertFails(getDoc(doc(as(env, OUTSIDER), `brands/${BRAND_A}/settings/notices`)));
    await assertFails(setDoc(doc(as(env, OWNER), `brands/${BRAND_A}/settings/notices`), { whatsapp: '573000000000' }));
    for (const who of [OWNER, ADMIN, OUTSIDER]) {
      await assertFails(getDoc(doc(as(env, who), 'reviewLinks/abc')));
      await assertFails(setDoc(doc(as(env, who), 'reviewLinks/abc'), { brandId: BRAND_A }));
    }
  });

  it('reports: members see published only, admin sees drafts, nobody writes; sessions admin read only', async () => {
    await assertSucceeds(getDoc(doc(as(env, MEMBER), `brands/${BRAND_A}/reports/2026-09`)));
    await assertFails(getDoc(doc(as(env, MEMBER), `brands/${BRAND_A}/reports/2026-10`)));
    await assertSucceeds(getDoc(doc(as(env, ADMIN), `brands/${BRAND_A}/reports/2026-10`)));
    await assertFails(getDoc(doc(as(env, OUTSIDER), `brands/${BRAND_A}/reports/2026-09`)));
    await assertFails(setDoc(doc(as(env, ADMIN), `brands/${BRAND_A}/reports/2026-11`), { published: true }));
    await assertSucceeds(getDoc(doc(as(env, ADMIN), 'sessions/2026-11-01T14:00:00.000Z')));
    await assertFails(getDoc(doc(as(env, OWNER), 'sessions/2026-11-01T14:00:00.000Z')));
  });

  it('billing: owners and admin read, members and others do not, nobody writes; Stripe maps backend only', async () => {
    for (const p of ['billing/plan', 'invoices/i1', 'transfers/t1']) {
      await assertSucceeds(getDoc(doc(as(env, OWNER), `brands/${BRAND_A}/${p}`)));
      await assertSucceeds(getDoc(doc(as(env, ADMIN), `brands/${BRAND_A}/${p}`)));
      await assertFails(getDoc(doc(as(env, MEMBER), `brands/${BRAND_A}/${p}`)));
      await assertFails(getDoc(doc(as(env, OUTSIDER), `brands/${BRAND_A}/${p}`)));
      await assertFails(setDoc(doc(as(env, ADMIN), `brands/${BRAND_A}/${p}`), { status: 'paid' }));
    }
    await assertFails(getDoc(doc(as(env, ADMIN), 'stripeCustomers/cus_1')));
    await assertSucceeds(getDoc(doc(as(env, ADMIN), `brands/${BRAND_A}/notices/n1`)));
    await assertSucceeds(getDoc(doc(as(env, MEMBER), `brands/${BRAND_A}/insights/i1`)));
    await assertFails(getDoc(doc(as(env, OUTSIDER), `brands/${BRAND_A}/insights/i1`)));
    await assertFails(setDoc(doc(as(env, ADMIN), `brands/${BRAND_A}/insights/i2`), { title: 'x' }));
    await assertFails(getDoc(doc(as(env, ADMIN), `brands/${BRAND_A}/watch/w1`)));
    await assertSucceeds(getDoc(doc(as(env, ADMIN), `brands/${BRAND_A}/meetings/m1`)));
    await assertFails(getDoc(doc(as(env, OWNER), `brands/${BRAND_A}/meetings/m1`)));
    await assertSucceeds(getDoc(doc(as(env, ADMIN), 'brainTasks/t1')));
    await assertFails(getDoc(doc(as(env, OWNER), 'brainTasks/t1')));
    await assertFails(getDoc(doc(as(env, OWNER), `brands/${BRAND_A}/notices/n1`)));
    await assertFails(setDoc(doc(as(env, ADMIN), 'stripeEvents/evt_1'), { type: 'x' }));
  });

  it('encrypted values are unreachable from any client, admin included', async () => {
    for (const who of [OWNER, ADMIN, MEMBER]) {
      await assertFails(getDoc(doc(as(env, who), `accessSecrets/${BRAND_A}__ig`)));
      await assertFails(setDoc(doc(as(env, who), `accessSecrets/${BRAND_A}__x`), { ciphertext: 'x' }));
    }
  });
});

describe('cross-brand queries and invites', () => {
  it('only admin queries requests across every brand', async () => {
    const { collectionGroup, query, where } = await import('firebase/firestore');
    await assertSucceeds(getDocs(query(collectionGroup(as(env, ADMIN), 'requests'), where('status', '==', 'to_approve'))));
    await assertFails(getDocs(query(collectionGroup(as(env, OWNER), 'requests'), where('status', '==', 'to_approve'))));
  });

  it('invites are backend-only', async () => {
    await assertFails(getDoc(doc(as(env, ADMIN), 'invites/x')));
    await assertFails(setDoc(doc(as(env, OWNER), 'invites/x'), { email: 'a@b.co' }));
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
