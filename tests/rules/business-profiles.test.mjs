import { test, before, beforeEach, after } from 'node:test';
import {
  createEnv, authedDb, seedUser, freshUserDoc, assertSucceeds, assertFails,
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from './setup.mjs';

let env;

const validProfile = (overrides = {}) => ({
  ownerName: 'Ana Pérez',
  businessName: 'Electricidad Ana',
  sector: 'Electricidad',
  whatsapp: '5491122334455',
  email: 'ana@test.local',
  address: 'Calle 123',
  cuit: '20-12345678-9',
  generalConditions: 'Validez sujeta a disponibilidad.',
  validityDays: 30,
  logoUrl: null,
  updatedAt: serverTimestamp(),
  ...overrides,
});

before(async () => { env = await createEnv('businessprofiles'); });
beforeEach(async () => {
  await env.clearFirestore();
  await seedUser(env, 'alice', freshUserDoc('alice'));
  await seedUser(env, 'bob', freshUserDoc('bob'));
});
after(async () => { await env.cleanup(); });

test('el dueño verificado puede crear, leer y actualizar su perfil', async () => {
  const db = authedDb(env, 'alice');
  const ref = doc(db, 'businessProfiles', 'alice');

  await assertSucceeds(setDoc(ref, validProfile()));
  await assertSucceeds(getDoc(ref));
  await assertSucceeds(updateDoc(ref, {
    businessName: 'Electricidad Ana SRL',
    updatedAt: serverTimestamp(),
  }));
});

test('merge parcial del logo sigue funcionando', async () => {
  const db = authedDb(env, 'alice');
  const ref = doc(db, 'businessProfiles', 'alice');
  await setDoc(ref, validProfile());

  await assertSucceeds(setDoc(ref, {
    logoUrl: 'https://example.test/logo.jpg',
    updatedAt: serverTimestamp(),
  }, { merge: true }));
});

test('impide leer o escribir el perfil de otro usuario', async () => {
  const aliceDb = authedDb(env, 'alice');
  const bobDb = authedDb(env, 'bob');
  await setDoc(doc(aliceDb, 'businessProfiles', 'alice'), validProfile());

  await assertFails(getDoc(doc(bobDb, 'businessProfiles', 'alice')));
  await assertFails(setDoc(doc(bobDb, 'businessProfiles', 'alice'), validProfile()));
});

test('rechaza usuarios sin email verificado', async () => {
  const db = authedDb(env, 'alice', { email_verified: false });
  await assertFails(setDoc(doc(db, 'businessProfiles', 'alice'), validProfile()));
});

test('rechaza campos inesperados, tipos inválidos y textos excesivos', async () => {
  const db = authedDb(env, 'alice');
  const ref = doc(db, 'businessProfiles', 'alice');

  await assertFails(setDoc(ref, validProfile({ role: 'admin' })));
  await assertFails(setDoc(ref, validProfile({ validityDays: '30' })));
  await assertFails(setDoc(ref, validProfile({ generalConditions: 'x'.repeat(5001) })));
});
