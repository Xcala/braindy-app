// Comments pinned on the site (Figma style). Anyone of the brand comments and replies; other brands see nothing.
// Resolving: the author, an approver or the admin. Text never changes after it is sent.
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc, type Firestore } from 'firebase/firestore';
import { ADMIN, APPROVER, MEMBER, OUTSIDER, OWNER, as, createEnv, seed } from './setup';

let env: RulesTestEnvironment;
const C = 'brands/brand-a/siteComments';
const comment = (author: string, extra: Record<string, unknown> = {}) => ({
  author, authorName: 'Mar', text: 'Cambia esta foto', url: 'https://site.co/nosotros/', spot: { selector: '#hero', text: 'Hola', x: 0.5, y: 0.5 },
  resolved: false, createdAt: serverTimestamp(), ...extra,
});

beforeAll(async () => { env = await createEnv(); });
afterAll(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await setDoc(doc(db, `${C}/c1`), { ...comment(MEMBER), createdAt: new Date() });
  });
});

describe('Site comments', () => {
  it('members of the brand read comments; other brands do not', async () => {
    await assertSucceeds(getDoc(doc(as(env, OWNER), `${C}/c1`)));
    await assertSucceeds(getDoc(doc(as(env, ADMIN), `${C}/c1`)));
    await assertFails(getDoc(doc(as(env, OUTSIDER), `${C}/c1`)));
  });

  it('a member comments in their own name only, with text and a page', async () => {
    await assertSucceeds(setDoc(doc(as(env, MEMBER), `${C}/c2`), comment(MEMBER)));
    await assertSucceeds(setDoc(doc(as(env, ADMIN), `${C}/c3`), comment(ADMIN)));
    await assertFails(setDoc(doc(as(env, MEMBER), `${C}/c4`), comment(OWNER)));
    await assertFails(setDoc(doc(as(env, OUTSIDER), `${C}/c5`), comment(OUTSIDER)));
    await assertFails(setDoc(doc(as(env, MEMBER), `${C}/c6`), comment(MEMBER, { text: '' })));
    await assertFails(setDoc(doc(as(env, MEMBER), `${C}/c7`), comment(MEMBER, { resolved: true })));
  });

  it('the author, an approver or the admin resolves; nobody rewrites the text', async () => {
    const resolve = { resolved: true, resolvedBy: MEMBER, resolvedAt: serverTimestamp() };
    await assertSucceeds(updateDoc(doc(as(env, MEMBER), `${C}/c1`), resolve));
    await assertSucceeds(updateDoc(doc(as(env, APPROVER), `${C}/c1`), { ...resolve, resolved: false, resolvedBy: APPROVER }));
    await assertFails(updateDoc(doc(as(env, MEMBER), `${C}/c1`), { text: 'otro texto' }));
    await assertFails(updateDoc(doc(as(env, OUTSIDER), `${C}/c1`), resolve));
    await assertSucceeds(updateDoc(doc(as(env, ADMIN), `${C}/c1`), { text: 'corregido' }));
  });

  it('only the author or the admin deletes a comment', async () => {
    await assertFails(deleteDoc(doc(as(env, OWNER), `${C}/c1`)));
    await assertSucceeds(deleteDoc(doc(as(env, MEMBER), `${C}/c1`)));
  });

  it('members reply in their own name; replies are not edited', async () => {
    const reply = (author: string) => ({ author, authorName: 'Ana', text: 'Listo', createdAt: serverTimestamp() });
    await assertSucceeds(setDoc(doc(as(env, OWNER), `${C}/c1/replies/r1`), reply(OWNER)));
    await assertFails(setDoc(doc(as(env, OWNER), `${C}/c1/replies/r2`), reply(MEMBER)));
    await assertFails(setDoc(doc(as(env, OUTSIDER), `${C}/c1/replies/r3`), reply(OUTSIDER)));
    await assertFails(updateDoc(doc(as(env, OWNER), `${C}/c1/replies/r1`), { text: 'otro' }));
    await assertSucceeds(getDoc(doc(as(env, MEMBER), `${C}/c1/replies/r1`)));
  });
});
