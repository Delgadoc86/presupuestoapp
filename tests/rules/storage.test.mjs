import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { test, before, beforeEach, after } from 'node:test';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RULES_SOURCE = readFileSync(path.join(__dirname, '..', '..', 'storage.rules'), 'utf8');
let env;

function storageFor(uid, verified = true) {
  return env.authenticatedContext(uid, {
    email: `${uid}@test.local`,
    email_verified: verified,
  }).storage();
}

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'presufacil-rules-test-storage',
    storage: { rules: RULES_SOURCE },
  });
});
beforeEach(async () => { await env.clearStorage(); });
after(async () => { await env.cleanup(); });

test('el dueño verificado puede subir, leer, reemplazar y borrar su JPEG', async () => {
  const logo = storageFor('alice').ref('logos/alice/logo.jpg');
  await assertSucceeds(logo.putString('jpeg-data', 'raw', { contentType: 'image/jpeg' }));
  await assertSucceeds(logo.getMetadata());
  await assertSucceeds(logo.putString('new-jpeg-data', 'raw', { contentType: 'image/jpeg' }));
  await assertSucceeds(logo.delete());
});
test('otro usuario, un usuario no verificado y un anónimo no pueden leer el logo', async () => {
  const ownerLogo = storageFor('alice').ref('logos/alice/logo.jpg');
  await ownerLogo.putString('jpeg-data', 'raw', { contentType: 'image/jpeg' });

  await assertFails(storageFor('bob').ref('logos/alice/logo.jpg').getMetadata());
  await assertFails(storageFor('alice', false).ref('logos/alice/logo.jpg').getMetadata());
  await assertFails(env.unauthenticatedContext().storage().ref('logos/alice/logo.jpg').getMetadata());
});

test('rechaza tipo MIME, tamaño y rutas no permitidas', async () => {
  const storage = storageFor('alice');
  await assertFails(
    storage.ref('logos/alice/logo.jpg').putString('not-an-image', 'raw', { contentType: 'text/plain' })
  );
  await assertFails(
    storage.ref('logos/alice/logo.jpg').putString('x'.repeat(5 * 1024 * 1024 + 1), 'raw', {
      contentType: 'image/jpeg',
    })
  );
  await assertFails(
    storage.ref('logos/alice/otro.jpg').putString('jpeg-data', 'raw', { contentType: 'image/jpeg' })
  );
});
