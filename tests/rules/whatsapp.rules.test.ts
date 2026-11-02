// WhatsApp channel: the backend writes everything. Only the admin reads the inbox of unknown numbers and the
// channel status; the phone index, processed ids and sent notices are never readable from the browser.
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, type Firestore } from 'firebase/firestore';
import { ADMIN, MEMBER, OWNER, as, createEnv, seed } from './setup';

let env: RulesTestEnvironment;

beforeAll(async () => { env = await createEnv(); });
afterAll(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await setDoc(doc(db, 'waInbox/m1'), { phone: '573001112233', text: 'hola', status: 'new' });
    await setDoc(doc(db, 'waChannel/status'), { lastWebhookAt: 1 });
    await setDoc(doc(db, 'waContacts/573001112233'), { uid: OWNER, optIn: true });
    await setDoc(doc(db, 'waEvents/m1'), { at: 1 });
    await setDoc(doc(db, 'waOutbound/o1'), { brandId: 'brand-a' });
  });
});

describe('WhatsApp channel', () => {
  it('only the admin reads the inbox and the channel status', async () => {
    await assertSucceeds(getDoc(doc(as(env, ADMIN), 'waInbox/m1')));
    await assertSucceeds(getDoc(doc(as(env, ADMIN), 'waChannel/status')));
    await assertFails(getDoc(doc(as(env, OWNER), 'waInbox/m1')));
    await assertFails(getDoc(doc(as(env, MEMBER), 'waChannel/status')));
  });

  it('nobody writes the inbox or the status from the browser, not even the admin', async () => {
    await assertFails(setDoc(doc(as(env, ADMIN), 'waInbox/m2'), { text: 'x' }));
    await assertFails(updateDoc(doc(as(env, ADMIN), 'waInbox/m1'), { status: 'assigned' }));
    await assertFails(setDoc(doc(as(env, ADMIN), 'waChannel/status'), { lastError: 'x' }));
  });

  it('phone index, processed ids and sent notices are backend only', async () => {
    for (const path of ['waContacts/573001112233', 'waEvents/m1', 'waOutbound/o1']) {
      await assertFails(getDoc(doc(as(env, ADMIN), path)));
      await assertFails(getDoc(doc(as(env, OWNER), path)));
      await assertFails(setDoc(doc(as(env, ADMIN), path), { x: 1 }));
    }
  });

  it('a person reads their own WhatsApp number on their profile but cannot change it directly', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore() as unknown as Firestore, `users/${OWNER}`), { whatsapp: { phone: '573001112233', optIn: true } });
    });
    await assertSucceeds(getDoc(doc(as(env, OWNER), `users/${OWNER}`)));
    await assertFails(getDoc(doc(as(env, MEMBER), `users/${OWNER}`)));
    await assertFails(updateDoc(doc(as(env, OWNER), `users/${OWNER}`), { whatsapp: { phone: '570000000000', optIn: true } }));
  });
});
