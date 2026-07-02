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

import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import AppLoader from '../../components/common/AppLoader';
import { loginWithEmail, getAuthErrorMessage } from '../../services/auth.service';
import { useAppContext } from '../../context/AppContext';
import { openSupportEmail } from '../../utils/contactHelper';
import { colors } from '../../theme/colors';

export default function LoginScreen({ navigation }) {
  const theme = useTheme();
  const { showSnackbar } = useAppContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function clearFieldError(field) {
    setErrors(prev => ({ ...prev, [field]: null }));
  }

  function validate() {
    const next = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) next.email = 'Ingresá tu email';
    else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) next.email = 'El email no es válido';
    if (!password) next.password = 'Ingresá tu contraseña';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      await loginWithEmail(email.trim(), password);
      // AuthContext detecta el cambio y navega automáticamente
    } catch (error) {
      showSnackbar(getAuthErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
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
          {/* Marca */}
          <View style={styles.brand}>
            <View style={[styles.logo, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.logoText}>PF</Text>
            </View>
            <Text variant="headlineMedium" style={styles.appName}>
              PresuFácil
            </Text>
            <Text variant="bodyMedium" style={styles.tagline}>
              Presupuestos profesionales en segundos
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <Text variant="titleLarge" style={styles.formTitle}>
              Iniciá sesión
            </Text>

            <AppInput
              label="Email"
              value={email}
              onChangeText={t => { setEmail(t); clearFieldError('email'); }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={handleLogin}
            />

            <AppInput
              label="Contraseña"
              value={password}
              onChangeText={t => { setPassword(t); clearFieldError('password'); }}
              error={errors.password}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotLink}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

            <AppButton onPress={handleLogin} loading={loading}>
              Iniciar sesión
            </AppButton>
          </View>

          {/* Pie: ir a registro */}
          <View style={styles.footer}>
            <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
              ¿No tenés cuenta?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.primary, fontWeight: '600' }}
              >
                Registrate gratis
              </Text>
            </TouchableOpacity>
          </View>

          {/* Soporte */}
          <TouchableOpacity
            style={styles.supportLink}
            onPress={() => openSupportEmail('Consulta sobre PresúFácil', '')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.supportText}>¿Tenés dudas? Escribinos</Text>
          </TouchableOpacity>
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
    paddingVertical: 32,
    gap: 32,
  },
  brand: {
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  appName: {
    fontWeight: '700',
    color: colors.text,
  },
  tagline: {
    color: colors.textSecondary,
  },
  form: {
    gap: 16,
  },
  formTitle: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  supportText: {
    fontSize: 13,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
});
