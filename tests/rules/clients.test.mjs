/**
 * Reglas de clients/{clientId}: alta válida, allowlist exacta de campos,
 * validación de tipos, inmutabilidad de userId/createdAt, aislamiento entre
 * usuarios, y archivado/restauración (sin borrado físico).
 */
import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEnv, authedDb, seedUser, seedClient, freshUserDoc, freshClientDoc,
  assertSucceeds, assertFails, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp,
} from './setup.mjs';

let env;

before(async () => { env = await createEnv('clients'); });
beforeEach(async () => {
  await env.clearFirestore();
  await seedUser(env, 'alice', freshUserDoc('alice'));
});
after(async () => { await env.cleanup(); });

test('crear un cliente válido funciona (solo nombre, resto null)', async () => {
  const db = authedDb(env, 'alice');
  const ref = doc(db, 'clients', 'c1');
  await assertSucceeds(setDoc(ref, freshClientDoc('alice', { name: 'Juan Pérez' })));
  const snap = await getDoc(ref);
  assert.equal(snap.data().name, 'Juan Pérez');
  assert.equal(snap.data().archived, false);
});

test('rechaza campos desconocidos en el alta', async () => {
  const db = authedDb(env, 'alice');
  await assertFails(setDoc(doc(db, 'clients', 'c1'), {
    ...freshClientDoc('alice'),
    dni: '12345678',
  }));
});

test('rechaza tipos incorrectos (phone como número)', async () => {
  const db = authedDb(env, 'alice');
  await assertFails(setDoc(doc(db, 'clients', 'c1'), {
    ...freshClientDoc('alice'),
    phone: 1122334455,
  }));
});

test('rechaza tipos incorrectos (archived como string)', async () => {
  const db = authedDb(env, 'alice');
  await assertFails(setDoc(doc(db, 'clients', 'c1'), {
    ...freshClientDoc('alice'),
    archived: 'false',
  }));
});

test('rechaza nombre vacío', async () => {
  const db = authedDb(env, 'alice');
  await assertFails(setDoc(doc(db, 'clients', 'c1'), freshClientDoc('alice', { name: '' })));
});

test('rechaza createdAt distinto de request.time en el alta', async () => {
  const db = authedDb(env, 'alice');
  await assertFails(setDoc(doc(db, 'clients', 'c1'), {
    ...freshClientDoc('alice'),
    createdAt: new Date('2020-01-01T00:00:00Z'),
  }));
});

test('impide cambiar userId en un update', async () => {
  await seedClient(env, 'c1', freshClientDoc('alice'));
  const db = authedDb(env, 'alice');
  await assertFails(updateDoc(doc(db, 'clients', 'c1'), { userId: 'mallory' }));
});

test('impide cambiar createdAt en un update', async () => {
  await seedClient(env, 'c1', freshClientDoc('alice'));
  const db = authedDb(env, 'alice');
  await assertFails(updateDoc(doc(db, 'clients', 'c1'), {
    createdAt: new Date('2030-01-01T00:00:00Z'),
    updatedAt: serverTimestamp(),
  }));
});

test('exige updatedAt == request.time en un update', async () => {
  await seedClient(env, 'c1', freshClientDoc('alice'));
  const db = authedDb(env, 'alice');
  await assertFails(updateDoc(doc(db, 'clients', 'c1'), {
    notes: 'nota nueva',
    updatedAt: new Date('2020-01-01T00:00:00Z'),
  }));
});

test('impide acceder a clientes ajenos (leer, editar, archivar)', async () => {
  await seedUser(env, 'bob', freshUserDoc('bob'));
  await seedClient(env, 'c1', freshClientDoc('bob'));
  const db = authedDb(env, 'alice');
  await assertFails(getDoc(doc(db, 'clients', 'c1')));
  await assertFails(updateDoc(doc(db, 'clients', 'c1'), { name: 'Hackeado', updatedAt: serverTimestamp() }));
});

test('archivar un cliente funciona (update parcial)', async () => {
  await seedClient(env, 'c1', freshClientDoc('alice'));
  const db = authedDb(env, 'alice');
  await assertSucceeds(updateDoc(doc(db, 'clients', 'c1'), {
    archived: true,
    archivedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
  const snap = await getDoc(doc(db, 'clients', 'c1'));
  assert.equal(snap.data().archived, true);
});

test('restaurar un cliente archivado funciona', async () => {
  await seedClient(env, 'c1', freshClientDoc('alice', { archived: true, archivedAt: new Date() }));
  const db = authedDb(env, 'alice');
  await assertSucceeds(updateDoc(doc(db, 'clients', 'c1'), {
    archived: false,
    archivedAt: null,
    updatedAt: serverTimestamp(),
  }));
  const snap = await getDoc(doc(db, 'clients', 'c1'));
  assert.equal(snap.data().archived, false);
  assert.equal(snap.data().archivedAt, null);
});

test('no hay borrado físico — delete siempre falla, incluso para el dueño', async () => {
  await seedClient(env, 'c1', freshClientDoc('alice'));
  const db = authedDb(env, 'alice');
  await assertFails(deleteDoc(doc(db, 'clients', 'c1')));
});
