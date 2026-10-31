// The Studio: NickMark's instructions to the Brains (brainInbox) are internal. Only the admin reads and writes them.
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, type Firestore } from 'firebase/firestore';
import { ADMIN, MEMBER, OWNER, as, createEnv, seed } from './setup';

let env: RulesTestEnvironment;
const note = (by: string, extra: Record<string, unknown> = {}) =>
  ({ brain: 'creator', brandId: 'brand-a', requestId: null, text: 'Más aire en el símbolo', status: 'open', by, createdAt: serverTimestamp(), ...extra });

beforeAll(async () => { env = await createEnv(); });
afterAll(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore() as unknown as Firestore, 'brainInbox/n1'), { brain: 'builder', brandId: 'brand-a', text: 'Prioriza la home', status: 'open', by: ADMIN });
  });
});

describe('The Studio · brainInbox', () => {
  it('the admin writes an instruction to a Brain and reads the inbox', async () => {
    await assertSucceeds(addDoc(collection(as(env, ADMIN), 'brainInbox'), note(ADMIN)));
    await assertSucceeds(getDocs(collection(as(env, ADMIN), 'brainInbox')));
  });

  it('rejects instructions with a wrong author, an unknown Brain or empty text', async () => {
    await assertFails(addDoc(collection(as(env, ADMIN), 'brainInbox'), note(OWNER)));
    await assertFails(addDoc(collection(as(env, ADMIN), 'brainInbox'), note(ADMIN, { brain: 'nicolas' })));
    await assertFails(addDoc(collection(as(env, ADMIN), 'brainInbox'), note(ADMIN, { text: '' })));
  });

  it('the admin marks an instruction as done, but cannot rewrite its text', async () => {
    await assertSucceeds(updateDoc(doc(as(env, ADMIN), 'brainInbox/n1'), { status: 'done', doneAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(as(env, ADMIN), 'brainInbox/n1'), { text: 'otra cosa' }));
  });

  it('clients never read or write the inbox', async () => {
    await assertFails(getDoc(doc(as(env, OWNER), 'brainInbox/n1')));
    await assertFails(getDocs(collection(as(env, MEMBER), 'brainInbox')));
    await assertFails(addDoc(collection(as(env, OWNER), 'brainInbox'), note(OWNER)));
  });
});

describe('The Studio · launches', () => {
  it('launches are server-only: no client and not even the admin reads or writes them directly', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as unknown as Firestore, 'launches/l1'), { brandId: 'brand-a', brandName: 'A', title: 'Nuevo logo', imagePath: 'launches/l1.png' });
    });
    await assertFails(getDoc(doc(as(env, OWNER), 'launches/l1')));
    await assertFails(getDocs(collection(as(env, MEMBER), 'launches')));
    await assertFails(getDoc(doc(as(env, ADMIN), 'launches/l1')));
    await assertFails(setDoc(doc(as(env, ADMIN), 'launches/l2'), { title: 'x' }));
    await assertFails(setDoc(doc(as(env, OWNER), 'launches/l1/reactions/' + OWNER), { reactions: ['fire'] }));
    await assertFails(getDocs(collection(as(env, MEMBER), 'launches/l1/reactions')));
  });
});

describe('Home · calendar and meetings', () => {
  it('the calendar connection and its OAuth states are server-only, even for the admin', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as unknown as Firestore, 'integrations/googleCalendar'), { ciphertext: 'x', scheme: 'kms' });
      await setDoc(doc(ctx.firestore() as unknown as Firestore, 'calendarStates/s1'), { uid: ADMIN });
    });
    await assertFails(getDoc(doc(as(env, ADMIN), 'integrations/googleCalendar')));
    await assertFails(setDoc(doc(as(env, ADMIN), 'integrations/googleCalendar'), { ciphertext: 'y' }));
    await assertFails(getDoc(doc(as(env, OWNER), 'calendarStates/s1')));
    await assertFails(setDoc(doc(as(env, OWNER), 'calendarStates/s2'), { uid: OWNER }));
  });
  it('meeting notes stay admin-only: a brand member cannot read them directly', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as unknown as Firestore, 'brands/brand-a/meetings/m1'), { title: 'Kickoff', notes: 'internal' });
    });
    await assertFails(getDoc(doc(as(env, OWNER), 'brands/brand-a/meetings/m1')));
    await assertFails(getDoc(doc(as(env, MEMBER), 'brands/brand-a/meetings/m1')));
  });
});

describe('Home · meeting bookings', () => {
  it('bookings are server-only: nobody reads or writes them from the browser', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as unknown as Firestore, 'bookings/b1'), { uid: OWNER, brandId: 'brand-a' });
    });
    await assertFails(getDoc(doc(as(env, OWNER), 'bookings/b1')));
    await assertFails(getDoc(doc(as(env, ADMIN), 'bookings/b1')));
    await assertFails(setDoc(doc(as(env, OWNER), 'bookings/b2'), { uid: OWNER }));
  });
});
