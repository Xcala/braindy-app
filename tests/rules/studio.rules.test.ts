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
