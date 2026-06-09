import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase.config';

// Mapeo de códigos de error Firebase → mensajes legibles en español.
// Firebase devuelve siempre un código string (error.code), nunca un mensaje amigable.
const AUTH_ERROR_MESSAGES = {
  'auth/invalid-credential': 'Email o contraseña incorrectos',
  'auth/user-not-found': 'No existe una cuenta con ese email',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese email',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
  'auth/invalid-email': 'El email ingresado no es válido',
  'auth/too-many-requests': 'Demasiados intentos. Intentá de nuevo más tarde',
  'auth/network-request-failed': 'Sin conexión. Verificá tu internet',
  'auth/user-disabled': 'Esta cuenta fue deshabilitada',
  'auth/operation-not-allowed': 'Operación no permitida',
};

/**
 * Convierte un error de Firebase Auth en un mensaje legible para el usuario.
 * @param {import('firebase/auth').AuthError} error - Error lanzado por Firebase Auth.
 * @returns {string} Mensaje en español listo para mostrar en pantalla.
 */
export function getAuthErrorMessage(error) {
  return AUTH_ERROR_MESSAGES[error?.code] ?? 'Ocurrió un error. Intentá de nuevo';
}

/**
 * Registra un nuevo usuario con email y contraseña.
 *
 * Patrón de rollback: si el documento Firestore falla después de que Firebase Auth
 * ya creó la cuenta, eliminamos el usuario Auth para evitar cuentas huérfanas
 * (autenticadas pero sin documento en Firestore, lo que rompería el flujo de onboarding).
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').User>} Usuario recién creado.
 * @throws {Error} Si la creación en Auth o Firestore falla.
 */
export async function registerWithEmail(email, password) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      createdAt: serverTimestamp(),
      onboardingComplete: false,
      lastQuoteNumber: 0,  // contador para números correlativos de presupuesto
    });
  } catch (firestoreError) {
    // Revertimos la creación del usuario Auth para no dejar cuentas huérfanas
    await user.delete().catch(() => {});
    throw firestoreError;
  }
  return user;
}

/**
 * Inicia sesión con email y contraseña.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function loginWithEmail(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

/**
 * Cierra la sesión del usuario actual.
 * AuthContext detecta el cambio vía onAuthStateChanged y limpia el estado global.
 * @returns {Promise<void>}
 */
export async function logout() {
  await signOut(auth);
}

/**
 * Envía un email de recuperación de contraseña al email indicado.
 * Firebase maneja el template del email desde la consola del proyecto.
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}
