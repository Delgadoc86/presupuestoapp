const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

initializeApp();

const MAX_AUTH_AGE_SECONDS = 5 * 60;
const DELETE_BATCH_SIZE = 400;

async function deleteOwnedCollection(db, collectionName, uid) {
  while (true) {
    const snapshot = await db
      .collection(collectionName)
      .where('userId', '==', uid)
      .limit(DELETE_BATCH_SIZE)
      .get();

    if (snapshot.empty) return;

    const batch = db.batch();
    snapshot.docs.forEach((document) => batch.delete(document.ref));
    await batch.commit();
  }
}

// Solo-lectura: no escribe nada en users/ ni quotes/. Le da al panel admin
// datos que Firestore no puede exponerle vía reglas de cliente (lastSignInTime
// vive en Auth, no en Firestore; y las reglas de quotes no dejan al admin leer
// presupuestos ajenos). Bypassa reglas porque corre con el Admin SDK.
exports.getAdminUserStats = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debés iniciar sesión.');
  }

  const db = getFirestore();
  const callerIsAdmin = (await db.doc(`admins/${request.auth.uid}`).get()).exists;
  if (!callerIsAdmin) {
    throw new HttpsError('permission-denied', 'Solo un administrador puede ver estas estadísticas.');
  }

  const usersSnap = await db.collection('users').select().get();
  const uids = usersSnap.docs.map((d) => d.id);

  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const stats = {};
  await Promise.all(
    uids.map(async (uid) => {
      const [authUser, countSnap] = await Promise.all([
        getAuth().getUser(uid).catch(() => null),
        db.collection('quotes')
          .where('userId', '==', uid)
          .where('createdAt', '>=', startOfMonth)
          .count()
          .get(),
      ]);
      stats[uid] = {
        lastLoginAt: authUser?.metadata?.lastSignInTime ?? null,
        quotesThisMonth: countSnap.data().count,
      };
    })
  );

  return stats;
});

exports.deleteCurrentUserAccount = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debés iniciar sesión para eliminar la cuenta.');
  }
  if (request.auth.token.email_verified !== true) {
    throw new HttpsError('failed-precondition', 'Primero debés verificar tu email.');
  }

  const authTime = Number(request.auth.token.auth_time);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(authTime) || now - authTime > MAX_AUTH_AGE_SECONDS) {
    throw new HttpsError('unauthenticated', 'Volvé a autenticarte antes de eliminar la cuenta.');
  }

  const uid = request.auth.uid;
  const db = getFirestore();

  // Bloquea nuevas escrituras del cliente antes de empezar la limpieza. Las
  // reglas consultan este marcador, cerrando carreras con dispositivos viejos.
  await db.doc(`users/${uid}`).set({ deletionPending: true }, { merge: true });

  await Promise.all([
    deleteOwnedCollection(db, 'quotes', uid),
    deleteOwnedCollection(db, 'templates', uid),
    deleteOwnedCollection(db, 'clients', uid),
  ]);

  await db.doc(`businessProfiles/${uid}`).delete();

  await getStorage()
    .bucket()
    .file(`logos/${uid}/logo.jpg`)
    .delete({ ignoreNotFound: true });

  // El documento users conserva el marcador hasta que Auth ya fue eliminado.
  // Así cualquier fallo previo deja una cuenta autenticable que puede reintentar.
  await getAuth().deleteUser(uid);
  await db.doc(`users/${uid}`).delete();
  return { deleted: true };
});
