/**
 * Helpers compartidos para los tests de firestore.rules contra el Firestore
 * Emulator. Cada archivo de test crea su propio entorno (createEnv) con un
 * projectId distinto, para quedar aislado de los demás archivos aunque
 * `node --test` los corra en paralelo en procesos separados.
 *
 * RulesTestContext.firestore() devuelve una instancia compatible con la API
 * modular de firebase/firestore (la misma que usa el resto de la app) — ver
 * node_modules/@firebase/rules-unit-testing/.../public_types/index.d.ts.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  serverTimestamp,
  runTransaction,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';

export {
  assertSucceeds,
  assertFails,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  serverTimestamp,
  runTransaction,
  writeBatch,
  Timestamp,
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RULES_SOURCE = readFileSync(path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8');

/** @param {string} suiteName - sufijo único del projectId para este archivo de test. */
export async function createEnv(suiteName) {
  return initializeTestEnvironment({
    projectId: `presufacil-rules-test-${suiteName}`,
    firestore: { rules: RULES_SOURCE },
  });
}

export function authedDb(env, uid, tokenOptions = {}) {
  return env.authenticatedContext(uid, { email: `${uid}@test.local`, ...tokenOptions }).firestore();
}

export function unauthedDb(env) {
  return env.unauthenticatedContext().firestore();
}

/** Escribe saltándose las reglas — para armar el estado inicial de cada test. */
export async function seedUser(env, uid, data) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', uid), data);
  });
}

export async function seedAdmin(env, uid) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'admins', uid), {});
  });
}

export async function seedQuote(env, quoteId, data) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'quotes', quoteId), data);
  });
}

export async function getAsAdmin(env, path) {
  // withSecurityRulesDisabled() no propaga el valor de retorno del callback
  // (su tipo declarado es Promise<void>) — se captura en una variable externa.
  let result = null;
  await env.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDoc(doc(ctx.firestore(), path));
    result = snap.exists() ? snap.data() : null;
  });
  return result;
}

/** Mismo criterio que dateUtils.js:getCurrentYearMonth() — UTC. */
export function currentYearMonthUTC(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function previousYearMonthUTC(d = new Date()) {
  const prev = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1));
  return currentYearMonthUTC(prev);
}

/** Documento users/{uid} con la misma forma que produce registerWithEmail(). */
export function freshUserDoc(uid, overrides = {}) {
  return {
    email: `${uid}@test.local`,
    createdAt: serverTimestamp(),
    onboardingComplete: false,
    lastQuoteNumber: 0,
    planType: 'demo',
    pro: false,
    enabled: true,
    quoteLimit: 3,
    quotesThisMonth: 0,
    quoteMonth: currentYearMonthUTC(),
    totalQuotes: 0,
    ...overrides,
  };
}

/**
 * Reproduce exactamente la transacción de createQuote()/duplicateQuote()
 * (src/services/quotes.service.js) contra el db de un test context, para
 * poder probar el camino legítimo real contra las reglas desplegadas.
 * A nivel de reglas, "crear" y "duplicar" son la misma operación
 * (quotes.create) — este helper representa a ambas.
 */
export async function createValidQuote(db, uid) {
  const userRef = doc(db, 'users', uid);
  let newQuoteId;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    const data = snap.data();
    const now = new Date();
    const isPro = data.pro === true &&
      (!data.proExpiresAt || data.proExpiresAt.toDate() > now);
    const currentMonth = currentYearMonthUTC();
    const beforeCount = data.quoteMonth === currentMonth ? (data.quotesThisMonth ?? 0) : 0;
    const lastNumber = data.lastQuoteNumber ?? 0;
    const nextNumber = lastNumber + 1;
    newQuoteId = `${uid}_${nextNumber}`;
    const quoteRef = doc(db, 'quotes', newQuoteId);

    tx.update(userRef, {
      lastQuoteNumber: nextNumber,
      totalQuotes: (data.totalQuotes ?? 0) + 1,
      ...(isPro ? {} : {
        quotesThisMonth: beforeCount + 1,
        quoteMonth: currentMonth,
      }),
    });
    tx.set(quoteRef, {
      userId: uid,
      quoteNumber: nextNumber,
      status: 'draft',
      client: { name: 'Cliente Test', phone: '1122334455', email: null },
      items: [],
      subtotal: 0,
      discount: 0,
      discountType: 'fixed',
      discountAmount: 0,
      advance: 0,
      total: 0,
      notes: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  return newQuoteId;
}
