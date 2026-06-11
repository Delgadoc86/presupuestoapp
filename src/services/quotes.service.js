import {
  collection,
  doc,
  runTransaction,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

function _currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function _isEffectivelyPro(userData) {
  const isPro = userData.pro === true || userData.planType === 'pro';
  if (!isPro) return false;
  if (userData.proExpiresAt) {
    const expires = userData.proExpiresAt.toDate
      ? userData.proExpiresAt.toDate()
      : new Date(userData.proExpiresAt);
    if (expires < new Date()) return false;
  }
  return true;
}

function _checkUserLimits(userData) {
  if (userData.enabled === false) {
    const err = new Error('Cuenta suspendida');
    err.code = 'account_suspended';
    throw err;
  }
  if (!_isEffectivelyPro(userData)) {
    const currentMonth = _currentYearMonth();
    const quotesThisMonth =
      (userData.quoteMonth ?? '') === currentMonth ? (userData.quotesThisMonth ?? 0) : 0;
    const limit = userData.quoteLimit ?? 3;
    if (quotesThisMonth >= limit) {
      const err = new Error('Límite demo alcanzado');
      err.code = 'demo_limit_reached';
      throw err;
    }
    return quotesThisMonth;
  }
  return null;
}
import { db } from '../../firebase.config';

/**
 * Retorna la query de Firestore que filtra los presupuestos del usuario.
 * Se usa en useQuotes con onSnapshot para escuchar cambios en tiempo real.
 * El ordenamiento se hace en el cliente (.sort) para evitar requerir un
 * índice compuesto (userId + createdAt) en Firestore.
 *
 * @param {string} userId - UID del usuario autenticado.
 * @returns {import('firebase/firestore').Query}
 */
export function getQuotesQuery(userId) {
  return query(
    collection(db, 'quotes'),
    where('userId', '==', userId)
  );
}

/**
 * Crea un nuevo presupuesto con número correlativo único.
 *
 * Usa una transacción de Firestore para garantizar que el número correlativo
 * (quoteNumber) sea único incluso si dos dispositivos crean presupuestos
 * al mismo tiempo: la transacción lee lastQuoteNumber, lo incrementa y
 * escribe ambas operaciones de forma atómica.
 *
 * @param {string} userId - UID del usuario autenticado.
 * @param {Object} quoteData - Datos del presupuesto (client, items, totals, etc.).
 * @returns {Promise<string>} ID del documento creado en Firestore.
 */
export async function createQuote(userId, quoteData) {
  const userRef = doc(db, 'users', userId);
  const quoteRef = doc(collection(db, 'quotes'));

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const userData = userSnap.data() ?? {};
    const quotesThisMonth = _checkUserLimits(userData);

    const lastNumber = userData.lastQuoteNumber ?? 0;
    const nextNumber = lastNumber + 1;
    const currentMonth = _currentYearMonth();
    const effectivelyPro = _isEffectivelyPro(userData);

    transaction.update(userRef, {
      lastQuoteNumber: nextNumber,
      totalQuotes: (userData.totalQuotes ?? 0) + 1,
      ...(effectivelyPro ? {} : {
        quotesThisMonth: (quotesThisMonth ?? 0) + 1,
        quoteMonth: currentMonth,
      }),
    });
    transaction.set(quoteRef, {
      ...quoteData,
      userId,
      quoteNumber: nextNumber,
      status: 'draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  return quoteRef.id;
}

/**
 * Actualiza los datos de un presupuesto existente (edición completa).
 * No modifica el quoteNumber ni el status.
 *
 * @param {string} quoteId - ID del documento en la colección quotes.
 * @param {Object} data - Campos a actualizar.
 * @returns {Promise<void>}
 */
export async function updateQuote(quoteId, data) {
  await updateDoc(doc(db, 'quotes', quoteId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Actualiza únicamente el estado de un presupuesto.
 * Separado de updateQuote para evitar sobreescribir datos al cambiar solo el estado.
 *
 * @param {string} quoteId - ID del documento.
 * @param {string} status - Nuevo estado: 'draft' | 'sent' | 'accepted' | 'rejected' | 'paid'.
 * @returns {Promise<void>}
 */
export async function updateQuoteStatus(quoteId, status) {
  await updateDoc(doc(db, 'quotes', quoteId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Elimina un presupuesto permanentemente de Firestore.
 * Esta operación no tiene rollback. La confirmación debe pedirse en la UI.
 *
 * @param {string} quoteId - ID del documento a eliminar.
 * @returns {Promise<void>}
 */
export async function deleteQuote(quoteId) {
  await deleteDoc(doc(db, 'quotes', quoteId));
}

/**
 * Duplica un presupuesto existente como nuevo borrador con número correlativo nuevo.
 * Usa la misma lógica de transacción que createQuote para garantizar unicidad.
 * Los campos de metadata (quoteNumber, status, createdAt, updatedAt, id) se descartan
 * del original y se reemplazán con valores frescos.
 *
 * @param {string} userId - UID del usuario autenticado.
 * @param {Object} sourceQuote - Presupuesto original completo (con id).
 * @returns {Promise<string>} ID del nuevo documento creado.
 */
export async function duplicateQuote(userId, sourceQuote) {
  const { quoteNumber, status, createdAt, updatedAt, id, ...rest } = sourceQuote;

  const userRef = doc(db, 'users', userId);
  const quoteRef = doc(collection(db, 'quotes'));

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const userData = userSnap.data() ?? {};
    const quotesThisMonth = _checkUserLimits(userData);

    const lastNumber = userData.lastQuoteNumber ?? 0;
    const nextNumber = lastNumber + 1;
    const currentMonth = _currentYearMonth();
    const effectivelyPro = _isEffectivelyPro(userData);

    transaction.update(userRef, {
      lastQuoteNumber: nextNumber,
      totalQuotes: (userData.totalQuotes ?? 0) + 1,
      ...(effectivelyPro ? {} : {
        quotesThisMonth: (quotesThisMonth ?? 0) + 1,
        quoteMonth: currentMonth,
      }),
    });
    transaction.set(quoteRef, {
      ...rest,
      userId,
      quoteNumber: nextNumber,
      status: 'draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  return quoteRef.id;
}

/**
 * Calcula la fecha de vencimiento del presupuesto sumando días a la fecha actual.
 * Retorna un Timestamp de Firestore para almacenamiento consistente.
 *
 * @param {number} [validityDays=30] - Días de validez configurados en el perfil del negocio.
 * @returns {import('firebase/firestore').Timestamp}
 */
export function calcValidUntil(validityDays = 30) {
  const d = new Date();
  d.setDate(d.getDate() + validityDays);
  return Timestamp.fromDate(d);
}
