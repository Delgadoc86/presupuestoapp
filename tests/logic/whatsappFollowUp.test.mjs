/**
 * Tests puros (sin emulador) de la condición que decide si se muestra el
 * aviso "¿Pudiste enviar el presupuesto?" al volver de WhatsApp.
 *
 * Esta función solo decide si se MUESTRA el diálogo — nunca marca el
 * presupuesto como enviado por sí sola (eso requiere que el usuario toque
 * "Sí" explícitamente en QuoteDetailScreen). Ese "nunca automático" es
 * estructural (el diálogo exige un toque) y se confirma por inspección del
 * código de QuoteDetailScreen, no por este test — acá solo se prueba la
 * condición de disparo.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldPromptAfterWhatsAppReturn } from '../../src/utils/whatsappFollowUp.js';

test('vuelve de background habiendo abierto WhatsApp → corresponde preguntar', () => {
  assert.equal(shouldPromptAfterWhatsAppReturn('background', 'active', true), true);
});

test('vuelve de inactive (iOS, transición corta) habiendo abierto WhatsApp → corresponde preguntar', () => {
  assert.equal(shouldPromptAfterWhatsAppReturn('inactive', 'active', true), true);
});

test('vuelve a active pero NO se había abierto WhatsApp → no corresponde preguntar', () => {
  assert.equal(shouldPromptAfterWhatsAppReturn('background', 'active', false), false);
});

test('la app no pasó a segundo plano (sigue activa) → no corresponde preguntar', () => {
  assert.equal(shouldPromptAfterWhatsAppReturn('active', 'active', true), false);
});

test('pasa a background pero todavía no vuelve a active → no corresponde preguntar todavía', () => {
  assert.equal(shouldPromptAfterWhatsAppReturn('active', 'background', true), false);
});
