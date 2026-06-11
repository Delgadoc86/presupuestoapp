import { Linking, Alert } from 'react-native';

const SUPPORT_EMAIL = 'delgadocdev@hotmail.com';

export function openUpgradeEmail(userEmail) {
  const subject = 'Activar PresúFácil Pro';
  const body = `Hola Cristian, quiero activar PresúFácil Pro para mi cuenta: ${userEmail ?? ''}`;
  _openEmail(subject, body);
}

export function openSuspendedEmail(userEmail) {
  const subject = 'Reactivar cuenta PresúFácil';
  const body = `Hola Cristian, mi cuenta está suspendida. Mi email es: ${userEmail ?? ''}`;
  _openEmail(subject, body);
}

function _openEmail(subject, body) {
  const url =
    `mailto:${SUPPORT_EMAIL}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;
  Linking.openURL(url).catch(() =>
    Alert.alert(
      'No se pudo abrir el email',
      `Escribinos directamente a ${SUPPORT_EMAIL}`
    )
  );
}
