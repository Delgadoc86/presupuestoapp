/**
 * Tests 8, 20, 21 — un admin legítimo puede activar/extender/desactivar Pro,
 * pero no puede tocar contadores de uso ni de perfil, ni borrarlos mediante
 * un set() sin merge (el bug real que tenía el diseño v2, ver §1.4 del diseño).
 */
import { test, before, beforeEach, after } from 'node:test';
import {
  createEnv, authedDb, seedUser, seedAdmin, freshUserDoc,
  assertSucceeds, assertFails, doc, setDoc, updateDoc, serverTimestamp, Timestamp,
} from './setup.mjs';

let env;

before(async () => { env = await createEnv('adminactions'); });
beforeEach(async () => {
  await env.clearFirestore();
  await seedAdmin(env, 'admin1');
  await seedUser(env, 'alice', freshUserDoc('alice', {
    lastQuoteNumber: 2,
    totalQuotes: 2,
    quotesThisMonth: 1,
    businessName: 'Electricidad Alice',
  }));
});
after(async () => { await env.cleanup(); });

test('8a. un admin legítimo puede activar Pro', async () => {
  const db = authedDb(env, 'admin1');
  const future = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  await assertSucceeds(updateDoc(doc(db, 'users', 'alice'), {
    planType: 'pro',
    pro: true,
    enabled: true,
    proExpiresAt: future,
    proActivatedAt: serverTimestamp(),
    proRemainingDays: null,
    planUpdatedAt: serverTimestamp(),
  }));
});

test('8b. un admin legítimo puede extender Pro', async () => {
  const db = authedDb(env, 'admin1');
  const future1 = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  await assertSucceeds(updateDoc(doc(db, 'users', 'alice'), {
    planType: 'pro', pro: true, enabled: true, proExpiresAt: future1, planUpdatedAt: serverTimestamp(),
  }));
  const future2 = Timestamp.fromDate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));
  await assertSucceeds(updateDoc(doc(db, 'users', 'alice'), {
    proExpiresAt: future2, planUpdatedAt: serverTimestamp(),
  }));
});

test('8c. un admin legítimo puede desactivar Pro (volver a Demo)', async () => {
  const db = authedDb(env, 'admin1');
  await assertSucceeds(updateDoc(doc(db, 'users', 'alice'), {
    planType: 'demo',
    pro: false,
    proExpiresAt: null,
    proRemainingDays: null,
    quoteLimit: 3,
    planUpdatedAt: serverTimestamp(),
  }));
});

test('20. un admin no puede tocar usageFields', async () => {
  const db = authedDb(env, 'admin1');
  await assertFails(updateDoc(doc(db, 'users', 'alice'), {
    quotesThisMonth: 0, // intenta "regalar" cupo mezclado con un campo de plan legítimo
    planUpdatedAt: serverTimestamp(),
  }));
});

test('21. un admin no puede eliminar contadores mediante un set() sin merge', async () => {
  const db = authedDb(env, 'admin1');
  // set() sin {merge:true} reemplaza el documento completo — dropea
  // lastQuoteNumber/totalQuotes/quotesThisMonth/quoteMonth/businessName/etc.
  await assertFails(setDoc(doc(db, 'users', 'alice'), {
    planType: 'pro',
    pro: true,
    enabled: true,
    quoteLimit: 3,
    proExpiresAt: null,
    proActivatedAt: serverTimestamp(),
    proRemainingDays: null,
    planUpdatedAt: serverTimestamp(),
    suspendedAt: null,
  }));
});
