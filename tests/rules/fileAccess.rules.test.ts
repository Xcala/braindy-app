// Folder access: NickMark chooses which top-level Drive folders a client sees. Hidden folders cannot be read or listed;
// uploads and legacy documents stay visible; the admin always sees everything.
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, type Firestore } from 'firebase/firestore';
import { ADMIN, MEMBER, OUTSIDER, OWNER, as, createEnv, seed } from './setup';

let env: RulesTestEnvironment;
const drive = (folder: string) => ({ source: 'drive', folder, title: 'f.png', storagePath: 'brands/brand-a/x' });

beforeAll(async () => { env = await createEnv(); });
afterAll(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await updateDoc(doc(db, 'brands/brand-a'), { fileAccess: { mode: 'selected', folders: ['Diseño'] } });
    await setDoc(doc(db, 'brands/brand-a/assets/open'), drive('Diseño'));
    await setDoc(doc(db, 'brands/brand-a/assets/deep'), drive('Diseño/Logos/2025'));
    await setDoc(doc(db, 'brands/brand-a/assets/hidden'), drive('Página web'));
    await setDoc(doc(db, 'brands/brand-a/assets/root'), drive(''));
    await setDoc(doc(db, 'brands/brand-a/assets/upl'), { source: 'upload', folder: 'Uploads', title: 'u.pdf' });
    await setDoc(doc(db, 'brands/brand-a/assets/leg'), { source: 'legacy', type: 'logodeck', title: 'deck' });
  });
});

describe('Folder access for the client', () => {
  it('the client reads files in allowed folders and their subfolders, not in hidden ones', async () => {
    for (const who of [MEMBER, OWNER]) {
      await assertSucceeds(getDoc(doc(as(env, who), 'brands/brand-a/assets/open')));
      await assertSucceeds(getDoc(doc(as(env, who), 'brands/brand-a/assets/deep')));
      await assertFails(getDoc(doc(as(env, who), 'brands/brand-a/assets/hidden')));
      await assertFails(getDoc(doc(as(env, who), 'brands/brand-a/assets/root')));
    }
  });

  it('listing a folder works only for allowed folders', async () => {
    const col = collection(as(env, MEMBER), 'brands/brand-a/assets');
    await assertSucceeds(getDocs(query(col, where('folder', '==', 'Diseño'))));
    await assertSucceeds(getDocs(query(col, where('folder', '==', 'Diseño/Logos/2025'))));
    await assertFails(getDocs(query(col, where('folder', '==', 'Página web'))));
    await assertFails(getDocs(col));
  });

  it('uploads and legacy documents stay visible', async () => {
    await assertSucceeds(getDoc(doc(as(env, MEMBER), 'brands/brand-a/assets/upl')));
    await assertSucceeds(getDoc(doc(as(env, MEMBER), 'brands/brand-a/assets/leg')));
    await assertSucceeds(getDocs(query(collection(as(env, MEMBER), 'brands/brand-a/assets'), where('folder', '==', 'Uploads'))));
    await assertSucceeds(getDocs(query(collection(as(env, MEMBER), 'brands/brand-a/assets'), where('source', '==', 'legacy'))));
  });

  it('the admin sees everything and only the admin changes the access', async () => {
    await assertSucceeds(getDoc(doc(as(env, ADMIN), 'brands/brand-a/assets/hidden')));
    await assertSucceeds(updateDoc(doc(as(env, ADMIN), 'brands/brand-a'), { fileAccess: { mode: 'all', folders: [] } }));
    await assertFails(updateDoc(doc(as(env, OWNER), 'brands/brand-a'), { fileAccess: { mode: 'all', folders: [] } }));
  });

  it('with mode all (the default) every folder is visible; outsiders never read', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore() as unknown as Firestore, 'brands/brand-a'), { fileAccess: { mode: 'all', folders: [] } });
    });
    await assertSucceeds(getDoc(doc(as(env, MEMBER), 'brands/brand-a/assets/hidden')));
    await assertFails(getDoc(doc(as(env, OUTSIDER), 'brands/brand-a/assets/open')));
  });
});
