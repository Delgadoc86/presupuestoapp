import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase.config';
import { getDefaultTemplate } from '../data/defaultTemplates';
import { logError } from '../utils/errorUtils';

/**
 * Retorna la query de Firestore que filtra las plantillas del usuario.
 * Se usa en useTemplates con onSnapshot para escucha en tiempo real.
 * El ordenamiento se hace en el cliente para evitar requerir un índice
 * compuesto (userId + createdAt) en Firestore.
 *
 * @param {string} userId - UID del usuario autenticado.
 * @returns {import('firebase/firestore').Query}
 */
export function getTemplatesQuery(userId) {
  return query(
    collection(db, 'templates'),
    where('userId', '==', userId)
  );
}

/**
 * Crea una nueva plantilla de ítems para el usuario.
 * Usa addDoc (ID auto-generado por Firestore) en lugar de setDoc.
 *
 * @param {string} userId - UID del usuario autenticado.
 * @param {Object} data - Datos de la plantilla.
 * @param {string} data.name - Nombre de la plantilla.
 * @param {string} [data.sector] - Rubro al que aplica (opcional).
 * @param {Array}  [data.items]  - Lista de ítems: { name, defaultPrice, unit }.
 * @returns {Promise<string>} ID del documento creado.
 */
export async function createTemplate(userId, data) {
  const ref = await addDoc(collection(db, 'templates'), {
    userId,
    name: data.name,
    sector: data.sector ?? '',
    items: data.items ?? [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Actualiza una plantilla existente.
 * Solo modifica name, sector e items — no toca userId ni createdAt.
 *
 * @param {string} templateId - ID del documento en la colección templates.
 * @param {Object} data - Campos a actualizar (name, sector, items).
 * @returns {Promise<void>}
 */
export async function updateTemplate(templateId, data) {
  await updateDoc(doc(db, 'templates', templateId), {
    name: data.name,
    sector: data.sector ?? '',
    items: data.items ?? [],
    updatedAt: serverTimestamp(),
  });
}

/**
 * Elimina una plantilla permanentemente.
 * @param {string} templateId - ID del documento a eliminar.
 * @returns {Promise<void>}
 */
export async function deleteTemplate(templateId) {
  await deleteDoc(doc(db, 'templates', templateId));
}

// ─────────────────────────────────────────────────────────────
// Plantillas base por rubro
// ─────────────────────────────────────────────────────────────

/**
 * Convierte los ítems de una plantilla base al formato que usa Firestore.
 * Asigna IDs únicos y orden a cada ítem.
 * @param {Array} items
 * @returns {Array}
 */
function buildItems(items) {
  return items.map((item, index) => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}-${index}`,
    name: item.name,
    defaultPrice: item.defaultPrice ?? 0,
    unit: item.unit ?? 'unidad',
    order: index,
  }));
}

/**
 * Crea la plantilla base del rubro del usuario, SOLO si todavía no tiene ninguna plantilla.
 * Se llama al finalizar el onboarding. Si el usuario ya tiene plantillas, no hace nada.
 *
 * @param {string} userId - UID del usuario autenticado.
 * @param {string} sector - Rubro ingresado por el usuario (texto libre).
 * @returns {Promise<void>}
 */
export async function initDefaultTemplate(userId, sector) {
  try {
    const q = getTemplatesQuery(userId);
    const snap = await getDocs(q);

    // Si ya tiene plantillas, no interferimos
    if (!snap.empty) return;

    const template = getDefaultTemplate(sector);

    await addDoc(collection(db, 'templates'), {
      userId,
      name: template.name,
      sector: template.category,
      items: buildItems(template.items),
      isDefault: true,        // marca para identificarla al restaurar
      defaultKey: template.key, // rubro normalizado para matching
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    // No bloqueamos el onboarding si falla la creación de la plantilla
    logError('initDefaultTemplate', error);
  }
}

/**
 * Restaura la plantilla base del rubro actual del usuario.
 *
 * Comportamiento:
 * - Si existe una plantilla marcada con isDefault:true para el mismo defaultKey,
 *   la actualiza con los ítems originales (sin tocar las demás plantillas del usuario).
 * - Si no existe ninguna, crea una nueva.
 * - Los precios se restauran a 0.
 * - No duplica si ya hay una del mismo rubro.
 *
 * @param {string} userId - UID del usuario autenticado.
 * @param {string} sector - Rubro del negocio del usuario (texto libre).
 * @returns {Promise<void>}
 */
export async function restoreDefaultTemplate(userId, sector) {
  const template = getDefaultTemplate(sector);
  const items = buildItems(template.items);

  // Buscar todas las plantillas del usuario y filtrar en cliente
  // (evita requerir índice compuesto en Firestore)
  const q = getTemplatesQuery(userId);
  const snap = await getDocs(q);

  const existing = snap.docs.find(
    d => d.data().isDefault === true && d.data().defaultKey === template.key
  );

  if (existing) {
    await updateDoc(existing.ref, {
      name: template.name,
      sector: template.category,
      items,
      updatedAt: serverTimestamp(),
    });
  } else {
    await addDoc(collection(db, 'templates'), {
      userId,
      name: template.name,
      sector: template.category,
      items,
      isDefault: true,
      defaultKey: template.key,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}
