/**
 * Teléfonos de WhatsApp — funciones puras, sin dependencias de React
 * Native/Expo, para poder testearlas con Node puro.
 *
 * El envío del PDF a un contacto específico usa la integración nativa de
 * pdf.service.js; este archivo concentra la limpieza, normalización y
 * validación previa del teléfono.
 */

/**
 * Deja solo dígitos de un teléfono, para armar el link de WhatsApp.
 * @param {string|null|undefined} phone
 * @returns {string}
 */
export function cleanPhoneForWhatsApp(phone) {
  return (phone ?? '').replace(/\D/g, '');
}

/**
 * Convierte formatos argentinos habituales al identificador internacional
 * que WhatsApp espera: 54 + 9 + código de área + número.
 *
 * Ejemplos: 261 6565656, 0261 6565656, 0261 15 6565656 y +54 9 ...
 * terminan todos en 5492616565656. Los números escritos explícitamente con
 * otro código internacional (+...) se conservan.
 */
export function normalizePhoneForWhatsApp(phone) {
  const raw = String(phone ?? '').trim();
  let digits = cleanPhoneForWhatsApp(raw);
  if (!digits) return '';

  const hadExplicitInternationalPrefix = raw.startsWith('+') || raw.startsWith('00');
  if (raw.startsWith('00')) digits = digits.replace(/^00/, '');

  if (digits.startsWith('54')) {
    const national = digits.slice(2);
    if (national.startsWith('9') && national.length === 11) return digits;
    if (national.length === 10) return `549${national}`;
    return digits;
  }

  if (hadExplicitInternationalPrefix) return digits;

  // Formato nacional antiguo: 0 + área + 15 + número. Al quitar 0 y 15
  // deben quedar los 10 dígitos del número argentino.
  digits = digits.replace(/^0/, '');
  if (digits.length === 12) {
    for (let index = 2; index <= 4; index += 1) {
      if (digits.slice(index, index + 2) === '15') {
        const withoutMobilePrefix = digits.slice(0, index) + digits.slice(index + 2);
        if (withoutMobilePrefix.length === 10) {
          digits = withoutMobilePrefix;
          break;
        }
      }
    }
  }

  if (digits.length === 10) return `549${digits}`;
  if (digits.length === 11 && digits.startsWith('9')) return `54${digits}`;
  return digits;
}

/**
 * Chequeo laxo de sanidad — no valida el número real, solo descarta strings
 * claramente inservibles (vacío, letras sin dígitos, "123") antes de intentar
 * el envío nativo. 8 dígitos es el mínimo razonable para un
 * número local completo con código de área, sin exigir código de país.
 * @param {string|null|undefined} phone
 * @returns {boolean}
 */
export function isValidWhatsAppPhone(phone) {
  const normalized = normalizePhoneForWhatsApp(phone);
  return normalized.length >= 8 && normalized.length <= 15;
}
