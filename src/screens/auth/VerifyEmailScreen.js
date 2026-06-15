import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppButton from '../../components/common/AppButton';
import AppLoader from '../../components/common/AppLoader';
import { logout, sendVerificationEmail } from '../../services/auth.service';
import { useAuthContext } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { colors } from '../../theme/colors';

const COOLDOWN_SECONDS = 60;

export default function VerifyEmailScreen() {
  const { user, reloadUser } = useAuthContext();
  const { showSnackbar } = useAppContext();

  const [checking, setChecking] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleCheck() {
    setChecking(true);
    try {
      const verified = await reloadUser();
      if (!verified) {
        showSnackbar('Aún no detectamos la verificación del correo.', 'error');
      }
      // Si verified === true, AuthContext actualiza emailVerified
      // y AppNavigator redirige automáticamente
    } catch {
      showSnackbar('No se pudo verificar. Revisá tu conexión.', 'error');
    } finally {
      setChecking(false);
    }
  }

  async function handleResend() {
    try {
      await sendVerificationEmail();
      setCooldown(COOLDOWN_SECONDS);
      showSnackbar('Correo de verificación enviado.', 'success');
    } catch {
      showSnackbar('No se pudo enviar. Intentá de nuevo más tarde.', 'error');
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    // Si logout() tiene éxito, onAuthStateChanged desmonta este componente
    // antes de que llegue el finally — no llamamos setLoggingOut(false) en ese caso.
    // Si falla, reseteamos el estado para que el botón vuelva a ser usable.
    await logout().catch(() => setLoggingOut(false));
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppLoader visible={checking || loggingOut} />

      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons
            name="email-check-outline"
            size={56}
            color={colors.primary}
          />
        </View>

        <Text variant="headlineSmall" style={styles.title}>
          Verificá tu correo
        </Text>

        <Text variant="bodyMedium" style={styles.body}>
          Te enviamos un correo de verificación.{'\n'}
          Abrí el enlace enviado a{' '}
          <Text style={styles.email}>{user?.email}</Text>
          {' '}y luego volvé a esta aplicación.
        </Text>

        <Text variant="bodySmall" style={styles.spam}>
          Revisá también Spam o Correo no deseado.
        </Text>

        <View style={styles.actions}>
          <AppButton onPress={handleCheck} loading={checking}>
            Ya verifiqué mi correo
          </AppButton>

          <AppButton
            mode="outlined"
            onPress={handleResend}
            disabled={cooldown > 0}
          >
            {cooldown > 0 ? `Reenviar email (${cooldown}s)` : 'Reenviar email'}
          </AppButton>

          <AppButton
            mode="text"
            onPress={handleLogout}
            loading={loggingOut}
          >
            Cerrar sesión
          </AppButton>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  email: {
    fontWeight: '700',
    color: colors.text,
  },
  spam: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actions: {
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
});
