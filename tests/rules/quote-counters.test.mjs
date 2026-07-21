/**
 * Tests 4, 5, 10, 11, 12, 23, 24, 25 — creación de presupuestos ligada al
 * incremento de contadores: límite mensual, rollover de mes, condiciones de
 * carrera, el hueco de "varios quotes con un solo incremento", y la
 * validación de quoteNumber/quoteId/createdAt.
 */
import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEnv, authedDb, seedUser, freshUserDoc, createValidQuote, getAsAdmin,
  currentYearMonthUTC, previousYearMonthUTC,
  assertSucceeds, assertFails, doc, getDoc, setDoc, writeBatch, serverTimestamp,
} from './setup.mjs';

let env;

before(async () => { env = await createEnv('counters'); });
beforeEach(async () => { await env.clearFirestore(); });
after(async () => { await env.cleanup(); });

test('4. no se puede crear un quote sin incrementar el contador (sin write acompañante)', async () => {
  await seedUser(env, 'alice', freshUserDoc('alice'));
  const db = authedDb(env, 'alice');
  // Escritura "suelta" a quotes, sin ningún write a users/{uid} en el mismo commit.
  await assertFails(setDoc(doc(db, 'quotes', 'alice_1'), {
    userId: 'alice',
    quoteNumber: 1,
    status: 'draft',
    createdAt: serverTimestamp(),
  }));
});

test('5. no se puede superar el límite mensual', async () => {
  await seedUser(env, 'alice', freshUserDoc('alice', {
    lastQuoteNumber: 3,
    totalQuotes: 3,
    quotesThisMonth: 3, // == quoteLimit, ya al tope
    quoteMonth: currentYearMonthUTC(),
  }));
  const db = authedDb(env, 'alice');
  await assertFails(createValidQuote(db, 'alice'));
});

test('10. cambio de mes: el primer presupuesto del mes reinicia bien el contador (tiempo real, sin mockear)', async () => {
  await seedUser(env, 'alice', freshUserDoc('alice', {
    lastQuoteNumber: 5,
    totalQuotes: 5,
    quotesThisMonth: 3, // al tope del MES ANTERIOR
    quoteMonth: previousYearMonthUTC(),
  }));
  const db = authedDb(env, 'alice');
  const quoteId = await assertSucceeds(createValidQuote(db, 'alice'));
  assert.equal(quoteId, 'alice_6');

  const userSnap = await getDoc(doc(db, 'users', 'alice'));
  const data = userSnap.data();
  assert.equal(data.quotesThisMonth, 1, 'el contador debe reiniciar a 1, no acumular sobre el mes anterior');
  assert.equal(data.quoteMonth, currentYearMonthUTC());
});

test('11. carrera: dos creaciones simultáneas cerca del límite — una éxito, una falla', async () => {
  await seedUser(env, 'alice', freshUserDoc('alice', {
    lastQuoteNumber: 1,
    totalQuotes: 1,
    quotesThisMonth: 2, // límite 3 → queda exactamente un cupo
    quoteMonth: currentYearMonthUTC(),
  }));
  const db = authedDb(env, 'alice');

  const results = await Promise.allSettled([
    createValidQuote(db, 'alice'),
    createValidQuote(db, 'alice'),
  ]);

  const fulfilled = results.filter(r => r.status === 'fulfilled');
  const rejected = results.filter(r => r.status === 'rejected');
  assert.equal(fulfilled.length, 1, 'exactamente una de las dos debe tener éxito');
  assert.equal(rejected.length, 1, 'exactamente una de las dos debe fallar');

  const userSnap = await getDoc(doc(db, 'users', 'alice'));
  assert.equal(userSnap.data().quotesThisMonth, 3, 'el contador final debe reflejar un solo incremento, no dos');
});

test('12. dos quotes con un solo incremento de contador en el mismo batch → falla todo el commit', async () => {
  await seedUser(env, 'alice', freshUserDoc('alice', {
    lastQuoteNumber: 5,
    totalQuotes: 5,
    quotesThisMonth: 0,
    quoteMonth: currentYearMonthUTC(),
  }));
  const db = authedDb(env, 'alice');

  const b = writeBatch(db);
  b.update(doc(db, 'users', 'alice'), {
    lastQuoteNumber: 6, // un solo incremento
    totalQuotes: 6,
    quotesThisMonth: 1,
    quoteMonth: currentYearMonthUTC(),
  });
  b.set(doc(db, 'quotes', 'alice_6'), {
    userId: 'alice', quoteNumber: 6, status: 'draft', createdAt: serverTimestamp(),
  });
  b.set(doc(db, 'quotes', 'alice_7'), {
    userId: 'alice', quoteNumber: 7, status: 'draft', createdAt: serverTimestamp(),
  }); // segundo quote, sin un segundo incremento real

  await assertFails(b.commit());

  // Ninguno de los dos debe haberse creado — el commit es todo-o-nada.
  // Se verifica salteando las reglas: un getDoc() normal sobre un documento
  // inexistente también es denegado (la regla de lectura no puede evaluar
  // resource.data.userId si resource es null), así que no sirve para
  // distinguir "no existe" de "no tengo permiso".
  const [q6, q7] = await Promise.all([
    getAsAdmin(env, 'quotes/alice_6'),
    getAsAdmin(env, 'quotes/alice_7'),
  ]);
  assert.equal(q6, null);
  assert.equal(q7, null);
});

test('23. quoteNumber debe ser un entero positivo (defensa contra lastQuoteNumber corrupto)', async () => {
  await seedUser(env, 'alice', freshUserDoc('alice', {
    lastQuoteNumber: -5, // dato corrupto/legacy simulado
    totalQuotes: 0,
    quotesThisMonth: 0,
    quoteMonth: currentYearMonthUTC(),
  }));
  const db = authedDb(env, 'alice');

  const b = writeBatch(db);
  b.update(doc(db, 'users', 'alice'), {
    lastQuoteNumber: -4, // +1 válido según la secuencia, pero sigue siendo negativo
    totalQuotes: 1,
    quotesThisMonth: 1,
    quoteMonth: currentYearMonthUTC(),
  });
  b.set(doc(db, 'quotes', 'alice_-4'), {
    userId: 'alice', quoteNumber: -4, status: 'draft', createdAt: serverTimestamp(),
  });

  await assertFails(b.commit());
});

test('24. quoteId debe coincidir exactamente con ${uid}_${quoteNumber}', async () => {
  await seedUser(env, 'alice', freshUserDoc('alice', {
    lastQuoteNumber: 5, totalQuotes: 5, quotesThisMonth: 0, quoteMonth: currentYearMonthUTC(),
  }));
  const db = authedDb(env, 'alice');

  const b = writeBatch(db);
  b.update(doc(db, 'users', 'alice'), {
    lastQuoteNumber: 6, totalQuotes: 6, quotesThisMonth: 1, quoteMonth: currentYearMonthUTC(),
  });
  b.set(doc(db, 'quotes', 'alice_no-coincide'), { // debería ser "alice_6"
    userId: 'alice', quoteNumber: 6, status: 'draft', createdAt: serverTimestamp(),
  });

  await assertFails(b.commit());
});

test('25. createdAt debe ser serverTimestamp() — un valor fijo del cliente falla', async () => {
  await seedUser(env, 'alice', freshUserDoc('alice', {
    lastQuoteNumber: 5, totalQuotes: 5, quotesThisMonth: 0, quoteMonth: currentYearMonthUTC(),
  }));
  const db = authedDb(env, 'alice');

  const b = writeBatch(db);
  b.update(doc(db, 'users', 'alice'), {
    lastQuoteNumber: 6, totalQuotes: 6, quotesThisMonth: 1, quoteMonth: currentYearMonthUTC(),
  });
  b.set(doc(db, 'quotes', 'alice_6'), {
    userId: 'alice',
    quoteNumber: 6,
    status: 'draft',
    createdAt: new Date('2020-01-01T00:00:00Z'), // fecha fija, no serverTimestamp()
  });

  await assertFails(b.commit());
});

test('control: la creación legítima de un presupuesto sí funciona', async () => {
  await seedUser(env, 'alice', freshUserDoc('alice'));
  const db = authedDb(env, 'alice');
  const quoteId = await assertSucceeds(createValidQuote(db, 'alice'));
  assert.equal(quoteId, 'alice_1');
});
