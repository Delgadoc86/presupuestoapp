/**
 * Estado-máquina de seguimiento de presupuestos.
 *
 * Única fuente de verdad del lado de la app — quotes.service.js y las
 * pantallas la usan para decidir qué acciones mostrar y validar antes de
 * escribir. firestore.rules replica esta misma tabla manualmente (el
 * lenguaje de reglas no puede importar este archivo); si se edita una
 * transición acá, hay que editar también firestore.rules. El test
 * tests/rules/quote-status-transitions.test.mjs importa este archivo y
 * verifica cada transición contra las reglas desplegadas para detectar
 * esa desincronización automáticamente.
 *
 * 'paid' es un estado terminal legacy: no tiene transiciones de salida.
 * 'accepted' → 'paid' se mantiene por compatibilidad con la función actual
 * (marcar como pagado) hasta que exista jobs.paymentStatus — no se agrega
 * ninguna fecha de seguimiento nueva para 'paid' a propósito.
 */
export const STATUS_TRANSITIONS = {
  draft:    ['sent'],
  sent:     ['draft', 'accepted', 'rejected', 'expired'],
  accepted: ['rejected', 'paid'],
  rejected: ['accepted'],
  expired:  ['sent'],
  paid:     [],
};

/** Campo de fecha que se completa la PRIMERA vez que un presupuesto entra en cada estado. */
export const TRACKING_DATE_FIELD = {
  sent: 'sentAt',
  accepted: 'acceptedAt',
  rejected: 'rejectedAt',
  expired: 'expiredAt',
};

/**
 * @param {string} from - Estado actual real del presupuesto.
 * @param {string} to - Estado destino propuesto.
 * @returns {boolean}
 */
export function isValidStatusTransition(from, to) {
  return (STATUS_TRANSITIONS[from] ?? []).includes(to);
}

/**
 * @param {string} status
 * @returns {string|null} nombre del campo de fecha asociado, o null si ese
 *   estado no tiene una fecha de seguimiento propia (draft, paid).
 */
export function getTrackingDateField(status) {
  return TRACKING_DATE_FIELD[status] ?? null;
}

/** Estados considerados "pendientes de respuesta / necesitan seguimiento" en History. */
export const NEEDS_FOLLOWUP_STATUSES = ['sent', 'expired'];

/**
 * Acciones de cambio de estado disponibles por estado actual, con la
 * etiqueta y el texto de confirmación de cada una. Refleja exactamente
 * STATUS_TRANSITIONS de arriba — única fuente de verdad para QuoteDetailScreen
 * y HistoryScreen, así ambas pantallas ofrecen siempre las mismas acciones.
 */
export const STATUS_ACTIONS = {
  draft: [
    { to: 'sent', label: 'Marcar como enviado', message: '¿Marcar este presupuesto como enviado?' },
  ],
  sent: [
    { to: 'accepted', label: 'Marcar como aceptado', message: '¿El cliente aceptó este presupuesto?' },
    { to: 'rejected', label: 'Marcar como rechazado', message: '¿El cliente rechazó este presupuesto?' },
    { to: 'expired', label: 'Marcar como vencido', message: '¿Marcar este presupuesto como vencido? Se usa cuando pasó la fecha de validez sin respuesta del cliente.' },
    { to: 'draft', label: 'Volver a borrador', message: 'Esto deshace el envío — usalo solo si te equivocaste al marcarlo como enviado. ¿Volver a borrador?', muted: true },
  ],
  accepted: [
    { to: 'paid', label: 'Marcar como pagado', message: '¿Marcar este presupuesto como pagado?' },
    { to: 'rejected', label: 'Marcar como rechazado', message: 'El cliente cambió de opinión. ¿Marcar como rechazado?', muted: true },
  ],
  rejected: [
    { to: 'accepted', label: 'Marcar como aceptado', message: 'El cliente cambió de opinión. ¿Marcar como aceptado?' },
  ],
  expired: [
    { to: 'sent', label: 'Reenviar', message: '¿Volver a marcarlo como enviado?' },
  ],
  paid: [],
};

/** @param {string} status @returns {Array} acciones disponibles para ese estado. */
export function getStatusActions(status) {
  return STATUS_ACTIONS[status] ?? [];
}
