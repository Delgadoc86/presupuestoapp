import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import AppLoader from '../../components/common/AppLoader';
import { resetPassword, getAuthErrorMessage } from '../../services/auth.service';
import { useAppContext } from '../../context/AppContext';
import { colors } from '../../theme/colors';

export default function ForgotPasswordScreen({ navigation }) {
  const theme = useTheme();
  const { showSnackbar } = useAppContext();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function validate() {
    const trimmed = email.trim();
    if (!trimmed) { setEmailError('Ingresá tu email'); return false; }
    if (!/\S+@\S+\.\S+/.test(trimmed)) { setEmailError('El email no es válido'); return false; }
    setEmailError(null);
    return true;
  }

  async function handleSend() {
    if (!validate()) return;
    setLoading(true);
    try {
      await resetPassword(email.trim());
    } catch (error) {
      // Solo mostramos error en fallas de red u operacionales.
      // auth/user-not-found ya lo absorbe resetPassword() en el servicio.
      // Siempre mostramos el estado de éxito para evitar enumeración de usuarios.
      const code = error?.code;
      if (code === 'auth/network-request-failed') {
        setLoading(false);
        showSnackbar('Sin conexión. Verificá tu internet.', 'error');
        return;
      }
    } finally {
      setLoading(false);
    }
    setSent(true);
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppLoader visible={loading} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header con volver */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>

          {sent ? (
            // Estado: email enviado
            <View style={styles.successContainer}>
              <View style={[styles.iconCircle, { backgroundColor: `${colors.success}20` }]}>
                <MaterialCommunityIcons
                  name="email-check-outline"
                  size={48}
                  color={colors.success}
                />
              </View>
              <Text variant="headlineSmall" style={styles.title}>
                ¡Email enviado!
              </Text>
              <Text variant="bodyMedium" style={styles.successText}>
                Si existe una cuenta con el email{' '}
                <Text style={{ fontWeight: '600', color: colors.text }}>{email.trim()}</Text>
                {', '}recibirás un enlace para crear una nueva contraseña.{'\n\n'}
                Revisá también tu carpeta de Spam o Correo no deseado.
              </Text>
              <AppButton
                onPress={() => navigation.navigate('Login')}
                mode="outlined"
                style={styles.backToLogin}
              >
                Volver al inicio de sesión
              </AppButton>
            </View>
          ) : (
            // Estado: formulario
            <>
              <View style={styles.header}>
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
                  <MaterialCommunityIcons
                    name="lock-reset"
                    size={40}
                    color={theme.colors.primary}
                  />
                </View>
                <Text variant="headlineSmall" style={styles.title}>
                  Recuperar contraseña
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                  Ingresá tu email y te enviamos un enlace para crear una nueva contraseña.
                </Text>
              </View>

              <View style={styles.form}>
                <AppInput
                  label="Email"
                  value={email}
                  onChangeText={t => { setEmail(t); setEmailError(null); }}
                  error={emailError}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSend}
                />

                <AppButton onPress={handleSend} loading={loading}>
                  Enviar enlace de recuperación
                </AppButton>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 4,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  header: {
    gap: 16,
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    gap: 16,
  },
  successContainer: {
    gap: 20,
    alignItems: 'center',
  },
  successText: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  backToLogin: {
    width: '100%',
    marginTop: 8,
  },
});
