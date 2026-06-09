import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase.config';

/**
 * Guarda o actualiza el perfil del negocio de un usuario.
 * Usa merge:true para no pisar campos existentes no incluidos en `data`
 * (por ejemplo logoUrl cuando se guarda solo el formulario de texto).
 *
 * @param {string} userId - UID del usuario autenticado.
 * @param {Object} data - Campos del perfil: businessName, sector, whatsapp, etc.
 * @returns {Promise<void>}
 */
export async function saveBusinessProfile(userId, data) {
  await setDoc(
    doc(db, 'businessProfiles', userId),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/**
 * Completa el onboarding: crea el perfil del negocio y marca al usuario como configurado.
 *
 * Se usan dos setDoc con merge:true en lugar de updateDoc porque ambos documentos
 * pueden no existir aún (usuario recién registrado). updateDoc fallaría con
 * "No document to update" si el doc no existe.
 *
 * AuthContext escucha onSnapshot en users/{uid} y detecta el cambio de
 * onboardingComplete automáticamente, lo que dispara la transición en AppNavigator.
 *
 * @param {string} userId - UID del usuario autenticado.
 * @param {Object} businessData - Datos completos del perfil del negocio.
 * @returns {Promise<void>}
 */
export async function completeOnboarding(userId, businessData) {
  await setDoc(
    doc(db, 'businessProfiles', userId),
    { ...businessData, updatedAt: serverTimestamp() },
    { merge: true }
  );
  await setDoc(
    doc(db, 'users', userId),
    { onboardingComplete: true },
    { merge: true }
  );
}
