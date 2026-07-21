/**
 * Vínculo entre quotes y clients: clientId debe ser null (cliente ocasional)
 * o referenciar un cliente propio existente — tanto al crear como al editar
 * un presupuesto. Un cliente archivado no debe bloquear la edición de los
 * presupuestos que ya lo referencian.
 */
import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEnv, authedDb, seedUser, seedClient, seedQuote, freshUserDoc, freshClientDoc,
  createValidQuote, getAsAdmin,
  assertSucceeds, assertFails, doc, getDoc, updateDoc, serverTimestamp,
} from './setup.mjs';

let env;

before(async () => { env = await createEnv('quotesclientlink'); });
beforeEach(async () => {
  await env.clearFirestore();
  await seedUser(env, 'alice', freshUserDoc('alice'));
});
after(async () => { await env.cleanup(); });

test('crear un presupuesto vinculado a un cliente propio funciona', async () => {
  await seedClient(env, 'c1', freshClientDoc('alice', { name: 'Juan Pérez' }));
  const db = authedDb(env, 'alice');
  const quoteId = await assertSucceeds(createValidQuote(db, 'alice', { clientId: 'c1' }));
  const snap = await getDoc(doc(db, 'quotes', quoteId));
  assert.equal(snap.data().clientId, 'c1');
});

test('crear un presupuesto con clientId de un cliente ajeno falla', async () => {
  await seedUser(env, 'bob', freshUserDoc('bob'));
  await seedClient(env, 'cBob', freshClientDoc('bob'));
  const db = authedDb(env, 'alice');
  await assertFails(createValidQuote(db, 'alice', { clientId: 'cBob' }));
});

test('crear un presupuesto con clientId de un cliente inexistente falla', async () => {
  const db = authedDb(env, 'alice');
  await assertFails(createValidQuote(db, 'alice', { clientId: 'no-existe' }));
});

test('crear un presupuesto como "cliente ocasional" (clientId null) funciona', async () => {
  const db = authedDb(env, 'alice');
  const quoteId = await assertSucceeds(createValidQuote(db, 'alice', { clientId: null }));
  const snap = await getDoc(doc(db, 'quotes', quoteId));
  assert.equal(snap.data().clientId, null);
});

test('vincular un presupuesto ocasional a un cliente propio en una edición funciona', async () => {
  await seedClient(env, 'c1', freshClientDoc('alice'));
  await seedQuote(env, 'alice_1', {
    userId: 'alice', clientId: null, quoteNumber: 1, status: 'draft',
    createdAt: new Date(), client: { name: 'Cliente Ocasional', phone: '1', email: null, address: null },
    items: [], subtotal: 0, discount: 0, discountType: 'fixed', discountAmount: 0, advance: 0, total: 0, notes: null,
  });
  const db = authedDb(env, 'alice');
  await assertSucceeds(updateDoc(doc(db, 'quotes', 'alice_1'), { clientId: 'c1' }));
});

test('cambiar el clientId de un presupuesto a un cliente ajeno falla', async () => {
  await seedUser(env, 'bob', freshUserDoc('bob'));
  await seedClient(env, 'cBob', freshClientDoc('bob'));
  await seedQuote(env, 'alice_1', {
    userId: 'alice', clientId: null, quoteNumber: 1, status: 'draft',
    createdAt: new Date(), client: { name: 'X', phone: '1', email: null, address: null },
    items: [], subtotal: 0, discount: 0, discountType: 'fixed', discountAmount: 0, advance: 0, total: 0, notes: null,
  });
  const db = authedDb(env, 'alice');
  await assertFails(updateDoc(doc(db, 'quotes', 'alice_1'), { clientId: 'cBob' }));
});

test('editar un presupuesto histórico cuyo cliente fue archivado NO queda bloqueado', async () => {
  await seedClient(env, 'c1', freshClientDoc('alice', { archived: true, archivedAt: new Date() }));
  await seedQuote(env, 'alice_1', {
    userId: 'alice', clientId: 'c1', quoteNumber: 1, status: 'draft',
    createdAt: new Date(), client: { name: 'Cliente Archivado', phone: '1', email: null, address: null },
    items: [], subtotal: 0, discount: 0, discountType: 'fixed', discountAmount: 0, advance: 0, total: 0, notes: null,
  });
  const db = authedDb(env, 'alice');
  // No toca clientId — solo edita contenido. No debe re-validar el cliente.
  await assertSucceeds(updateDoc(doc(db, 'quotes', 'alice_1'), { notes: 'Editado tras archivar el cliente' }));
  // Re-vincular explícitamente al MISMO cliente archivado también debe andar
  // (archivado no es lo mismo que borrado — referencesOwnClient no exige archived==false).
  await assertSucceeds(updateDoc(doc(db, 'quotes', 'alice_1'), { clientId: 'c1' }));
});

test('editar un presupuesto histórico sin clientId (legacy) sigue funcionando', async () => {
  await seedQuote(env, 'legacy-random-id', {
    userId: 'alice', quoteNumber: 5, status: 'sent', // sin campo clientId — presupuesto anterior a esta fase
    createdAt: new Date(), client: { name: 'Cliente Viejo', phone: '1', email: null },
    items: [], subtotal: 0, discount: 0, discountType: 'fixed', discountAmount: 0, advance: 0, total: 0, notes: null,
  });
  const db = authedDb(env, 'alice');
  await assertSucceeds(updateDoc(doc(db, 'quotes', 'legacy-random-id'), { notes: 'Editado sin tocar clientId' }));
});
