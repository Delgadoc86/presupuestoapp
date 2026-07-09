import React from 'react';
import { Linking, Alert } from 'react-native';
import { Dialog, Portal, Text, Button } from 'react-native-paper';
import { useAppUpdateCheck } from '../../hooks/useAppUpdateCheck';
import { colors } from '../../theme/colors';

export default function UpdateModal() {
  const { shouldShowUpdate, title, message, downloadUrl, dismiss } = useAppUpdateCheck();

  function handleUpdatePress() {
    Linking.openURL(downloadUrl).catch(() =>
      Alert.alert('No se pudo abrir el enlace', 'Intentá de nuevo más tarde.')
    );
  }

  return (
    <Portal>
      <Dialog visible={shouldShowUpdate} onDismiss={dismiss} dismissable={false}>
        <Dialog.Title>{title || 'Nueva actualización disponible'}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={dismiss} textColor={colors.textSecondary}>
            Ahora no
          </Button>
          <Button onPress={handleUpdatePress} mode="contained">
            Actualizar ahora
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
