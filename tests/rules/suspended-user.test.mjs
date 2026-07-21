/**
 * Tests 13, 14, 15 — un usuario enabled:false no puede crear, duplicar ni
 * modificar presupuestos (pero sí puede seguir leyendo/exportando sus datos —
 * eso NO se prueba acá como fallo porque no debe fallar; ver "control" abajo).
 */
import { test, before, beforeEach, after } from 'node:test';
import {
  createEnv, authedDb, seedUser, seedQuote, freshUserDoc, createValidQuote,
  assertSucceeds, assertFails, doc, getDoc, updateDoc,
} from './setup.mjs';

let env;

before(async () => { env = await createEnv('suspended'); });
beforeEach(async () => { await env.clearFirestore(); });
after(async () => { await env.cleanup(); });

test('13. un usuario suspendido (enabled:false) no puede crear un presupuesto', async () => {
  await seedUser(env, 'alice', freshUserDoc('alice', { enabled: false }));
  const db = authedDb(env, 'alice');
  await assertFails(createValidQuote(db, 'alice'));
});

test('14. un usuario suspendido no puede duplicar un presupuesto (misma operación de creación)', async () => {
  await seedUser(env, 'alice', freshUserDoc('alice', { enabled: false }));
  const db = authedDb(env, 'alice');
  // A nivel de reglas, duplicar es indistinguible de crear (mismo quotes.create).
  await assertFails(createValidQuote(db, 'alice'));
});

test('15. un usuario suspendido no puede modificar un presupuesto existente', async () => {
  // El presupuesto se crea mientras la cuenta estaba activa (se siembra
  // directo, sin pasar por reglas), y luego se suspende la cuenta.
  await seedUser(env, 'alice', freshUserDoc('alice', { enabled: false }));
  await seedQuote(env, 'alice_1', {
    userId: 'alice', quoteNumber: 1, status: 'draft',
    createdAt: new Date(), client: { name: 'X', phone: '1', email: null },
    items: [], subtotal: 0, discount: 0, discountType: 'fixed', discountAmount: 0, advance: 0, total: 0, notes: null,
  });
  const db = authedDb(env, 'alice');
  await assertFails(updateDoc(doc(db, 'quotes', 'alice_1'), { notes: 'Intento de edición' }));
});

test('control: un usuario suspendido sí puede seguir leyendo sus datos', async () => {
  await seedUser(env, 'alice', freshUserDoc('alice', { enabled: false }));
  await seedQuote(env, 'alice_1', {
    userId: 'alice', quoteNumber: 1, status: 'draft',
    createdAt: new Date(), client: { name: 'X', phone: '1', email: null },
    items: [], subtotal: 0, discount: 0, discountType: 'fixed', discountAmount: 0, advance: 0, total: 0, notes: null,
  });
  const db = authedDb(env, 'alice');
  await assertSucceeds(getDoc(doc(db, 'users', 'alice')));
  await assertSucceeds(getDoc(doc(db, 'quotes', 'alice_1')));
});
