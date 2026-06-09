import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme, Dialog, Portal, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppLoader from '../../components/common/AppLoader';
import { logout } from '../../services/auth.service';
import { useAuthContext } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { colors } from '../../theme/colors';

export default function AccountScreen({ navigation }) {
  const theme = useTheme();
  const { user } = useAuthContext();
  const { showSnackbar } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  async function handleLogout() {
    setConfirmVisible(false);
    setLoading(true);
    try {
      await logout();
      // AuthContext detecta el cambio y navega a Login automáticamente
    } catch (error) {
      showSnackbar('No se pudo cerrar sesión. Intentá de nuevo.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppLoader visible={loading} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="titleLarge" style={styles.headerTitle}>
          Mi cuenta
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
          <MaterialCommunityIcons name="account" size={48} color={theme.colors.primary} />
        </View>
        <Text variant="bodyMedium" style={styles.email}>
          {user?.email ?? ''}
        </Text>
      </View>

      {/* Acciones */}
      <View style={styles.content}>
        <Surface style={styles.card} elevation={1}>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => showSnackbar('Disponible en próxima actualización', 'info')}
          >
            <View style={[styles.rowIcon, { backgroundColor: `${colors.statusSent}18` }]}>
              <MaterialCommunityIcons name="lock-outline" size={22} color={colors.statusSent} />
            </View>
            <Text variant="bodyLarge" style={styles.rowLabel}>
              Cambiar contraseña
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </Surface>

        <Surface style={styles.card} elevation={1}>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => setConfirmVisible(true)}
          >
            <View style={[styles.rowIcon, { backgroundColor: `${colors.error}18` }]}>
              <MaterialCommunityIcons name="logout" size={22} color={colors.error} />
            </View>
            <Text variant="bodyLarge" style={[styles.rowLabel, { color: colors.error }]}>
              Cerrar sesión
            </Text>
          </TouchableOpacity>
        </Surface>
      </View>

      {/* Diálogo de confirmación */}
      <Portal>
        <Dialog
          visible={confirmVisible}
          onDismiss={() => setConfirmVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Cerrar sesión</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
              ¿Estás seguro que querés cerrar sesión?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmVisible(false)}>Cancelar</Button>
            <Button textColor={colors.error} onPress={handleLogout}>
              Cerrar sesión
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontWeight: '700',
    color: colors.text,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  email: {
    color: colors.textSecondary,
  },
  content: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    flex: 1,
    fontWeight: '600',
  },
  dialog: {
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
});
