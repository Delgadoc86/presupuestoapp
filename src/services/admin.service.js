import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase.config';

export async function activateUserPro(uid) {
  await updateDoc(doc(db, 'users', uid), {
    planType: 'pro',
    pro: true,
    enabled: true,
    planUpdatedAt: serverTimestamp(),
  });
}

export async function setUserDemo(uid) {
  await updateDoc(doc(db, 'users', uid), {
    planType: 'demo',
    pro: false,
    quoteLimit: 3,
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
 * Activa Pro por N días.
 * - Si el usuario ya tiene Pro vigente → extiende desde proExpiresAt actual.
 * - Si está en Demo o Pro vencido → comienza desde ahora.
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

  await updateDoc(doc(db, 'users', uid), {
    planType: 'pro',
    pro: true,
    enabled: true,
    proActivatedAt: serverTimestamp(),
    proExpiresAt: Timestamp.fromDate(newExpiry),
    planUpdatedAt: serverTimestamp(),
  });
}
