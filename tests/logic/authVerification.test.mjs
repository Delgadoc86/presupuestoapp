import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  reloadEmailVerification,
  runWithFreshAuthTokenRetry,
  shouldRetryWithFreshToken,
} from '../../src/utils/authVerification.js';

test('al verificar, renueva el ID token antes de habilitar el acceso', async () => {
  const calls = [];
  const user = {
    emailVerified: false,
    async reload() {
      calls.push('reload');
      this.emailVerified = true;
    },
    async getIdToken(forceRefresh) {
      calls.push(`getIdToken:${forceRefresh}`);
      return 'token-verificado';
    },
  };

  const verified = await reloadEmailVerification(user);

  assert.equal(verified, true);
  assert.deepEqual(calls, ['reload', 'getIdToken:true']);
});

test('si el correo sigue sin verificar, no renueva el token ni habilita el acceso', async () => {
  const calls = [];
  const user = {
    emailVerified: false,
    async reload() {
      calls.push('reload');
    },
    async getIdToken() {
      calls.push('getIdToken');
    },
  };

  const verified = await reloadEmailVerification(user);

  assert.equal(verified, false);
  assert.deepEqual(calls, ['reload']);
});

test('sin usuario autenticado devuelve false', async () => {
  assert.equal(await reloadEmailVerification(null), false);
});

test('un permiso rechazado con usuario verificado renueva el token y reintenta una sola vez', async () => {
  const calls = [];
  let attempts = 0;
  const user = {
    emailVerified: true,
    async getIdToken(forceRefresh) {
      calls.push(`getIdToken:${forceRefresh}`);
    },
  };

  const result = await runWithFreshAuthTokenRetry(user, async () => {
    attempts += 1;
    calls.push(`operation:${attempts}`);
    if (attempts === 1) {
      throw Object.assign(new Error('token anterior'), { code: 'permission-denied' });
    }
    return 'guardado';
  });

  assert.equal(result, 'guardado');
  assert.deepEqual(calls, ['operation:1', 'getIdToken:true', 'operation:2']);
});

test('un error no relacionado con autenticación no se reintenta', async () => {
  let attempts = 0;
  const original = Object.assign(new Error('sin red'), { code: 'unavailable' });

  await assert.rejects(
    runWithFreshAuthTokenRetry(
      { emailVerified: true, getIdToken: async () => {} },
      async () => {
        attempts += 1;
        throw original;
      }
    ),
    error => error === original
  );

  assert.equal(attempts, 1);
});

test('un usuario todavía no verificado no reintenta un permiso rechazado', async () => {
  let attempts = 0;
  let refreshes = 0;
  const original = Object.assign(new Error('correo no verificado'), {
    code: 'permission-denied',
  });

  await assert.rejects(
    runWithFreshAuthTokenRetry(
      {
        emailVerified: false,
        async getIdToken() {
          refreshes += 1;
        },
      },
      async () => {
        attempts += 1;
        throw original;
      }
    ),
    error => error === original
  );

  assert.equal(attempts, 1);
  assert.equal(refreshes, 0);
});

test('si el segundo intento también falla, propaga el error sin un tercer intento', async () => {
  let attempts = 0;
  const finalError = Object.assign(new Error('permiso real'), {
    code: 'permission-denied',
  });

  await assert.rejects(
    runWithFreshAuthTokenRetry(
      { emailVerified: true, getIdToken: async () => {} },
      async () => {
        attempts += 1;
        throw finalError;
      }
    ),
    error => error === finalError
  );

  assert.equal(attempts, 2);
});

test('reconoce los códigos de Firestore y Storage que admiten renovar sesión', () => {
  assert.equal(shouldRetryWithFreshToken({ code: 'permission-denied' }), true);
  assert.equal(shouldRetryWithFreshToken({ code: 'storage/unauthorized' }), true);
  assert.equal(shouldRetryWithFreshToken({ code: 'unavailable' }), false);
});
