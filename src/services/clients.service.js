import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase.config';
import { logError } from '../utils/errorUtils';

/**
 * Retorna la query de Firestore que filtra los clientes del usuario.
 * Se usa en useClients con onSnapshot. Incluye archivados y activos —
 * el filtro entre ambos se hace en el cliente (ver useClients / pantallas),
 * mismo criterio que ya usa el resto de la app para evitar índices
 * compuestos innecesarios en listas que igual son chicas.
 *
 * @param {string} userId - UID del usuario autenticado.
 * @returns {import('firebase/firestore').Query}
 */
export function getClientsQuery(userId) {
  return query(collection(db, 'clients'), where('userId', '==', userId));
}

function normalizeOptionalField(value) {
  const trimmed = value?.trim?.();
  return trimmed ? trimmed : null;
}

/**
 * Crea un nuevo cliente. Solo el nombre es obligatorio.
 * El documento se crea con TODOS los campos del modelo presentes (varios en
 * null si no se completaron) — firestore.rules exige el conjunto exacto de
 * campos tanto en create como en update, así que nunca conviene omitirlos.
 *
 * @param {string} userId - UID del usuario autenticado.
 * @param {{ name: string, phone?: string, email?: string, address?: string, notes?: string }} data
 * @returns {Promise<string>} ID del documento creado.
 */
export async function createClient(userId, data) {
  try {
    const ref = await addDoc(collection(db, 'clients'), {
      userId,
      name: data.name.trim(),
      phone: normalizeOptionalField(data.phone),
      email: normalizeOptionalField(data.email),
      address: normalizeOptionalField(data.address),
      notes: normalizeOptionalField(data.notes),
      archived: false,
      archivedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    logError('createClient', error);
    throw error;
  }
}

/**
 * Actualiza los datos de un cliente existente. No toca userId, archived
 * ni createdAt — para eso están archiveClient()/restoreClient().
 *
 * @param {string} clientId - ID del documento en la colección clients.
 * @param {{ name: string, phone?: string, email?: string, address?: string, notes?: string }} data
 * @returns {Promise<void>}
 */
export async function updateClient(clientId, data) {
  try {
    await updateDoc(doc(db, 'clients', clientId), {
      name: data.name.trim(),
      phone: normalizeOptionalField(data.phone),
      email: normalizeOptionalField(data.email),
      address: normalizeOptionalField(data.address),
      notes: normalizeOptionalField(data.notes),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logError('updateClient', error);
    throw error;
  }
}

/**
 * Archiva un cliente. No es un borrado físico — el documento sigue existiendo
 * y los presupuestos que lo referencian conservan el vínculo sin quedar
 * bloqueados para editarse (ver firestore.rules, quotes.update).
 *
 * @param {string} clientId
 * @returns {Promise<void>}
 */
export async function archiveClient(clientId) {
  try {
    await updateDoc(doc(db, 'clients', clientId), {
      archived: true,
      archivedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logError('archiveClient', error);
    throw error;
  }
}

/**
 * Restaura un cliente archivado.
 * @param {string} clientId
 * @returns {Promise<void>}
 */
export async function restoreClient(clientId) {
  try {
    await updateDoc(doc(db, 'clients', clientId), {
      archived: false,
      archivedAt: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logError('restoreClient', error);
    throw error;
  }
}
