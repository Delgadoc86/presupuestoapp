import { Linking, Alert } from 'react-native';
import { APP_CONFIG } from '../config/appConfig';

export function openUpgradeEmail(userEmail) {
  const subject = `Activar ${APP_CONFIG.appName} Pro`;
  const body = `Hola Cristian, quiero activar ${APP_CONFIG.appName} Pro para mi cuenta: ${userEmail ?? ''}`;
  _openEmail(subject, body);
}

export function openSuspendedEmail(userEmail) {
  const subject = `Reactivar cuenta ${APP_CONFIG.appName}`;
  const body = `Hola Cristian, mi cuenta está suspendida. Mi email es: ${userEmail ?? ''}`;
  _openEmail(subject, body);
}

export function openSupportEmail(subject, body) {
  _openEmail(subject, body);
}

function _openEmail(subject, body) {
  const url =
    `mailto:${APP_CONFIG.supportEmail}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;
  Linking.openURL(url).catch(() =>
    Alert.alert(
      'No se pudo abrir el email',
      `Escribinos directamente a ${APP_CONFIG.supportEmail}`
    )
  );
}
