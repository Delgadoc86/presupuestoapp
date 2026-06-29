/**
 * Mapeo de códigos de error a mensajes amigables en español.
 * Combina errores de Firebase SDK y códigos propios de la app.
 */
const FIREBASE_MESSAGES = {
  'permission-denied':    'No tenés permiso para realizar esta acción.',
  'unavailable':          'Servicio no disponible. Verificá tu conexión.',
  'not-found':            'El recurso no fue encontrado.',
  'already-exists':       'El recurso ya existe.',
  'cancelled':            'La operación fue cancelada.',
  'deadline-exceeded':    'La operación tardó demasiado. Intentá de nuevo.',
  'resource-exhausted':   'Demasiadas solicitudes. Esperá un momento.',
  'unauthenticated':      'Sesión expirada. Iniciá sesión nuevamente.',
  'internal':             'Error interno. Intentá de nuevo más tarde.',
  'network-request-failed': 'Sin conexión. Verificá tu internet.',
};

const APP_MESSAGES = {
  'account_suspended':  'Tu cuenta está suspendida. Contactá soporte.',
  'demo_limit_reached': 'Alcanzaste el límite de presupuestos del plan Demo.',
};

/**
 * Retorna un mensaje legible para el usuario dado un error capturado.
 * Busca primero en errores propios de la app, luego en Firebase.
 *
 * @param {Error|null|undefined} error
 * @returns {string}
 */
export function getFriendlyErrorMessage(error) {
  if (!error) return 'Ocurrió un error. Intentá de nuevo.';
  const code = error?.code;
  if (code && APP_MESSAGES[code]) return APP_MESSAGES[code];
  if (code && FIREBASE_MESSAGES[code]) return FIREBASE_MESSAGES[code];
  return error?.message ?? 'Ocurrió un error. Intentá de nuevo.';
}

/**
 * Loguea un error con contexto en desarrollo.
 * En producción solo hace log silencioso (sin ruido para el usuario).
 * Preparado para conectar Sentry u otro tracker en el futuro:
 *   Sentry.captureException(error, { tags: { context } });
 *
 * @param {string} context - Nombre del servicio/función que capturó el error.
 * @param {Error|unknown} error
 */
export function logError(context, error) {
  if (__DEV__) {
    console.error(`[${context}]`, error);
  }
}
