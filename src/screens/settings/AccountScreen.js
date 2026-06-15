import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import {
  Text,
  Surface,
  useTheme,
  Dialog,
  Portal,
  Button,
  TextInput as PaperTextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppLoader from '../../components/common/AppLoader';
import {
  logout,
  reauthenticateWithPassword,
  deleteCurrentUserAccount,
} from '../../services/auth.service';
import { useAuthContext } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { colors } from '../../theme/colors';

// Códigos que Firebase devuelve para contraseña incorrecta
const WRONG_PASSWORD_CODES = new Set([
  'auth/wrong-password',
  'auth/invalid-credential',
  'auth/invalid-login-credentials',
]);

export default function AccountScreen({ navigation }) {
  const theme = useTheme();
  const { user } = useAuthContext();
  const { showSnackbar } = useAppContext();

  const [loading, setLoading] = useState(false);

  // Estado: diálogo cerrar sesión
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  // Estado: diálogo reautenticación para eliminar cuenta
  const [reauthDialogVisible, setReauthDialogVisible] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthPasswordVisible, setReauthPasswordVisible] = useState(false);
  const [reauthError, setReauthError] = useState('');
  const [reauthLoading, setReauthLoading] = useState(false);

  // ── Cerrar sesión ────────────────────────────────────────────────────────────

  async function handleLogout() {
    setLogoutDialogVisible(false);
    setLoading(true);
    try {
      await logout();
    } catch {
      showSnackbar('No se pudo cerrar sesión. Intentá de nuevo.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ── Eliminar cuenta — flujo ──────────────────────────────────────────────────
  //
  // Paso 1: Alert informativo
  // Paso 2: Alert confirmación final
  // Paso 3: Diálogo reautenticación (ANTES de borrar cualquier dato)
  // Paso 4: Solo si reauth OK → deleteCurrentUserAccount()

  function confirmDeleteStep1() {
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción eliminará tu cuenta, negocio, presupuestos, plantillas, logo y archivos asociados.\n\nNo se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar', onPress: confirmDeleteStep2 },
      ]
    );
  }

  function confirmDeleteStep2() {
    Alert.alert(
      'Confirmación final',
      'Una vez eliminada la cuenta, no podrás recuperar tus datos por ningún medio.\n\n¿Querés eliminar definitivamente tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar definitivamente', style: 'destructive', onPress: openReauthDialog },
      ]
    );
  }

  function openReauthDialog() {
    const providerId = user?.providerData?.[0]?.providerId;

    if (providerId === 'google.com') {
      // Google Sign-In no está implementado aún → aviso claro sin borrar nada
      Alert.alert(
        'Cuenta de Google',
        'Para eliminar una cuenta de Google, cerrá sesión, volvé a iniciar sesión con Google y repetí el proceso. Esto garantiza que la eliminación sea segura.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Cerrar sesión ahora', onPress: () => logout() },
        ]
      );
      return;
    }

    // email/password: mostrar diálogo con campo de contraseña
    setReauthPassword('');
    setReauthPasswordVisible(false);
    setReauthError('');
    setReauthDialogVisible(true);
  }

  async function handleReauthAndDelete() {
    if (!reauthPassword.trim()) {
      setReauthError('Ingresá tu contraseña para continuar');
      return;
    }

    setReauthLoading(true);
    setReauthError('');

    try {
      // Reautenticar primero — si falla aquí, no se borra ningún dato
      await reauthenticateWithPassword(user.email, reauthPassword);
    } catch (reauthErr) {
      setReauthLoading(false);
      if (WRONG_PASSWORD_CODES.has(reauthErr?.code)) {
        setReauthError('Contraseña incorrecta');
      } else if (reauthErr?.code === 'auth/too-many-requests') {
        setReauthError('Demasiados intentos. Esperá unos minutos e intentá de nuevo.');
      } else {
        setReauthError('Error al verificar. Revisá tu conexión e intentá de nuevo.');
      }
      return; // no continuar con el borrado
    }

    // Reauth exitosa → cerrar diálogo y borrar cuenta
    setReauthDialogVisible(false);
    setLoading(true);

    try {
      await deleteCurrentUserAccount();
      // onAuthStateChanged dispara → AppNavigator muestra AuthNavigator
    } catch {
      showSnackbar('No se pudo eliminar la cuenta. Intentá de nuevo.', 'error');
    } finally {
      setReauthLoading(false);
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

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
            onPress={() => setLogoutDialogVisible(true)}
          >
            <View style={[styles.rowIcon, { backgroundColor: `${colors.error}18` }]}>
              <MaterialCommunityIcons name="logout" size={22} color={colors.error} />
            </View>
            <Text variant="bodyLarge" style={[styles.rowLabel, { color: colors.error }]}>
              Cerrar sesión
            </Text>
          </TouchableOpacity>
        </Surface>

        {/* Zona de peligro */}
        <View style={styles.dangerSection}>
          <Text variant="labelMedium" style={styles.dangerLabel}>
            ZONA DE PELIGRO
          </Text>
          <Surface style={styles.dangerCard} elevation={0}>
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={confirmDeleteStep1}
            >
              <View style={[styles.rowIcon, { backgroundColor: `${colors.error}12` }]}>
                <MaterialCommunityIcons
                  name="account-remove-outline"
                  size={22}
                  color={colors.error}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyLarge" style={[styles.rowLabel, { color: colors.error }]}>
                  Eliminar cuenta
                </Text>
                <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                  Borra todos tus datos permanentemente
                </Text>
              </View>
            </TouchableOpacity>
          </Surface>
        </View>
      </View>

      <Portal>
        {/* Diálogo — cerrar sesión */}
        <Dialog
          visible={logoutDialogVisible}
          onDismiss={() => setLogoutDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Cerrar sesión</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
              ¿Estás seguro que querés cerrar sesión?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)}>Cancelar</Button>
            <Button textColor={colors.error} onPress={handleLogout}>
              Cerrar sesión
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Diálogo — reautenticación antes de eliminar cuenta */}
        <Dialog
          visible={reauthDialogVisible}
          onDismiss={() => !reauthLoading && setReauthDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Confirmar identidad</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.reauthSubtitle}>
              Por seguridad, ingresá tu contraseña antes de eliminar la cuenta.
            </Text>
            <PaperTextInput
              mode="outlined"
              label="Contraseña"
              value={reauthPassword}
              onChangeText={text => {
                setReauthPassword(text);
                setReauthError('');
              }}
              secureTextEntry={!reauthPasswordVisible}
              right={
                <PaperTextInput.Icon
                  icon={reauthPasswordVisible ? 'eye-off' : 'eye'}
                  onPress={() => setReauthPasswordVisible(v => !v)}
                />
              }
              error={!!reauthError}
              autoFocus
              disabled={reauthLoading}
              style={styles.reauthInput}
              outlineColor={colors.border}
              activeOutlineColor={colors.error}
            />
            {reauthError ? (
              <Text variant="bodySmall" style={styles.reauthErrorText}>
                {reauthError}
              </Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              disabled={reauthLoading}
              onPress={() => setReauthDialogVisible(false)}
            >
              Cancelar
            </Button>
            <Button
              textColor={colors.error}
              loading={reauthLoading}
              disabled={reauthLoading}
              onPress={handleReauthAndDelete}
            >
              Eliminar
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
  dangerSection: {
    marginTop: 12,
    gap: 8,
  },
  dangerLabel: {
    color: colors.error,
    letterSpacing: 0.8,
    paddingHorizontal: 4,
    opacity: 0.8,
  },
  dangerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.error}30`,
  },
  dialog: {
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  reauthSubtitle: {
    color: colors.textSecondary,
    marginBottom: 16,
  },
  reauthInput: {
    backgroundColor: colors.surface,
  },
  reauthErrorText: {
    color: colors.error,
    marginTop: 6,
    marginLeft: 4,
  },
});
