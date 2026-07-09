import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { logError } from '../utils/errorUtils';

const UPDATE_DOC_REF = doc(db, 'appConfig', 'updateInfo');

/**
 * Lee la configuración de aviso de actualización.
 * Lectura pública (ver firestore.rules) — no requiere sesión iniciada.
 * @returns {Promise<object|null>} null si el documento no existe aún.
 */
export async function getUpdateInfo() {
  try {
    const snap = await getDoc(UPDATE_DOC_REF);
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    logError('getUpdateInfo', error);
    return null;
  }
}

/**
 * Guarda la configuración de aviso de actualización. Solo admin (ver firestore.rules).
 * @param {{ active: boolean, latestVersion: string, title: string, message: string, downloadUrl: string }} data
 * @param {boolean} isNew — true si el documento no existía (para setear createdAt una sola vez).
 */
export async function saveUpdateInfo(data, isNew) {
  try {
    await setDoc(UPDATE_DOC_REF, {
      active: data.active,
      latestVersion: data.latestVersion,
      title: data.title,
      message: data.message,
      downloadUrl: data.downloadUrl,
      updatedAt: serverTimestamp(),
      ...(isNew ? { createdAt: serverTimestamp() } : {}),
    }, { merge: true });
  } catch (error) {
    logError('saveUpdateInfo', error);
    throw error;
  }
}
