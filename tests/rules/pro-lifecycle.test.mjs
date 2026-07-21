/**
 * Tests 6, 7 — un usuario Pro activo crea presupuestos sin tocar los
 * contadores mensuales; un Pro vencido vuelve a las restricciones de Demo.
 */
import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEnv, authedDb, seedUser, freshUserDoc, createValidQuote, currentYearMonthUTC,
  assertSucceeds, assertFails, doc, getDoc, Timestamp,
} from './setup.mjs';

let env;

before(async () => { env = await createEnv('prolifecycle'); });
beforeEach(async () => { await env.clearFirestore(); });
after(async () => { await env.cleanup(); });

test('6. un usuario Pro activo puede crear presupuestos normalmente, sin tocar los contadores mensuales', async () => {
  const future = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  await seedUser(env, 'alice', freshUserDoc('alice', {
    pro: true,
    planType: 'pro',
    proExpiresAt: future,
    quotesThisMonth: 7, // valor arbitrario — no debería moverse
    quoteMonth: 'algo-viejo-irrelevante',
  }));
  const db = authedDb(env, 'alice');

  const quoteId = await assertSucceeds(createValidQuote(db, 'alice'));
  assert.equal(quoteId, 'alice_1');

  const userSnap = await getDoc(doc(db, 'users', 'alice'));
  const data = userSnap.data();
  assert.equal(data.lastQuoteNumber, 1);
  assert.equal(data.totalQuotes, 1);
  assert.equal(data.quotesThisMonth, 7, 'Pro activo no debe tocar quotesThisMonth');
  assert.equal(data.quoteMonth, 'algo-viejo-irrelevante', 'Pro activo no debe tocar quoteMonth');
});

test('7. un Pro vencido vuelve a las restricciones de Demo (no puede superar el límite)', async () => {
  const past = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
  await seedUser(env, 'alice', freshUserDoc('alice', {
    pro: true,
    planType: 'pro',
    proExpiresAt: past,
    quoteLimit: 3,
    quotesThisMonth: 3, // al tope del límite Demo
    quoteMonth: currentYearMonthUTC(),
  }));
  const db = authedDb(env, 'alice');
  await assertFails(createValidQuote(db, 'alice'));
});
