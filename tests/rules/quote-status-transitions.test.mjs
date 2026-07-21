/**
 * Reglas del estado-máquina de seguimiento de presupuestos: transiciones
 * válidas/inválidas (recorre STATUS_TRANSITIONS real, no una copia), fechas
 * de seguimiento (primera vez las fija, después son inmutables, no se
 * pueden tocar fechas de otros estados), presupuestos ajenos, legacy sin
 * fechas, 'paid' terminal, y condiciones de carrera.
 */
import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEnv, authedDb, seedUser, seedQuote, freshUserDoc, getAsAdmin,
  assertSucceeds, assertFails, doc, updateDoc, serverTimestamp, Timestamp,
} from './setup.mjs';
import { STATUS_TRANSITIONS, getTrackingDateField } from '../../src/utils/quoteStatus.js';

let env;

before(async () => { env = await createEnv('statustransitions'); });
beforeEach(async () => {
  await env.clearFirestore();
  await seedUser(env, 'alice', freshUserDoc('alice'));
});
after(async () => { await env.cleanup(); });

function baseQuoteFields(overrides = {}) {
  return {
    userId: 'alice',
    quoteNumber: 1,
    createdAt: new Date(),
    client: { name: 'Cliente Test', phone: '1122334455', email: null, address: null },
    items: [],
    subtotal: 0, discount: 0, discountType: 'fixed', discountAmount: 0,
    advance: 0, total: 0, notes: null,
    ...overrides,
  };
}

// Mismo criterio que quotes.service.js#updateQuoteStatus: solo incluye la
// fecha del estado destino si el documento todavía no la tiene.
function statusChangePayload(toStatus, currentDoc) {
  const dateField = getTrackingDateField(toStatus);
  const payload = { status: toStatus, statusUpdatedAt: serverTimestamp(), updatedAt: serverTimestamp() };
  if (dateField && !currentDoc[dateField]) payload[dateField] = serverTimestamp();
  return payload;
}

// ── 1. Todas las transiciones válidas de la tabla REAL (src/utils/quoteStatus.js) ──

for (const [from, targets] of Object.entries(STATUS_TRANSITIONS)) {
  for (const to of targets) {
    test(`transición válida: ${from} -> ${to}`, async () => {
      const quoteId = `alice_valid_${from}_${to}`;
      await seedQuote(env, quoteId, baseQuoteFields({ status: from }));
      const db = authedDb(env, 'alice');
      const current = await getAsAdmin(env, `quotes/${quoteId}`);
      await assertSucceeds(updateDoc(doc(db, 'quotes', quoteId), statusChangePayload(to, current)));

      const after = await getAsAdmin(env, `quotes/${quoteId}`);
      assert.equal(after.status, to);
      const dateField = getTrackingDateField(to);
      if (dateField) {
        assert.ok(after[dateField], `${dateField} debería quedar seteado la primera vez que entra en '${to}'`);
      }
    });
  }
}

// ── 2. Transiciones inválidas representativas (dentro del enum, fuera de la tabla) ──

const INVALID_PAIRS = [
  ['draft', 'accepted'], ['draft', 'rejected'], ['draft', 'expired'],
  ['accepted', 'draft'], ['rejected', 'draft'], ['expired', 'draft'],
  ['accepted', 'expired'], ['rejected', 'expired'],
  ['paid', 'draft'], ['paid', 'sent'], ['paid', 'accepted'], ['paid', 'rejected'], ['paid', 'expired'], ['paid', 'paid'],
];

for (const [from, to] of INVALID_PAIRS) {
  test(`transición inválida: ${from} -> ${to} falla`, async () => {
    const quoteId = `alice_invalid_${from}_${to}`;
    await seedQuote(env, quoteId, baseQuoteFields({ status: from }));
    const db = authedDb(env, 'alice');
    const current = await getAsAdmin(env, `quotes/${quoteId}`);
    await assertFails(updateDoc(doc(db, 'quotes', quoteId), statusChangePayload(to, current)));
  });
}

// ── 3. Presupuesto ajeno ──

test('un usuario no puede cambiar el estado de un presupuesto ajeno', async () => {
  await seedUser(env, 'bob', freshUserDoc('bob'));
  await seedQuote(env, 'bob_1', baseQuoteFields({ userId: 'bob', status: 'draft' }));
  const db = authedDb(env, 'alice');
  const current = await getAsAdmin(env, 'quotes/bob_1');
  await assertFails(updateDoc(doc(db, 'quotes', 'bob_1'), statusChangePayload('sent', current)));
});

// ── 4. No se puede tocar la fecha de un estado que no es el de destino ──

test('una transición no puede tocar la fecha de un estado distinto al de destino', async () => {
  const quoteId = 'alice_1';
  await seedQuote(env, quoteId, baseQuoteFields({ status: 'sent', sentAt: new Date('2026-01-01T00:00:00Z') }));
  const db = authedDb(env, 'alice');
  await assertFails(updateDoc(doc(db, 'quotes', quoteId), {
    status: 'accepted',
    statusUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    acceptedAt: serverTimestamp(),
    rejectedAt: serverTimestamp(), // ajena a esta transición — debe rechazarse
  }));
});

// ── 5. Presupuesto legacy sin ningún campo de seguimiento ──

test('presupuesto legacy sin campos de seguimiento transiciona igual que uno nuevo', async () => {
  const quoteId = 'alice_legacy';
  await seedQuote(env, quoteId, baseQuoteFields({ status: 'sent' })); // sin sentAt/statusUpdatedAt/etc.
  const db = authedDb(env, 'alice');
  await assertSucceeds(updateDoc(doc(db, 'quotes', quoteId), {
    status: 'accepted', statusUpdatedAt: serverTimestamp(), updatedAt: serverTimestamp(), acceptedAt: serverTimestamp(),
  }));
  const after = await getAsAdmin(env, `quotes/${quoteId}`);
  assert.equal(after.status, 'accepted');
  assert.ok(after.acceptedAt);
});

// ── 6. sentAt se conserva al pasar de sent a accepted ──

test('sentAt se conserva al pasar de sent a accepted', async () => {
  const quoteId = 'alice_1';
  const originalSentAt = Timestamp.fromDate(new Date('2026-02-01T10:00:00Z'));
  await seedQuote(env, quoteId, baseQuoteFields({ status: 'sent', sentAt: originalSentAt }));
  const db = authedDb(env, 'alice');
  await assertSucceeds(updateDoc(doc(db, 'quotes', quoteId), {
    status: 'accepted', statusUpdatedAt: serverTimestamp(), updatedAt: serverTimestamp(), acceptedAt: serverTimestamp(),
  }));
  const after = await getAsAdmin(env, `quotes/${quoteId}`);
  assert.equal(after.sentAt.toMillis(), originalSentAt.toMillis());
});

// ── 7. Dos cambios concurrentes de estado ──

test('dos cambios concurrentes de estado: exactamente uno tiene éxito', async () => {
  const quoteId = 'alice_1';
  await seedQuote(env, quoteId, baseQuoteFields({ status: 'sent' }));
  const db = authedDb(env, 'alice');

  // sent->accepted y sent->expired son ambas válidas DESDE 'sent', pero
  // Firestore evalúa cada write contra el estado real más reciente al
  // momento de aplicarse: el que se procesa primero cambia el status; el
  // segundo se evalúa contra ESE estado ya cambiado, y ni accepted->expired
  // ni expired->accepted están en la tabla — así que el segundo falla
  // siempre, sin importar el orden.
  const results = await Promise.allSettled([
    updateDoc(doc(db, 'quotes', quoteId), {
      status: 'accepted', statusUpdatedAt: serverTimestamp(), updatedAt: serverTimestamp(), acceptedAt: serverTimestamp(),
    }),
    updateDoc(doc(db, 'quotes', quoteId), {
      status: 'expired', statusUpdatedAt: serverTimestamp(), updatedAt: serverTimestamp(), expiredAt: serverTimestamp(),
    }),
  ]);

  const fulfilled = results.filter(r => r.status === 'fulfilled').length;
  const rejected = results.filter(r => r.status === 'rejected').length;
  assert.equal(fulfilled, 1, 'exactamente uno de los dos cambios debe tener éxito');
  assert.equal(rejected, 1, 'exactamente uno de los dos cambios debe fallar');

  const after = await getAsAdmin(env, `quotes/${quoteId}`);
  assert.ok(after.status === 'accepted' || after.status === 'expired');
});

// ── 8. currentStatus obsoleto en la UI ──

test('la regla valida contra el estado real del documento, no contra un currentStatus obsoleto', async () => {
  const quoteId = 'alice_1';
  // El documento está realmente en 'rejected' (ej. otro dispositivo ya lo
  // cambió) — simula una UI vieja que todavía cree que está en 'sent' e
  // intenta la transición sent->expired (inválida desde el estado real).
  await seedQuote(env, quoteId, baseQuoteFields({ status: 'rejected' }));
  const db = authedDb(env, 'alice');
  await assertFails(updateDoc(doc(db, 'quotes', quoteId), {
    status: 'expired', statusUpdatedAt: serverTimestamp(), updatedAt: serverTimestamp(), expiredAt: serverTimestamp(),
  }));
});

// ── 11. Edición normal sin cambio de status ──

test('una edición de contenido sin cambiar status funciona normalmente', async () => {
  const quoteId = 'alice_1';
  await seedQuote(env, quoteId, baseQuoteFields({ status: 'draft' }));
  const db = authedDb(env, 'alice');
  await assertSucceeds(updateDoc(doc(db, 'quotes', quoteId), { notes: 'nota nueva' }));
});

// ── 12. Modificación manual de fechas rechazada ──

test('no se puede setear acceptedAt a mano sin una transición de estado real', async () => {
  const quoteId = 'alice_1';
  await seedQuote(env, quoteId, baseQuoteFields({ status: 'sent' }));
  const db = authedDb(env, 'alice');
  await assertFails(updateDoc(doc(db, 'quotes', quoteId), { acceptedAt: serverTimestamp() }));
});

test('no se puede reescribir una fecha ya seteada aunque el status no cambie', async () => {
  const quoteId = 'alice_1';
  const original = Timestamp.fromDate(new Date('2026-01-01T00:00:00Z'));
  await seedQuote(env, quoteId, baseQuoteFields({ status: 'accepted', acceptedAt: original }));
  const db = authedDb(env, 'alice');
  await assertFails(updateDoc(doc(db, 'quotes', quoteId), { acceptedAt: serverTimestamp() }));
});

// ── 14. La segunda vez que entra en un estado, la fecha original se conserva ──

test('la segunda vez que un presupuesto entra en un estado, la fecha original se conserva', async () => {
  const quoteId = 'alice_1';
  await seedQuote(env, quoteId, baseQuoteFields({ status: 'sent' }));
  const db = authedDb(env, 'alice');

  await assertSucceeds(updateDoc(doc(db, 'quotes', quoteId), {
    status: 'accepted', statusUpdatedAt: serverTimestamp(), updatedAt: serverTimestamp(), acceptedAt: serverTimestamp(),
  }));
  const firstAcceptedAt = (await getAsAdmin(env, `quotes/${quoteId}`)).acceptedAt;

  await assertSucceeds(updateDoc(doc(db, 'quotes', quoteId), {
    status: 'rejected', statusUpdatedAt: serverTimestamp(), updatedAt: serverTimestamp(), rejectedAt: serverTimestamp(),
  }));

  // No se reenvía acceptedAt -- ya tiene valor, el servicio real tampoco lo haría.
  await assertSucceeds(updateDoc(doc(db, 'quotes', quoteId), {
    status: 'accepted', statusUpdatedAt: serverTimestamp(), updatedAt: serverTimestamp(),
  }));

  const secondAcceptedAt = (await getAsAdmin(env, `quotes/${quoteId}`)).acceptedAt;
  assert.equal(secondAcceptedAt.toMillis(), firstAcceptedAt.toMillis());
});

// ── statusUpdatedAt no se puede tocar en una edición de contenido ──

test('statusUpdatedAt no puede modificarse en una edición que no cambia status', async () => {
  const quoteId = 'alice_1';
  const original = Timestamp.fromDate(new Date('2026-01-01T00:00:00Z'));
  await seedQuote(env, quoteId, baseQuoteFields({ status: 'draft', statusUpdatedAt: original }));
  const db = authedDb(env, 'alice');
  await assertFails(updateDoc(doc(db, 'quotes', quoteId), { statusUpdatedAt: serverTimestamp() }));
});
