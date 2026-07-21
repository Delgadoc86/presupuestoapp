/**
 * Tests puros (sin emulador) de la tabla de transiciones de estado.
 * Corren con: node --test tests/logic/*.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidStatusTransition, getTrackingDateField, STATUS_TRANSITIONS } from '../../src/utils/quoteStatus.js';

test('transiciones válidas', () => {
  assert.equal(isValidStatusTransition('draft', 'sent'), true);
  assert.equal(isValidStatusTransition('sent', 'draft'), true);
  assert.equal(isValidStatusTransition('sent', 'accepted'), true);
  assert.equal(isValidStatusTransition('sent', 'rejected'), true);
  assert.equal(isValidStatusTransition('sent', 'expired'), true);
  assert.equal(isValidStatusTransition('accepted', 'rejected'), true);
  assert.equal(isValidStatusTransition('rejected', 'accepted'), true);
  assert.equal(isValidStatusTransition('expired', 'sent'), true);
});

test('accepted → paid es válida (legacy, terminal)', () => {
  assert.equal(isValidStatusTransition('accepted', 'paid'), true);
});

test('paid → cualquier estado es inválida (terminal, sin salidas)', () => {
  for (const to of ['draft', 'sent', 'accepted', 'rejected', 'expired', 'paid']) {
    assert.equal(isValidStatusTransition('paid', to), false, `paid -> ${to} no debería ser válida`);
  }
});

test('estados inválidos: transiciones que no están en la tabla', () => {
  assert.equal(isValidStatusTransition('draft', 'accepted'), false, 'no se puede saltar sent');
  assert.equal(isValidStatusTransition('draft', 'rejected'), false);
  assert.equal(isValidStatusTransition('draft', 'expired'), false);
  assert.equal(isValidStatusTransition('accepted', 'draft'), false, 'no se vuelve a borrador desde accepted');
  assert.equal(isValidStatusTransition('rejected', 'draft'), false);
  assert.equal(isValidStatusTransition('expired', 'draft'), false);
  assert.equal(isValidStatusTransition('accepted', 'expired'), false);
  assert.equal(isValidStatusTransition('rejected', 'expired'), false);
});

test('getTrackingDateField devuelve el campo correcto por estado', () => {
  assert.equal(getTrackingDateField('sent'), 'sentAt');
  assert.equal(getTrackingDateField('accepted'), 'acceptedAt');
  assert.equal(getTrackingDateField('rejected'), 'rejectedAt');
  assert.equal(getTrackingDateField('expired'), 'expiredAt');
  assert.equal(getTrackingDateField('draft'), null);
  assert.equal(getTrackingDateField('paid'), null);
});

test('la tabla no tiene estados no declarados como origen', () => {
  const declaredStates = Object.keys(STATUS_TRANSITIONS);
  assert.deepEqual(
    declaredStates.sort(),
    ['accepted', 'draft', 'expired', 'paid', 'rejected', 'sent'].sort()
  );
});
