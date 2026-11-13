// Wishlist: a brand's people write and «me too» their wishes; the shared history is public to every signed-in client;
// status and answers are the admin's; another brand never sees them.
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  addDoc, arrayRemove, arrayUnion, collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc,
  updateDoc, where, type Firestore,
} from 'firebase/firestore';
import { ADMIN, BRAND_A, MEMBER, OUTSIDER, OWNER, as, createEnv, seed } from './setup';

let env: RulesTestEnvironment;
const A = `brands/${BRAND_A}/wishes`;

beforeAll(async () => { env = await createEnv(); });
afterAll(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await setDoc(doc(db, `${A}/w1`), { text: 'Menú más corto', kind: 'improve', status: 'new', author: MEMBER, authorName: 'Mar', votes: [] });
    await setDoc(doc(db, `${A}/w2`), { text: 'Ya planeada', kind: 'fix', status: 'planned', author: MEMBER, authorName: 'Mar', votes: [] });
    await setDoc(doc(db, 'wishes/h1'), { text: 'Pedir por WhatsApp', kind: 'improve', status: 'done', public: true, votes: [] });
    await setDoc(doc(db, 'wishes/h2'), { text: 'Borrador', kind: 'improve', status: 'new', public: false, votes: [] });
  });
});

const fresh = (author: string) => ({ text: 'Que el buscador encuentre pedidos', kind: 'improve', status: 'new', author, authorName: 'Ana', votes: [], createdAt: serverTimestamp() });

describe('Wishlist', () => {
  it('the brand reads its wishes; another brand does not', async () => {
    await assertSucceeds(getDocs(collection(as(env, MEMBER), A)));
    await assertFails(getDocs(collection(as(env, OUTSIDER), A)));
    await assertFails(getDoc(doc(as(env, OUTSIDER), `${A}/w1`)));
  });

  it('every signed-in client reads the public history, never hidden entries; signed-out reads nothing', async () => {
    await assertSucceeds(getDocs(query(collection(as(env, OUTSIDER), 'wishes'), where('public', '==', true))));
    await assertFails(getDocs(collection(as(env, OUTSIDER), 'wishes')));
    await assertFails(getDoc(doc(as(env, OWNER), 'wishes/h2')));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'wishes/h1')));
  });

  it('who asked for a history entry is for the admin only', async () => {
    await assertSucceeds(setDoc(doc(as(env, ADMIN), 'wishCredits/h1'), { brandId: BRAND_A, name: 'Ana' }));
    await assertFails(getDoc(doc(as(env, OWNER), 'wishCredits/h1')));
    await assertFails(setDoc(doc(as(env, OWNER), 'wishCredits/h1'), { name: 'x' }));
  });

  it('only the admin reads every brand at once', async () => {
    await assertSucceeds(getDocs(collectionGroup(as(env, ADMIN), 'wishes')));
    await assertFails(getDocs(collectionGroup(as(env, OWNER), 'wishes')));
  });

  it('a member writes a new wish as themself, with no status, answer or votes of their own choosing', async () => {
    await assertSucceeds(addDoc(collection(as(env, OWNER), A), fresh(OWNER)));
    await assertFails(addDoc(collection(as(env, OWNER), A), fresh(MEMBER)));
    await assertFails(addDoc(collection(as(env, OWNER), A), { ...fresh(OWNER), status: 'done' }));
    await assertFails(addDoc(collection(as(env, OWNER), A), { ...fresh(OWNER), reply: 'sí' }));
    await assertFails(addDoc(collection(as(env, OWNER), A), { ...fresh(OWNER), votes: [OWNER, 'x'] }));
    await assertFails(addDoc(collection(as(env, OWNER), A), { ...fresh(OWNER), text: 'no' }));
    // A voice note can stand in for the text.
    await assertSucceeds(addDoc(collection(as(env, OWNER), A), { ...fresh(OWNER), text: '', audio: { assetId: 'a1', name: 'nota.webm', size: 9, contentType: 'audio/webm' } }));
    await assertFails(addDoc(collection(as(env, OWNER), A), { ...fresh(OWNER), text: '', audio: 'x' }));
    await assertFails(addDoc(collection(as(env, OUTSIDER), A), fresh(OUTSIDER)));
    await assertFails(addDoc(collection(as(env, OWNER), 'wishes'), { ...fresh(OWNER), public: true }));
  });

  it('«me too» adds or removes only one\'s own vote', async () => {
    await assertSucceeds(updateDoc(doc(as(env, OWNER), `${A}/w1`), { votes: arrayUnion(OWNER) }));
    await assertSucceeds(updateDoc(doc(as(env, OWNER), `${A}/w1`), { votes: arrayRemove(OWNER) }));
    await assertFails(updateDoc(doc(as(env, OWNER), `${A}/w1`), { votes: arrayUnion('someone-else') }));
    await assertFails(updateDoc(doc(as(env, OWNER), `${A}/w1`), { votes: [OWNER], status: 'done' }));
    await assertSucceeds(updateDoc(doc(as(env, OUTSIDER), 'wishes/h1'), { votes: arrayUnion(OUTSIDER) }));
    await assertFails(updateDoc(doc(as(env, OUTSIDER), `${A}/w1`), { votes: arrayUnion(OUTSIDER) }));
    await assertFails(updateDoc(doc(as(env, OUTSIDER), 'wishes/h1'), { text: 'cambiado' }));
  });

  it('the author edits or deletes while new; status and answers are the admin\'s', async () => {
    await assertSucceeds(updateDoc(doc(as(env, MEMBER), `${A}/w1`), { text: 'Menú más corto, por favor', editedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(as(env, OWNER), `${A}/w1`), { text: 'otro', editedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(as(env, MEMBER), `${A}/w2`), { text: 'otro', editedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(as(env, MEMBER), `${A}/w1`), { status: 'done' }));
    await assertFails(deleteDoc(doc(as(env, MEMBER), `${A}/w2`)));
    await assertSucceeds(deleteDoc(doc(as(env, MEMBER), `${A}/w1`)));
    await assertSucceeds(updateDoc(doc(as(env, ADMIN), `${A}/w2`), { status: 'done', reply: 'Listo' }));
    await assertSucceeds(addDoc(collection(as(env, ADMIN), 'wishes'), { text: 'Zoom en las piezas', kind: 'improve', status: 'done', public: true, votes: [] }));
  });
});
