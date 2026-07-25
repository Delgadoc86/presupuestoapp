import { test, before, beforeEach, after } from 'node:test';
import {
  createEnv, authedDb, seedUser, seedClient, seedQuote,
  freshUserDoc, freshClientDoc, assertSucceeds, assertFails,
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from './setup.mjs';

let env;

before(async () => { env = await createEnv('emailverification'); });
beforeEach(async () => {
  await env.clearFirestore();
  await seedUser(env, 'alice', freshUserDoc('alice'));
  await seedClient(env, 'client1', freshClientDoc('alice'));
  await seedQuote(env, 'alice_1', {
    userId: 'alice',
    quoteNumber: 1,
    status: 'draft',
    createdAt: new Date(),
  });
});
after(async () => { await env.cleanup(); });

test('registro y lectura del documento users funcionan antes de verificar', async () => {
  const unverified = authedDb(env, 'new-user', { email_verified: false });
  await assertSucceeds(setDoc(doc(unverified, 'users', 'new-user'), freshUserDoc('new-user')));
  await assertSucceeds(getDoc(doc(unverified, 'users', 'new-user')));
});

test('un token ya verificado no puede recrear users después de un borrado', async () => {
  const verified = authedDb(env, 'recreated-user');
  await assertFails(setDoc(
    doc(verified, 'users', 'recreated-user'),
    freshUserDoc('recreated-user')
  ));
});

test('sin verificar no se puede modificar perfil ni leer datos de negocio', async () => {
  const db = authedDb(env, 'alice', { email_verified: false });

  await assertFails(updateDoc(doc(db, 'users', 'alice'), {
    ownerName: 'Alice',
    businessName: 'Alice SRL',
    onboardingComplete: true,
  }));
  await assertFails(getDoc(doc(db, 'clients', 'client1')));
  await assertFails(getDoc(doc(db, 'quotes', 'alice_1')));
});

test('al verificar, el flujo normal vuelve a estar habilitado', async () => {
  const db = authedDb(env, 'alice');
  await assertSucceeds(getDoc(doc(db, 'clients', 'client1')));
  await assertSucceeds(getDoc(doc(db, 'quotes', 'alice_1')));
  await assertSucceeds(updateDoc(doc(db, 'users', 'alice'), {
    ownerName: 'Alice',
    businessName: 'Alice SRL',
    onboardingComplete: true,
  }));
});
