/**
 * Normaliza texto para búsqueda tolerante:
 * minúsculas + sin tildes/diacríticos + trim.
 *
 * @param {string|number|null} text
 * @returns {string}
 */
export function normalizeText(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/**
 * Verifica si un presupuesto coincide con el texto de búsqueda.
 * Busca en: nombre, teléfono, email del cliente; número de presupuesto y total.
 * Tolerante a mayúsculas/minúsculas y tildes.
 * El .includes() normalizado es el punto de extensión para fuzzy futuro.
 *
 * @param {Object} quote
 * @param {string} rawTerm
 * @returns {boolean}
 */
export function matchesSearch(quote, rawTerm) {
  if (!rawTerm?.trim()) return true;
  const term = normalizeText(rawTerm);
  const candidates = [
    quote.client?.name,
    quote.client?.phone,
    quote.client?.email,
    quote.quoteNumber != null ? String(quote.quoteNumber) : null,
    quote.quoteNumber != null
      ? `#${String(quote.quoteNumber).padStart(4, '0')}`
      : null,
    quote.total != null ? String(Math.round(quote.total)) : null,
  ];
  return candidates.some(c => c != null && normalizeText(c).includes(term));
}

/**
 * Verifica si un cliente coincide con el texto de búsqueda.
 * Busca en: nombre y teléfono. Tolerante a mayúsculas/minúsculas y tildes.
 *
 * @param {Object} client
 * @param {string} rawTerm
 * @returns {boolean}
 */
export function matchesClientSearch(client, rawTerm) {
  if (!rawTerm?.trim()) return true;
  const term = normalizeText(rawTerm);
  const candidates = [client.name, client.phone];
  return candidates.some(c => c != null && normalizeText(c).includes(term));
}
