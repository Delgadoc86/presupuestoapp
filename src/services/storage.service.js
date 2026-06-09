import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../firebase.config';

/**
 * Sube el logo del negocio a Firebase Storage y retorna la URL pública.
 *
 * Flujo:
 *  1. fetch(localUri)  → convierte el URI local (file://) en un Blob nativo de React Native.
 *  2. uploadBytes()    → sube el Blob a Storage. Se usa en lugar de uploadString+base64
 *     porque FileSystem.EncodingType es undefined en la New Architecture (SDK 54+).
 *  3. getDownloadURL() → obtiene la URL pública permanente del archivo subido.
 *  4. blob.close()     → libera la referencia nativa de Android para evitar memory leaks.
 *
 * La ruta en Storage es: logos/{userId}/logo.jpg
 * Sobreescribe el logo anterior si ya existía (mismo path).
 *
 * @param {string} userId   - UID del usuario autenticado.
 * @param {string} localUri - URI local devuelto por expo-image-picker (file://...).
 * @returns {Promise<string>} URL pública de descarga del logo.
 * @throws {Error} Si fetch, upload o getDownloadURL fallan.
 */
export async function uploadLogo(userId, localUri) {
  const logoRef = ref(storage, `logos/${userId}/logo.jpg`);
  let blob;

  try {
    const response = await fetch(localUri);
    blob = await response.blob();

    const snapshot = await uploadBytes(logoRef, blob, { contentType: 'image/jpeg' });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error('Error subiendo logo a Firebase Storage:', error);
    throw error;
  } finally {
    // blob.close() es una API específica de React Native (no existe en Web).
    // Libera la memoria nativa del Blob en Android.
    if (blob && typeof blob.close === 'function') {
      blob.close();
    }
  }
}

/**
 * Elimina el logo del negocio de Firebase Storage.
 * Si el archivo no existe, el error se ignora silenciosamente (deleteObject
 * lanza si el path no existe, pero no es un error crítico para el usuario).
 *
 * @param {string} userId - UID del usuario autenticado.
 * @returns {Promise<void>}
 */
export async function deleteLogo(userId) {
  const logoRef = ref(storage, `logos/${userId}/logo.jpg`);
  await deleteObject(logoRef).catch((error) => {
    console.warn('Error eliminando logo de Storage:', error);
  });
}
