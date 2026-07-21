/**
 * Tests 16, 17, 18, 19, 28 — inmutabilidad de userId/quoteNumber/createdAt en
 * quotes.update, enum cerrado de status, y compatibilidad con presupuestos
 * históricos de ID aleatorio (pre-existentes a este cambio de reglas).
 */
import { test, before, beforeEach, after } from 'node:test';
import {
  createEnv, authedDb, seedUser, seedQuote, freshUserDoc,
  assertSucceeds, assertFails, doc, getDoc, updateDoc, Timestamp,
} from './setup.mjs';

let env;
const FIXED_CREATED_AT = Timestamp.fromDate(new Date('2026-01-15T12:00:00Z'));

before(async () => { env = await createEnv('immutability'); });
beforeEach(async () => {
  await env.clearFirestore();
  await seedUser(env, 'alice', freshUserDoc('alice'));
  await seedQuote(env, 'alice_1', {
    userId: 'alice',
    quoteNumber: 1,
    status: 'draft',
    createdAt: FIXED_CREATED_AT,
    client: { name: 'Cliente Test', phone: '123', email: null },
    items: [],
    subtotal: 0, discount: 0, discountType: 'fixed', discountAmount: 0, advance: 0, total: 0, notes: null,
  });
});
after(async () => { await env.cleanup(); });

test('16. no se puede cambiar userId en un update', async () => {
  const db = authedDb(env, 'alice');
  await assertFails(updateDoc(doc(db, 'quotes', 'alice_1'), { userId: 'mallory' }));
});

test('17. no se puede cambiar quoteNumber en un update', async () => {
  const db = authedDb(env, 'alice');
  await assertFails(updateDoc(doc(db, 'quotes', 'alice_1'), { quoteNumber: 999 }));
});

test('18. no se puede cambiar createdAt en un update', async () => {
  const db = authedDb(env, 'alice');
  await assertFails(updateDoc(doc(db, 'quotes', 'alice_1'), {
    createdAt: Timestamp.fromDate(new Date('2030-01-01T00:00:00Z')),
  }));
});

test('19. status fuera del enum permitido falla; una transición válida sí funciona', async () => {
  const db = authedDb(env, 'alice');
  await assertFails(updateDoc(doc(db, 'quotes', 'alice_1'), { status: 'cancelled' }));
  await assertSucceeds(updateDoc(doc(db, 'quotes', 'alice_1'), { status: 'sent' }));
});

test('28. un presupuesto histórico con ID aleatorio conserva lectura y edición', async () => {
  await seedQuote(env, 'aBc123LegacyRandomId', {
    userId: 'alice',
    quoteNumber: 42,
    status: 'sent',
    createdAt: FIXED_CREATED_AT,
    client: { name: 'Cliente Viejo', phone: '456', email: null },
    items: [],
    subtotal: 0, discount: 0, discountType: 'fixed', discountAmount: 0, advance: 0, total: 0, notes: null,
  });
  const db = authedDb(env, 'alice');

  await assertSucceeds(getDoc(doc(db, 'quotes', 'aBc123LegacyRandomId')));
  await assertSucceeds(updateDoc(doc(db, 'quotes', 'aBc123LegacyRandomId'), { notes: 'Editado tras el cambio de reglas' }));
});
