/**
 * Retorna el año y mes actual en formato 'YYYY-MM', en UTC.
 * Reemplaza _currentYearMonth() duplicada en auth.service, quotes.service y HomeScreen.
 *
 * Usa UTC (no hora local) a propósito: firestore.rules calcula el mes vigente
 * con Timestamp.year()/.month() sin argumento de zona horaria, que es UTC por
 * defecto. Si este helper usara hora local, habría una ventana de varias horas
 * alrededor de cada cambio de mes (según el huso del dispositivo) en la que la
 * app y las reglas discreparían sobre qué mes es, rechazando creaciones de
 * presupuesto legítimas.
 */
export function getCurrentYearMonth() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Retorna new Date() — facilita mockear en tests futuros. */
export function getNowDate() {
  return new Date();
}

/**
 * Convierte un Timestamp de Firestore (o sus variantes) a Date nativo.
 * Maneja tres formas posibles:
 *   1. Firestore Timestamp con .toDate()
 *   2. Timestamp serializado { seconds, nanoseconds }
 *   3. Date nativo, número ms o string ISO
 * Retorna null si ts es null/undefined.
 */
export function timestampToDate(ts) {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  if (ts.seconds !== undefined) return new Date(ts.seconds * 1000);
  return new Date(ts);
}

/**
 * Formatea cualquier variante de Timestamp/Date a 'DD/MM/YYYY' en español-AR.
 * Retorna null si ts es null/undefined o falla la conversión.
 * Nota: retorna null (no '—') para que los condicionales JSX funcionen con `if (fecha)`.
 *       El PDF usa `formatDateAR(ts) ?? '—'` para mostrar placeholder.
 */
export function formatDateAR(ts) {
  try {
    const d = timestampToDate(ts);
    if (!d || isNaN(d.getTime())) return null;
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

/**
 * Suma N días calendario a una fecha base y retorna un nuevo Date.
 * Usa setDate (días calendario) para consistencia con comportamiento esperado en suscripciones.
 *
 * @param {Date} baseDate - Fecha de inicio.
 * @param {number} days - Días a sumar (puede ser negativo).
 * @returns {Date}
 */
export function addDays(baseDate, days) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Días restantes hasta el vencimiento de un Timestamp.
 *   > 0  → restan N días
 *   = 0  → vence hoy
 *   < 0  → venció hace |N| días
 * Retorna null si no hay fecha de vencimiento.
 */
export function getDaysRemaining(expiryTs) {
  const d = timestampToDate(expiryTs);
  if (!d) return null;
  return Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
}

/**
 * Retorna true si el Timestamp ya pasó respecto a la hora actual.
 * Retorna false si ts es null/undefined (sin expiración = no vencido).
 */
export function isExpired(expiryTs) {
  const d = timestampToDate(expiryTs);
  return d ? d < new Date() : false;
}

/**
 * Formatea un timestamp como tiempo relativo en español.
 * Ej: "Hace 2 horas", "Hace 3 días", "Hace 1 mes".
 * Retorna "Nunca" si ts es null/undefined.
 *
 * @param {*} ts - Firestore Timestamp, Date, o número ms.
 * @returns {string}
 */
export function formatRelativeTime(ts) {
  const d = timestampToDate(ts);
  if (!d) return 'Nunca';

  const diffMs = new Date() - d;
  if (diffMs < 0) return 'Recién';

  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return 'Hace un momento';

  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `Hace ${diffMonths} mes${diffMonths !== 1 ? 'es' : ''}`;

  const diffYears = Math.floor(diffMonths / 12);
  return `Hace ${diffYears} año${diffYears !== 1 ? 's' : ''}`;
}
