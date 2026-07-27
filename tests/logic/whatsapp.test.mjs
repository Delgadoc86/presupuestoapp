/**
 * Tests puros (sin emulador) de limpieza, normalización y validación del
 * teléfono que recibirá el PDF por WhatsApp.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanPhoneForWhatsApp,
  normalizePhoneForWhatsApp,
  isValidWhatsAppPhone,
} from '../../src/utils/whatsappMessage.js';

test('formatos válidos de teléfono', () => {
  assert.equal(isValidWhatsAppPhone('+54 9 11 2233-4455'), true);
  assert.equal(isValidWhatsAppPhone('01122334455'), true);
  assert.equal(isValidWhatsAppPhone('11 2233 4455'), true);
});

test('formatos inválidos de teléfono — cliente sin WhatsApp utilizable', () => {
  assert.equal(isValidWhatsAppPhone(''), false);
  assert.equal(isValidWhatsAppPhone(null), false);
  assert.equal(isValidWhatsAppPhone(undefined), false);
  assert.equal(isValidWhatsAppPhone('123'), false);
  assert.equal(isValidWhatsAppPhone('abc'), false, 'sin dígitos');
});

test('cleanPhoneForWhatsApp deja solo dígitos', () => {
  assert.equal(cleanPhoneForWhatsApp('+54 9 11 2233-4455'), '5491122334455');
  assert.equal(cleanPhoneForWhatsApp(null), '');
});

test('normaliza un número argentino local al formato internacional de WhatsApp', () => {
  assert.equal(normalizePhoneForWhatsApp('261 656-5656'), '5492616565656');
  assert.equal(normalizePhoneForWhatsApp('0261 656-5656'), '5492616565656');
});

test('normaliza el formato argentino antiguo con prefijo 15', () => {
  assert.equal(normalizePhoneForWhatsApp('0261 15 656-5656'), '5492616565656');
  assert.equal(normalizePhoneForWhatsApp('011 15 2233-4455'), '5491122334455');
});

test('conserva un número argentino ya internacional', () => {
  assert.equal(normalizePhoneForWhatsApp('+54 9 261 656-5656'), '5492616565656');
  assert.equal(normalizePhoneForWhatsApp('54 9 261 656-5656'), '5492616565656');
});

test('conserva códigos internacionales explícitos de otros países', () => {
  assert.equal(normalizePhoneForWhatsApp('+1 202 555 0147'), '12025550147');
  assert.equal(normalizePhoneForWhatsApp('001 202 555 0147'), '12025550147');
});
