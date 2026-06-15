import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase.config';

/**
 * Baja un usuario a plan Demo.
 * - Calcula los días Pro restantes antes de bajar.
 * - Los guarda en proRemainingDays para poder restaurarlos.
 * - Limpia proExpiresAt para evitar datos stale.
 * - Si el usuario no tiene proExpiresAt (legacy sin fecha), remainingDays = 0.
 */
export async function setUserDemo(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  const data = snap.data() ?? {};

  const now = new Date();
  let remainingDays = 0;

  const isPro = data.pro === true || data.planType === 'pro';
  if (isPro && data.proExpiresAt) {
    const expiresAt = data.proExpiresAt.toDate
      ? data.proExpiresAt.toDate()
      : new Date(data.proExpiresAt);
    if (expiresAt > now) {
      remainingDays = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
    }
  }

  await updateDoc(doc(db, 'users', uid), {
    planType: 'demo',
    pro: false,
    proExpiresAt: null,
    proRemainingDays: remainingDays > 0 ? remainingDays : null,
    quoteLimit: data.quoteLimit ?? 3,
    planUpdatedAt: serverTimestamp(),
  });
}

export async function suspendUser(uid) {
  await updateDoc(doc(db, 'users', uid), {
    enabled: false,
    suspendedAt: serverTimestamp(),
  });
}

export async function reactivateUser(uid) {
  await updateDoc(doc(db, 'users', uid), {
    enabled: true,
    suspendedAt: null,
  });
}

export async function updateUserQuoteLimit(uid, limit) {
  await updateDoc(doc(db, 'users', uid), {
    quoteLimit: Number(limit),
    planUpdatedAt: serverTimestamp(),
  });
}

/**
 * Activa o extiende Pro por N días.
 * - Si el usuario ya tiene Pro vigente → extiende desde proExpiresAt actual.
 * - Si está en Demo o Pro vencido → comienza desde ahora.
 * - Limpia proRemainingDays (el admin eligió período nuevo, no restaurar).
 * - Solo escribe proActivatedAt si no existe todavía (no pisar fecha original).
 *
 * @param {string} uid
 * @param {number} days — 30 | 180 | 365
 */
export async function activateUserProWithDuration(uid, days) {
  const snap = await getDoc(doc(db, 'users', uid));
  const data = snap.data() ?? {};

  const now = new Date();
  let baseDate = now;

  const isPro = data.pro === true || data.planType === 'pro';
  if (isPro && data.proExpiresAt) {
    const currentExpiry = data.proExpiresAt.toDate
      ? data.proExpiresAt.toDate()
      : new Date(data.proExpiresAt);
    if (currentExpiry > now) {
      baseDate = currentExpiry;
    }
  }

  const newExpiry = new Date(baseDate);
  newExpiry.setDate(newExpiry.getDate() + days);

  const updateData = {
    planType: 'pro',
    pro: true,
    enabled: true,
    proExpiresAt: Timestamp.fromDate(newExpiry),
    proRemainingDays: null,
    planUpdatedAt: serverTimestamp(),
  };

  if (!data.proActivatedAt) {
    updateData.proActivatedAt = serverTimestamp();
  }

  await updateDoc(doc(db, 'users', uid), updateData);
}

/**
 * Restaura el plan Pro usando exactamente los días guardados en proRemainingDays.
 * - Usa solo cuando el admin elige "Restaurar días guardados".
 * - Limpia proRemainingDays después de restaurar.
 * - Lanza error si no hay días guardados (no debería llamarse en ese caso).
 *
 * @param {string} uid
 */
export async function restoreProFromSavedDays(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  const data = snap.data() ?? {};

  const remaining = data.proRemainingDays ?? 0;
  if (remaining <= 0) {
    throw new Error('No hay días guardados para restaurar.');
  }

  const now = new Date();
  const newExpiry = new Date(now.getTime() + remaining * 24 * 60 * 60 * 1000);

  const updateData = {
    planType: 'pro',
    pro: true,
    enabled: true,
    proExpiresAt: Timestamp.fromDate(newExpiry),
    proRemainingDays: null,
    planUpdatedAt: serverTimestamp(),
  };

  if (!data.proActivatedAt) {
    updateData.proActivatedAt = serverTimestamp();
  }

  await updateDoc(doc(db, 'users', uid), updateData);
}
