/**
 * Tests puros (sin emulador) del mensaje y la validación de teléfono de
 * WhatsApp — incluye cliente ocasional y cliente sin teléfono.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  cleanPhoneForWhatsApp,
  isValidWhatsAppPhone,
} from '../../src/utils/whatsappMessage.js';

const BASE_QUOTE = {
  quoteNumber: 12,
  total: 15000,
  client: { name: 'Juan Pérez', phone: '+54 9 11 2233-4455', email: null, address: null },
  business: { businessName: 'Electricidad Gómez' },
};

test('el mensaje incluye nombre del cliente, número de presupuesto, negocio y total', () => {
  const msg = buildWhatsAppMessage(BASE_QUOTE);
  assert.match(msg, /Juan Pérez/);
  assert.match(msg, /#0012/);
  assert.match(msg, /Electricidad Gómez/);
  assert.match(msg, /\$\s?15\.000/);
});

test('sin nombre de negocio (freelancer sin businessName), el mensaje no lo menciona vacío', () => {
  const quote = { ...BASE_QUOTE, business: { businessName: '' } };
  const msg = buildWhatsAppMessage(quote);
  assert.doesNotMatch(msg, / de \./); // no debe quedar "... presupuesto #0012 de ."
});

test('cliente ocasional (sin ficha guardada, clientId null) arma el mismo mensaje', () => {
  const occasionalQuote = {
    ...BASE_QUOTE,
    clientId: null,
    client: { name: 'Cliente Ocasional', phone: '01122334455', email: null, address: null },
  };
  const msg = buildWhatsAppMessage(occasionalQuote);
  assert.match(msg, /Cliente Ocasional/);
});

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

test('buildWhatsAppUrl arma el link wa.me con el texto codificado', () => {
  const url = buildWhatsAppUrl('+54 9 11 2233-4455', 'Hola!');
  assert.equal(url, 'https://wa.me/5491122334455?text=Hola!');
});
