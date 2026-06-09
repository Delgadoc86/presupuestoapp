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
import { registerWithEmail, getAuthErrorMessage } from '../../services/auth.service';
import { useAppContext } from '../../context/AppContext';
import { colors } from '../../theme/colors';

export default function RegisterScreen({ navigation }) {
  const theme = useTheme();
  const { showSnackbar } = useAppContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

    if (!password) next.password = 'Ingresá una contraseña';
    else if (password.length < 6) next.password = 'Mínimo 6 caracteres';

    if (!confirmPassword) next.confirmPassword = 'Repetí la contraseña';
    else if (password && confirmPassword !== password)
      next.confirmPassword = 'Las contraseñas no coinciden';

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      await registerWithEmail(email.trim(), password);
      // AuthContext detecta al nuevo usuario y navega a BusinessSetup
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
          {/* Header con volver */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>

          {/* Encabezado */}
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.title}>
              Creá tu cuenta
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Es gratis. Sin tarjeta de crédito.
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <AppInput
              label="Email"
              value={email}
              onChangeText={t => { setEmail(t); clearFieldError('email'); }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <AppInput
              label="Contraseña"
              value={password}
              onChangeText={t => { setPassword(t); clearFieldError('password'); }}
              error={errors.password}
              secureTextEntry
              returnKeyType="next"
            />

            <AppInput
              label="Repetir contraseña"
              value={confirmPassword}
              onChangeText={t => { setConfirmPassword(t); clearFieldError('confirmPassword'); }}
              error={errors.confirmPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />

            <AppButton onPress={handleRegister} loading={loading} style={styles.button}>
              Crear cuenta gratis
            </AppButton>
          </View>

          {/* Pie: ir a login */}
          <View style={styles.footer}>
            <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
              ¿Ya tenés cuenta?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.primary, fontWeight: '600' }}
              >
                Iniciá sesión
              </Text>
            </TouchableOpacity>
          </View>
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
    gap: 28,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 4,
  },
  header: {
    gap: 8,
  },
  title: {
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  form: {
    gap: 16,
  },
  button: {
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
