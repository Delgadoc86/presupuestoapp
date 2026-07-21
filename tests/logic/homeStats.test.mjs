/**
 * Tests puros (sin emulador) del manejo de fallos parciales en los 4
 * conteos de estado de HomeScreen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveStatusCounts } from '../../src/utils/homeStats.js';

const STATUSES = ['draft', 'sent', 'accepted', 'expired'];

test('las 4 queries exitosas devuelven sus 4 valores', () => {
  const results = [
    { status: 'fulfilled', value: { data: () => ({ count: 3 }) } },
    { status: 'fulfilled', value: { data: () => ({ count: 5 }) } },
    { status: 'fulfilled', value: { data: () => ({ count: 1 }) } },
    { status: 'fulfilled', value: { data: () => ({ count: 0 }) } },
  ];
  const counts = deriveStatusCounts(STATUSES, results);
  assert.deepEqual(counts, {
    draft:    { value: 3, error: false },
    sent:     { value: 5, error: false },
    accepted: { value: 1, error: false },
    expired:  { value: 0, error: false },
  });
});

test('un fallo parcial no rompe las otras tarjetas', () => {
  const results = [
    { status: 'fulfilled', value: { data: () => ({ count: 3 }) } },
    { status: 'rejected', reason: new Error('network') },
    { status: 'fulfilled', value: { data: () => ({ count: 1 }) } },
    { status: 'fulfilled', value: { data: () => ({ count: 0 }) } },
  ];
  const counts = deriveStatusCounts(STATUSES, results);
  assert.equal(counts.draft.value, 3);
  assert.equal(counts.draft.error, false);
  assert.equal(counts.sent.value, null);
  assert.equal(counts.sent.error, true);
  assert.equal(counts.accepted.value, 1);
  assert.equal(counts.expired.value, 0);
});

test('las 4 queries fallando devuelven fallback en las 4', () => {
  const results = STATUSES.map(() => ({ status: 'rejected', reason: new Error('offline') }));
  const counts = deriveStatusCounts(STATUSES, results);
  for (const s of STATUSES) {
    assert.equal(counts[s].value, null);
    assert.equal(counts[s].error, true);
  }
});
