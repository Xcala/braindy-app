// Cuentas de cobro y recibos: the brand's billing people read their issued cuentas, nobody else's; members without
// billing, other brands and strangers do not; agreements and the issuer (bank, document, signature) are admin only;
// nobody writes from the browser, not even the admin (the backend issues, and an issued cuenta never changes).
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc, type Firestore } from 'firebase/firestore';
import { ADMIN, MEMBER, OUTSIDER, OWNER, as, createEnv, seed } from './setup';

let env: RulesTestEnvironment;
const D = 'brands/brand-a/billingDocs/BM-06-01';
const LATER = 'brands/brand-a/billingDocs/BM-06-04';
const HELD = 'brands/brand-a/billingDocs/BM-06-02';
const A = 'brands/brand-a/billingAgreements/ag1';
const cuenta = { type: 'cuenta_cobro', number: 'BM-06-01', amount: 1083333, status: 'issued', held: false };

beforeAll(async () => { env = await createEnv(); });
afterAll(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await setDoc(doc(db, D), cuenta);
    await setDoc(doc(db, LATER), { ...cuenta, number: 'BM-06-04', status: 'scheduled', held: true });
    await setDoc(doc(db, HELD), { ...cuenta, number: 'BM-06-02', held: true });
    await setDoc(doc(db, A), { title: 'Blacky', totalAmount: 6500000, status: 'active' });
    await setDoc(doc(db, 'issuers/nicolas'), { name: 'N', bank: { accountNumber: '008700403465' } });
    await setDoc(doc(db, 'issuers/nicolas/numbers/BM-06-01'), { docPath: D });
    await setDoc(doc(db, 'brands/brand-a/billing/profile'), { legalName: 'Blacky Meals SAS', taxId: '902038455-4' });
  });
});

describe('Cuentas de cobro', () => {
  it('billing people of the brand read issued cuentas and the profile; others do not', async () => {
    await assertSucceeds(getDoc(doc(as(env, OWNER), D)));
    await assertSucceeds(getDoc(doc(as(env, ADMIN), D)));
    await assertSucceeds(getDoc(doc(as(env, OWNER), 'brands/brand-a/billing/profile')));
    await assertFails(getDoc(doc(as(env, MEMBER), D)));
    await assertFails(getDoc(doc(as(env, OUTSIDER), D)));
    await assertFails(getDoc(doc(as(env, OUTSIDER), 'brands/brand-a/billing/profile')));
  });

  it('scheduled and held cuentas stay with the admin until they go out', async () => {
    await assertFails(getDoc(doc(as(env, OWNER), LATER)));
    await assertFails(getDoc(doc(as(env, OWNER), HELD)));
    await assertSucceeds(getDoc(doc(as(env, ADMIN), LATER)));
    await assertSucceeds(getDoc(doc(as(env, ADMIN), HELD)));
  });

  it('agreements, the issuer and the used numbers are admin only', async () => {
    for (const p of [A, 'issuers/nicolas', 'issuers/nicolas/numbers/BM-06-01']) {
      await assertSucceeds(getDoc(doc(as(env, ADMIN), p)));
      await assertFails(getDoc(doc(as(env, OWNER), p)));
      await assertFails(getDoc(doc(as(env, OUTSIDER), p)));
    }
  });

  it('nobody writes from the browser, not even the admin: an issued cuenta never changes', async () => {
    for (const who of [ADMIN, OWNER, MEMBER]) {
      await assertFails(updateDoc(doc(as(env, who), D), { amount: 1 }));
      await assertFails(updateDoc(doc(as(env, who), D), { status: 'paid' }));
      await assertFails(deleteDoc(doc(as(env, who), D)));
      await assertFails(setDoc(doc(as(env, who), 'brands/brand-a/billingDocs/X'), cuenta));
      await assertFails(setDoc(doc(as(env, who), A), { title: 'x' }));
      await assertFails(setDoc(doc(as(env, who), 'issuers/nicolas'), { name: 'x' }));
      await assertFails(setDoc(doc(as(env, who), 'issuers/nicolas/numbers/BM-06-09'), { docPath: 'x' }));
    }
  });
});
