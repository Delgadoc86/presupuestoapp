import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { timestampToDate, addDays } from '../utils/dateUtils';
import { isEffectivelyPro } from '../utils/planStatus';
import { APP_CONFIG } from '../config/appConfig';
import { logError } from '../utils/errorUtils';

/**
 * Baja un usuario a plan Demo.
 * - Calcula los días Pro restantes antes de bajar.
 * - Los guarda en proRemainingDays para poder restaurarlos.
 * - Limpia proExpiresAt para evitar datos stale.
 * - Si el usuario no tiene proExpiresAt (legacy sin fecha), remainingDays = 0.
 */
export async function setUserDemo(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    const data = snap.data() ?? {};

    let remainingDays = 0;
    if (isEffectivelyPro(data) && data.proExpiresAt) {
      const expiresAt = timestampToDate(data.proExpiresAt);
      if (expiresAt && expiresAt > new Date()) {
        remainingDays = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
      }
    }

    await updateDoc(doc(db, 'users', uid), {
      planType: 'demo',
      pro: false,
      proExpiresAt: null,
      proRemainingDays: remainingDays > 0 ? remainingDays : null,
      quoteLimit: data.quoteLimit ?? APP_CONFIG.demoQuoteLimit,
      planUpdatedAt: serverTimestamp(),
    });
  } catch (error) {
    logError('setUserDemo', error);
    throw error;
  }
}

export async function suspendUser(uid) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      enabled: false,
      suspendedAt: serverTimestamp(),
    });
  } catch (error) {
    logError('suspendUser', error);
    throw error;
  }
}

export async function reactivateUser(uid) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      enabled: true,
      suspendedAt: null,
    });
  } catch (error) {
    logError('reactivateUser', error);
    throw error;
  }
}

export async function updateUserQuoteLimit(uid, limit) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      quoteLimit: Number(limit),
      planUpdatedAt: serverTimestamp(),
    });
  } catch (error) {
    logError('updateUserQuoteLimit', error);
    throw error;
  }
}

/**
 * Activa o extiende Pro por N días.
 * - Si el usuario ya tiene Pro vigente → extiende desde proExpiresAt actual.
 * - Si está en Demo o Pro vencido → comienza desde ahora.
 * - Limpia proRemainingDays (el admin eligió período nuevo, no restaurar).
 * - Solo escribe proActivatedAt si no existe todavía (no pisar fecha original).
 *
 * @param {string} uid
 * @param {number} days — APP_CONFIG.proDurations.monthly | .halfYear | .yearly
 */
export async function activateUserProWithDuration(uid, days) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    const data = snap.data() ?? {};

    const now = new Date();
    let baseDate = now;

    if (isEffectivelyPro(data) && data.proExpiresAt) {
      const currentExpiry = timestampToDate(data.proExpiresAt);
      if (currentExpiry && currentExpiry > now) {
        baseDate = currentExpiry;
      }
    }

    const newExpiry = addDays(baseDate, days);

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
  } catch (error) {
    logError('activateUserProWithDuration', error);
    throw error;
  }
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
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    const data = snap.data() ?? {};

    const remaining = data.proRemainingDays ?? 0;
    if (remaining <= 0) {
      throw new Error('No hay días guardados para restaurar.');
    }

    const newExpiry = addDays(new Date(), remaining);

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
  } catch (error) {
    logError('restoreProFromSavedDays', error);
    throw error;
  }
}
