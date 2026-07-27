import { Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { buildQuoteHTML } from '../utils/pdfTemplate';
import { normalizePhoneForWhatsApp, isValidWhatsAppPhone } from '../utils/whatsappMessage';
import { logError } from '../utils/errorUtils';

// La normalización del teléfono vive en una utilidad pura para poder probarla
// con Node; este archivo concentra la generación y el uso compartido del PDF.

export function sanitizeFileName(str) {
  return (str ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
}

export function formatQuoteFileNumber(quoteNumber) {
  return String(quoteNumber ?? 0).padStart(4, '0');
}

export function getQuotePdfFileName(quote) {
  const business = sanitizeFileName(quote.business?.businessName);
  const num = formatQuoteFileNumber(quote.quoteNumber);
  const prefix = business || 'Presupuesto';
  return prefix + '_presupuesto_' + num + '.pdf';
}

/**
 * Descarga una URL remota y la convierte a data URI base64.
 * Devuelve null si falla (la URL no es accesible, sin internet, etc.)
 */
async function getLogoBase64(logoUrl) {
  if (!logoUrl) return null;
  try {
    const localUri = `${FileSystem.cacheDirectory}pf_logo_tmp`;
    await FileSystem.downloadAsync(logoUrl, localUri);
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64}`;
  } catch {
    return null;
  }
}

/**
 * Funcion base: genera el PDF y lo copia a documentDirectory con nombre profesional.
 * Devuelve { finalUri, fileName } para que las funciones de accion lo usen.
 */
export async function generateQuotePdfFile(quote, business) {
  const effectiveBusiness = business ?? quote?.business;
  const quoteWithBusiness = effectiveBusiness
    ? { ...quote, business: effectiveBusiness }
    : quote;

  // Convierte el logo a base64 para que expo-print pueda renderizarlo
  const logoBase64 = await getLogoBase64(effectiveBusiness?.logoUrl);
  const quoteForHtml = logoBase64
    ? { ...quoteWithBusiness, business: { ...effectiveBusiness, logoUrl: logoBase64 } }
    : quoteWithBusiness;

  const html = buildQuoteHTML(quoteForHtml);
  const fileName = getQuotePdfFileName(quoteWithBusiness);

  const { uri: tempUri } = await Print.printToFileAsync({ html });

  const finalUri = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.copyAsync({ from: tempUri, to: finalUri });

  const fileInfo = await FileSystem.getInfoAsync(finalUri);
  if (!fileInfo.exists) {
    throw new Error(`No se pudo crear el archivo en: ${finalUri}`);
  }

  return { finalUri, fileName };
}

/** Abre el share sheet del sistema (WhatsApp, Gmail, Drive, etc.). */
export async function shareQuotePdf(quote, business) {
  const { finalUri, fileName } = await generateQuotePdfFile(quote, business);

  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('El dispositivo no permite compartir archivos');

  await Sharing.shareAsync(finalUri, {
    mimeType: 'application/pdf',
    dialogTitle: fileName,
    UTI: 'com.adobe.pdf',
  });
}

function sharingError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function getNativeShareModule() {
  try {
    // Carga diferida: la app sigue abriendo en Expo Go, aunque el envío
    // directo requiere un APK/AAB nuevo que incluya este módulo nativo.
    const nativeShare = require('react-native-share');
    return nativeShare.default ?? nativeShare;
  } catch (error) {
    logError('pdf.getNativeShareModule', error);
    throw sharingError(
      'native_share_unavailable',
      'Esta instalación no incluye el envío directo por WhatsApp'
    );
  }
}

async function isWhatsAppPackageInstalled(nativeShare, packageName) {
  try {
    const result = await nativeShare.isPackageInstalled(packageName);
    return result?.isInstalled === true;
  } catch {
    return false;
  }
}

async function resolveWhatsAppSocial(nativeShare) {
  if (Platform.OS !== 'android') return nativeShare.Social.WHATSAPP;

  if (await isWhatsAppPackageInstalled(nativeShare, 'com.whatsapp')) {
    return nativeShare.Social.WHATSAPP;
  }
  if (await isWhatsAppPackageInstalled(nativeShare, 'com.whatsapp.w4b')) {
    return nativeShare.Social.WHATSAPPBUSINESS;
  }

  throw sharingError('whatsapp_not_installed', 'WhatsApp no está instalado');
}

/**
 * Genera el PDF y abre el chat del número indicado con el archivo adjunto.
 * En Android usa la integración nativa de WhatsApp/WhatsApp Business. No se
 * agrega texto porque WhatsApp no admite de forma confiable texto + archivo
 * en la misma intención de compartir.
 */
export async function shareQuotePdfToWhatsApp(quote, business, phone) {
  if (!isValidWhatsAppPhone(phone)) {
    throw sharingError('invalid_whatsapp_phone', 'El teléfono no es válido para WhatsApp');
  }

  // iOS no permite dirigir de forma confiable un adjunto a un número. Se
  // conserva allí el selector nativo de archivos como alternativa segura.
  if (Platform.OS !== 'android') {
    await shareQuotePdf(quote, business);
    return { directToClient: false };
  }

  const nativeShare = getNativeShareModule();
  const social = await resolveWhatsAppSocial(nativeShare);
  const { finalUri, fileName } = await generateQuotePdfFile(quote, business);

  // react-native-share necesita una ruta de caché accesible por FileProvider
  // en Android reciente. El nombre final se conserva para el adjunto.
  const shareUri = `${FileSystem.cacheDirectory}${Date.now()}_${fileName}`;
  await FileSystem.copyAsync({ from: finalUri, to: shareUri });

  await nativeShare.shareSingle({
    title: fileName,
    social,
    whatsAppNumber: normalizePhoneForWhatsApp(phone),
    url: shareUri,
    type: 'application/pdf',
    filename: fileName,
    useInternalStorage: true,
  });

  return { directToClient: true };
}

/** Abre el dialogo de impresion del sistema. No usa Sharing. */
export async function printQuotePdf(quote, business) {
  const { finalUri } = await generateQuotePdfFile(quote, business);
  await Print.printAsync({ uri: finalUri });
}

/** Guarda el PDF en documentDirectory. No abre ninguna app externa. */
export async function saveQuotePdfLocally(quote, business) {
  const { fileName } = await generateQuotePdfFile(quote, business);
  Alert.alert('PDF guardado', `El PDF quedo guardado en la app.\n\n${fileName}`);
}
