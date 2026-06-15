/**
 * AppNavigator — árbol de decisión raíz de la aplicación.
 *
 *  1. loading = true              → Spinner
 *  2. user = null                 → AuthNavigator (Login / Registro / Recuperar contraseña)
 *  3. user && !emailVerified      → VerifyEmailScreen (bloqueo hasta verificar)
 *  4. !userData?.onboardingComplete → BusinessSetupScreen (onboarding)
 *  5. onboardingComplete = true   → AppTabNavigator (app completa)
 *
 * emailVerified viene de AuthContext como estado separado porque
 * onAuthStateChanged no se dispara cuando el campo cambia server-side.
 * Se actualiza con reloadUser() desde VerifyEmailScreen.
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';

import { useAuthContext } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import AppTabNavigator from './AppTabNavigator';
import BusinessSetupScreen from '../screens/onboarding/BusinessSetupScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import { colors } from '../theme/colors';

export default function AppNavigator() {
  const { user, userData, loading, emailVerified } = useAuthContext();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  if (!emailVerified) {
    return (
      <NavigationContainer>
        <VerifyEmailScreen />
      </NavigationContainer>
    );
  }

  if (!userData?.onboardingComplete) {
    return (
      <NavigationContainer>
        <BusinessSetupScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <AppTabNavigator />
    </NavigationContainer>
  );
}
