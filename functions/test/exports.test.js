const test = require('node:test');
const assert = require('node:assert/strict');

test('exporta la callable de borrado con el runtime instalado', () => {
  const functions = require('../index');
  assert.equal(typeof functions.deleteCurrentUserAccount, 'function');
});
