/**
 * Recarga el estado del usuario y, si el correo ya fue verificado, renueva
 * obligatoriamente el ID token antes de habilitar las pantallas protegidas.
 *
 * Firebase Auth puede actualizar `user.emailVerified` mediante reload() y
 * conservar a la vez un token no vencido con `email_verified: false`. Las
 * reglas de Firestore y Storage leen el claim del token, no la propiedad del
 * objeto User, por lo que ambos estados deben sincronizarse en este orden.
 *
 * @param {import('firebase/auth').User|null|undefined} currentUser
 * @returns {Promise<boolean>}
 */
export async function reloadEmailVerification(currentUser) {
  if (!currentUser) return false;

  await currentUser.reload();
  const verified = currentUser.emailVerified === true;

  if (verified) {
    await currentUser.getIdToken(true);
  }

  return verified;
}

const RETRYABLE_AUTH_CODES = new Set([
  'permission-denied',
  'firestore/permission-denied',
  'unauthenticated',
  'firestore/unauthenticated',
  'storage/unauthenticated',
  'storage/unauthorized',
]);

/**
 * Indica si una operación protegida pudo haber usado un ID token anterior a
 * la verificación del correo. El reintento siempre está limitado a una vez.
 */
export function shouldRetryWithFreshToken(error) {
  return RETRYABLE_AUTH_CODES.has(error?.code);
}

/**
 * Ejecuta una escritura protegida y, ante un rechazo compatible con un token
 * desactualizado, fuerza su renovación y reintenta la operación una sola vez.
 * Los rechazos reales de permisos siguen propagándose después del reintento.
 *
 * @template T
 * @param {import('firebase/auth').User|null|undefined} currentUser
 * @param {() => Promise<T>} operation
 * @returns {Promise<T>}
 */
export async function runWithFreshAuthTokenRetry(currentUser, operation) {
  try {
    return await operation();
  } catch (error) {
    if (!currentUser?.emailVerified || !shouldRetryWithFreshToken(error)) {
      throw error;
    }

    await currentUser.getIdToken(true);
    return operation();
  }
}
