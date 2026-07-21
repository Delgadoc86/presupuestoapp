import {
  collection,
  doc,
  runTransaction,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase.config';
import { getCurrentYearMonth } from '../utils/dateUtils';
import { isEffectivelyPro } from '../utils/planStatus';
import { APP_CONFIG } from '../config/appConfig';
import { logError } from '../utils/errorUtils';
import { isValidStatusTransition, getTrackingDateField } from '../utils/quoteStatus';

function _checkUserLimits(userData) {
  if (userData.enabled === false) {
    const err = new Error('Cuenta suspendida');
    err.code = 'account_suspended';
    throw err;
  }
  if (!isEffectivelyPro(userData)) {
    const currentMonth = getCurrentYearMonth();
    const quotesThisMonth =
      (userData.quoteMonth ?? '') === currentMonth ? (userData.quotesThisMonth ?? 0) : 0;
    const quoteLimit = userData.quoteLimit ?? APP_CONFIG.demoQuoteLimit;
    if (quotesThisMonth >= quoteLimit) {
      const err = new Error('Límite demo alcanzado');
      err.code = 'demo_limit_reached';
      throw err;
    }
    return quotesThisMonth;
  }
  return null;
}

/** Presupuestos por página en el historial paginado. */
export const PAGE_SIZE = 20;

/**
 * Convierte el filtro de fecha UI en un Timestamp de Firestore para la query.
 * Retorna null si no hay filtro de fecha activo.
 *
 * @param {'today'|'7days'|'month'|'year'|null} dateFilter
 * @returns {import('firebase/firestore').Timestamp|null}
 */
export function getDateFilterTimestamp(dateFilter) {
  if (!dateFilter) return null;
  const now = new Date();
  let startDate;
  switch (dateFilter) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case '7days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return null;
  }
  return Timestamp.fromDate(startDate);
}

/**
 * Construye la query paginada para el historial de presupuestos.
 *
 * Índices Firestore necesarios (versionados en firestore.indexes.json):
 *   1. quotes: userId ASC, createdAt DESC              → base + filtro fecha
 *   2. quotes: status ASC, userId ASC, createdAt DESC   → filtro de un estado (± fecha)
 *   3. quotes: userId ASC, clientId ASC, createdAt DESC → historial por cliente
 * `where('status','in',[...])` (statusFilter como array) usa el mismo
 * índice que el filtro de un solo estado.
 *
 * @param {string} userId
 * @param {{ statusFilter?: string|string[]|null, dateFilter?: string|null, lastDoc?: any }} opts
 * @returns {import('firebase/firestore').Query}
 */
export function buildHistoryQuery(userId, { statusFilter = null, dateFilter = null, lastDoc = null } = {}) {
  const constraints = [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  ];

  if (Array.isArray(statusFilter) && statusFilter.length > 0) {
    constraints.push(where('status', 'in', statusFilter));
  } else if (statusFilter) {
    constraints.push(where('status', '==', statusFilter));
  }

  const dateFrom = getDateFilterTimestamp(dateFilter);
  if (dateFrom) {
    constraints.push(where('createdAt', '>=', dateFrom));
  }

  constraints.push(limit(PAGE_SIZE));

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  return query(collection(db, 'quotes'), ...constraints);
}

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
 * El ID del documento es determinista (`${userId}_${quoteNumber}`) en vez de
 * autogenerado. firestore.rules exige que coincida exactamente con el nuevo
 * lastQuoteNumber del mismo commit — como una transacción/batch solo admite
 * una escritura por documento, esto limita a un único presupuesto válido por
 * incremento de contador (ver firestore.rules, quotes.create).
 *
 * @param {string} userId - UID del usuario autenticado.
 * @param {Object} quoteData - Datos del presupuesto (client, items, totals, etc.).
 * @returns {Promise<string>} ID del documento creado en Firestore.
 */
export async function createQuote(userId, quoteData) {
  const userRef = doc(db, 'users', userId);
  let newQuoteId;

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const userData = userSnap.data() ?? {};
    const quotesThisMonth = _checkUserLimits(userData);

    const lastNumber = userData.lastQuoteNumber ?? 0;
    const nextNumber = lastNumber + 1;
    const currentMonth = getCurrentYearMonth();
    const effectivelyPro = isEffectivelyPro(userData);

    newQuoteId = `${userId}_${nextNumber}`;
    const quoteRef = doc(db, 'quotes', newQuoteId);

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

  return newQuoteId;
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
  try {
    await updateDoc(doc(db, 'quotes', quoteId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logError('updateQuote', error);
    throw error;
  }
}

/**
 * Cambia el estado de un presupuesto siguiendo el estado-máquina de
 * src/utils/quoteStatus.js. Corre dentro de una transacción: el estado
 * ACTUAL se lee de adentro (nunca se confía en lo que la UI crea que es el
 * estado — puede estar desactualizado si otro dispositivo ya lo cambió), y
 * la fecha de seguimiento del estado destino se fija solo si todavía no
 * existía. Si dos dispositivos cambian el estado casi al mismo tiempo,
 * Firestore serializa las transacciones — la segunda relee el estado ya
 * actualizado por la primera y se valida contra ESE estado real.
 *
 * @param {string} quoteId - ID del documento.
 * @param {string} newStatus - Estado destino: 'draft'|'sent'|'accepted'|'rejected'|'expired'|'paid'.
 * @returns {Promise<void>}
 * @throws {Error} code: 'quote_not_found' | 'invalid_status_transition'
 */
export async function updateQuoteStatus(quoteId, newStatus) {
  const quoteRef = doc(db, 'quotes', quoteId);
  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(quoteRef);
      if (!snap.exists()) {
        const err = new Error('Presupuesto no encontrado');
        err.code = 'quote_not_found';
        throw err;
      }
      const data = snap.data();
      const currentStatus = data.status;

      if (!isValidStatusTransition(currentStatus, newStatus)) {
        const err = new Error(`No se puede pasar de "${currentStatus}" a "${newStatus}"`);
        err.code = 'invalid_status_transition';
        throw err;
      }

      const updates = {
        status: newStatus,
        statusUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const dateField = getTrackingDateField(newStatus);
      if (dateField && !data[dateField]) {
        updates[dateField] = serverTimestamp();
      }

      transaction.update(quoteRef, updates);
    });
  } catch (error) {
    logError('updateQuoteStatus', error);
    throw error;
  }
}

/**
 * Elimina un presupuesto permanentemente de Firestore.
 * Esta operación no tiene rollback. La confirmación debe pedirse en la UI.
 *
 * @param {string} quoteId - ID del documento a eliminar.
 * @returns {Promise<void>}
 */
export async function deleteQuote(quoteId) {
  try {
    await deleteDoc(doc(db, 'quotes', quoteId));
  } catch (error) {
    logError('deleteQuote', error);
    throw error;
  }
}

/**
 * Duplica un presupuesto existente como nuevo borrador con número correlativo nuevo.
 * Usa la misma lógica de transacción que createQuote para garantizar unicidad,
 * incluido el ID determinista `${userId}_${quoteNumber}` (ver createQuote).
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
  let newQuoteId;

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const userData = userSnap.data() ?? {};
    const quotesThisMonth = _checkUserLimits(userData);

    const lastNumber = userData.lastQuoteNumber ?? 0;
    const nextNumber = lastNumber + 1;
    const currentMonth = getCurrentYearMonth();
    const effectivelyPro = isEffectivelyPro(userData);

    newQuoteId = `${userId}_${nextNumber}`;
    const quoteRef = doc(db, 'quotes', newQuoteId);

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

  return newQuoteId;
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
