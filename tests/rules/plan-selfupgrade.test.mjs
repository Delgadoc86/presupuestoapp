/**
 * Tests 1, 2, 3, 9, 22, 26, 27 — auto-upgrade de plan, manipulación de
 * contadores, aislamiento entre usuarios, y allowlist/tipos en el alta.
 */
import { test, before, beforeEach, after } from 'node:test';
import {
  createEnv, authedDb, seedUser, freshUserDoc, currentYearMonthUTC,
  assertSucceeds, assertFails, doc, setDoc, updateDoc,
} from './setup.mjs';

let env;

before(async () => { env = await createEnv('selfupgrade'); });
beforeEach(async () => { await env.clearFirestore(); });
after(async () => { await env.cleanup(); });

test('1. un usuario Demo no puede asignarse Pro', async () => {
  await seedUser(env, 'alice', freshUserDoc('alice'));
  const db = authedDb(env, 'alice');
  await assertFails(updateDoc(doc(db, 'users', 'alice'), { planType: 'pro', pro: true }));
});

test('2. un usuario no puede modificar quoteLimit', async () => {
  await seedUser(env, 'alice', freshUserDoc('alice'));
  const db = authedDb(env, 'alice');
  await assertFails(updateDoc(doc(db, 'users', 'alice'), { quoteLimit: 999 }));
});

test('3. un usuario no puede resetear quotesThisMonth manualmente', async () => {
  await seedUser(env, 'alice', freshUserDoc('alice', {
    quotesThisMonth: 3,
    quoteMonth: currentYearMonthUTC(),
  }));
  const db = authedDb(env, 'alice');
  await assertFails(updateDoc(doc(db, 'users', 'alice'), { quotesThisMonth: 0 }));
});

test('9. un usuario no puede modificar el documento de otro usuario', async () => {
  await seedUser(env, 'bob', freshUserDoc('bob'));
  const db = authedDb(env, 'alice');
  await assertFails(updateDoc(doc(db, 'users', 'bob'), { businessName: 'Hackeado' }));
});

test('22. alta de usuario con un campo desconocido falla', async () => {
  const db = authedDb(env, 'mallory');
  await assertFails(setDoc(doc(db, 'users', 'mallory'), {
    ...freshUserDoc('mallory'),
    isSuperAdmin: true,
  }));
});

test('26a. alta de usuario con un tipo incorrecto falla (quoteLimit como string)', async () => {
  const db = authedDb(env, 'mallory');
  await assertFails(setDoc(doc(db, 'users', 'mallory'), {
    ...freshUserDoc('mallory'),
    quoteLimit: '3',
  }));
});

test('26b. alta de usuario con un tipo incorrecto falla (pro como string en vez de bool)', async () => {
  const db = authedDb(env, 'mallory');
  await assertFails(setDoc(doc(db, 'users', 'mallory'), {
    ...freshUserDoc('mallory'),
    pro: 'false',
  }));
});

test('26c. alta de usuario con un tipo incorrecto falla (onboardingComplete como número en vez de bool)', async () => {
  const db = authedDb(env, 'mallory');
  await assertFails(setDoc(doc(db, 'users', 'mallory'), {
    ...freshUserDoc('mallory'),
    onboardingComplete: 0,
  }));
});

test('27. alta de usuario con email que no coincide con el token de auth falla', async () => {
  const db = authedDb(env, 'mallory'); // token.email == 'mallory@test.local'
  await assertFails(setDoc(doc(db, 'users', 'mallory'), {
    ...freshUserDoc('mallory', { email: 'distinto@test.local' }),
  }));
});

test('control: el alta legítima de una cuenta nueva sí funciona', async () => {
  const db = authedDb(env, 'newuser');
  await assertSucceeds(setDoc(doc(db, 'users', 'newuser'), freshUserDoc('newuser')));
});
