/**
 * Mensaje y link de WhatsApp — funciones puras, sin dependencias de React
 * Native/Expo, para poder testearlas con Node puro (a diferencia de
 * pdf.service.js, que importa Alert/expo-print/expo-sharing).
 *
 * Límite real de WhatsApp (no es una limitación de Expo): el esquema
 * wa.me/whatsapp://send solo admite texto — no existe forma de adjuntar un
 * archivo ni de combinarlo con un contacto específico en un solo paso. El
 * PDF se comparte aparte, vía el share sheet nativo (pdf.service.js).
 */
import { formatDateAR } from './dateUtils.js';

/**
 * Construye el texto del mensaje de WhatsApp para enviar un presupuesto.
 * Incluye nombre del cliente, número de presupuesto, nombre del negocio y
 * total — usa el snapshot inmutable del presupuesto (quote.client/quote.business),
 * nunca datos "en vivo" de la ficha del cliente o el perfil del negocio.
 */
export function buildWhatsAppMessage(quote) {
  const businessName = quote.business?.businessName ?? '';
  const clientName = quote.client?.name ?? '';
  const quoteNum = '#' + String(quote.quoteNumber ?? 0).padStart(4, '0');
  const total = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(quote.total ?? 0);

  let msg = `Hola ${clientName}! Te comparto el presupuesto ${quoteNum}`;
  if (businessName) msg += ` de ${businessName}`;
  msg += `.\n\nTotal: ${total}`;

  if (quote.validUntil) {
    const fecha = formatDateAR(quote.validUntil);
    if (fecha) msg += `\nVálido hasta: ${fecha}`;
  }

  msg += '\n\nEn un momento te comparto también el PDF por acá. Cualquier consulta, escribime.';
  return msg;
}

/**
 * Deja solo dígitos de un teléfono, para armar el link de WhatsApp.
 * @param {string|null|undefined} phone
 * @returns {string}
 */
export function cleanPhoneForWhatsApp(phone) {
  return (phone ?? '').replace(/\D/g, '');
}

/**
 * Chequeo laxo de sanidad — no valida el número real, solo descarta strings
 * claramente inservibles (vacío, letras sin dígitos, "123") antes de abrir
 * un link de WhatsApp roto. 8 dígitos es el mínimo razonable para un
 * número local completo con código de área, sin exigir código de país.
 * @param {string|null|undefined} phone
 * @returns {boolean}
 */
export function isValidWhatsAppPhone(phone) {
  return cleanPhoneForWhatsApp(phone).length >= 8;
}

/**
 * Construye la URL de WhatsApp para abrir una conversación con mensaje
 * pre-cargado. Solo texto — ver el comentario del encabezado del archivo.
 */
export function buildWhatsAppUrl(phone, message) {
  const cleaned = cleanPhoneForWhatsApp(phone);
  return 'https://wa.me/' + cleaned + '?text=' + encodeURIComponent(message);
}
