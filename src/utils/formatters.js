/**
 * Formatea un número como moneda en pesos argentinos (ARS).
 * Ejemplo: 15000 → "$15.000,00"
 *
 * @param {number|null|undefined} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0,00';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea un Timestamp de Firestore o un Date como fecha corta en español argentino.
 * Ejemplo: Timestamp → "08/06/2026"
 *
 * Acepta tanto Timestamp de Firestore (con .toDate()) como objetos Date o timestamps Unix.
 *
 * @param {import('firebase/firestore').Timestamp|Date|null} timestamp
 * @returns {string}
 */
export function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Formatea el número correlativo de un presupuesto con prefijo # y ceros a la izquierda.
 * Ejemplo: 5 → "#0005"
 *
 * @param {number} number - Número correlativo del presupuesto.
 * @returns {string}
 */
export function formatQuoteNumber(number) {
  return `#${String(number).padStart(4, '0')}`;
}

/**
 * Limpia un string de teléfono dejando solo dígitos, +, espacios, guiones y paréntesis.
 * Uso: normalizar el teléfono antes de mostrarlo en pantalla.
 *
 * @param {string} phone
 * @returns {string}
 */
export function formatPhone(phone) {
  if (!phone) return '';
  return phone.replace(/[^0-9+\s()-]/g, '');
}
