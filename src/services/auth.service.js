import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../../firebase.config';
import { deleteLogo } from './storage.service';

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

export function getAuthErrorMessage(error) {
  return AUTH_ERROR_MESSAGES[error?.code] ?? 'Ocurrió un error. Intentá de nuevo';
}

export async function registerWithEmail(email, password) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      createdAt: serverTimestamp(),
      onboardingComplete: false,
      lastQuoteNumber: 0,
    });
  } catch (firestoreError) {
    await user.delete().catch(() => {});
    throw firestoreError;
  }
  return user;
}

export async function loginWithEmail(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

export async function logout() {
  await signOut(auth);
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Reautentica al usuario actual con su contraseña (proveedores email/password).
 *
 * Debe llamarse ANTES de deleteCurrentUserAccount() para garantizar que
 * Firebase no rechace deleteUser() con auth/requires-recent-login.
 *
 * @throws {Error} auth/wrong-password | auth/invalid-credential — contraseña incorrecta.
 * @throws {Error} auth/too-many-requests — demasiados intentos fallidos.
 */
export async function reauthenticateWithPassword(email, password) {
  const credential = EmailAuthProvider.credential(email, password);
  await reauthenticateWithCredential(auth.currentUser, credential);
}

/**
 * Elimina permanentemente la cuenta del usuario actual.
 *
 * PRECONDICIÓN: el llamador ya invocó reauthenticateWithPassword() exitosamente.
 * Esto garantiza que deleteUser() no lance auth/requires-recent-login.
 *
 * Orden de operaciones (crítico):
 *  1. Firestore — quotes, templates, businessProfile, users/{uid}
 *     (el token Auth sigue válido; si falla aquí, Auth no se borra → retry seguro)
 *  2. Storage — logo del negocio (deleteLogo absorbe errores "file not found")
 *  3. Auth — deleteUser() al final, invalida el token
 *     onAuthStateChanged dispara → AppNavigator muestra AuthNavigator
 *
 * Si Firestore lanza en el paso 1, el error se propaga y Auth NO se borra.
 * La cuenta queda intacta — el usuario puede reintentar.
 */
export async function deleteCurrentUserAccount() {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('No hay usuario autenticado');
  const uid = currentUser.uid;

  // Paso 1: Firestore (propaga error si falla — Auth no se borra)
  const [quotesSnap, templatesSnap] = await Promise.all([
    getDocs(query(collection(db, 'quotes'), where('userId', '==', uid))),
    getDocs(query(collection(db, 'templates'), where('userId', '==', uid))),
  ]);
  await Promise.all([
    ...quotesSnap.docs.map(d => deleteDoc(d.ref)),
    ...templatesSnap.docs.map(d => deleteDoc(d.ref)),
    deleteDoc(doc(db, 'businessProfiles', uid)),
    deleteDoc(doc(db, 'users', uid)),
  ]);

  // Paso 2: Storage (deleteLogo absorbe internamente errores de archivo no encontrado)
  await deleteLogo(uid);

  // Paso 3: Auth — último paso, invalida la sesión
  await deleteUser(currentUser);
}
