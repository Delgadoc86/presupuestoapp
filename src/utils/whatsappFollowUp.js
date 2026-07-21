/**
 * Decide si corresponde mostrar el aviso "¿Pudiste enviar el presupuesto?"
 * al volver a la app después de abrir WhatsApp. Separado del listener de
 * AppState en QuoteDetailScreen para poder testear la condición sin montar
 * un componente ni mockear AppState.
 *
 * El presupuesto NUNCA se marca como enviado automáticamente acá — esta
 * función solo decide si corresponde MOSTRAR el diálogo de confirmación;
 * marcar como enviado siempre requiere que el usuario toque "Sí" en ese
 * diálogo (ver QuoteDetailScreen).
 *
 * @param {string} previousAppState - estado anterior de AppState ('active'|'background'|'inactive').
 * @param {string} nextAppState - estado nuevo.
 * @param {boolean} isAwaitingWhatsAppReturn - true si se abrió WhatsApp y todavía no se preguntó.
 * @returns {boolean}
 */
export function shouldPromptAfterWhatsAppReturn(previousAppState, nextAppState, isAwaitingWhatsAppReturn) {
  return isAwaitingWhatsAppReturn
    && (previousAppState === 'background' || previousAppState === 'inactive')
    && nextAppState === 'active';
}
