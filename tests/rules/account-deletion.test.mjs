import { test, before, beforeEach, after } from 'node:test';
import {
  createEnv, authedDb, seedUser, seedClient, freshUserDoc, freshClientDoc,
  assertFails, doc, setDoc, updateDoc, deleteDoc, serverTimestamp,
} from './setup.mjs';

let env;

before(async () => { env = await createEnv('accountdeletion'); });
beforeEach(async () => {
  await env.clearFirestore();
  await seedUser(env, 'alice', freshUserDoc('alice', { deletionPending: true }));
  await seedClient(env, 'client1', freshClientDoc('alice'));
});
after(async () => { await env.cleanup(); });

test('el marcador de borrado bloquea nuevas escrituras del usuario', async () => {
  const db = authedDb(env, 'alice');

  await assertFails(setDoc(doc(db, 'clients', 'client2'), freshClientDoc('alice')));
  await assertFails(updateDoc(doc(db, 'clients', 'client1'), {
    notes: 'escritura tardía',
    updatedAt: serverTimestamp(),
  }));
  await assertFails(deleteDoc(doc(db, 'clients', 'client1')));
  await assertFails(setDoc(doc(db, 'templates', 'template1'), {
    userId: 'alice',
    name: 'Plantilla tardía',
  }));
  await assertFails(updateDoc(doc(db, 'users', 'alice'), {
    businessName: 'Cambio tardío',
  }));
});
