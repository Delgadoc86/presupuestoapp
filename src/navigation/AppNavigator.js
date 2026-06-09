/**
 * AppNavigator — árbol de decisión raíz de la aplicación.
 *
 * Es el único lugar de la app que decide qué stack mostrar al usuario.
 * Lee el estado de AuthContext y resuelve uno de estos tres casos:
 *
 *  1. loading = true
 *     → Spinner de carga (mientras Firebase Auth resuelve el estado inicial).
 *        Sin esto habría un flash de la pantalla de login antes de que
 *        onAuthStateChanged confirme que ya hay sesión.
 *
 *  2. user = null
 *     → AuthNavigator (Login / Registro / Recuperar contraseña)
 *
 *  3. user existe pero onboardingComplete = false (o userData aún es null)
 *     → BusinessSetupScreen (pantalla única, sin stack de navegación propio)
 *        La transición a AppTabNavigator ocurre automáticamente cuando
 *        completeOnboarding() escribe onboardingComplete:true en Firestore
 *        y AuthContext detecta el cambio via onSnapshot.
 *
 *  4. user existe y onboardingComplete = true
 *     → AppTabNavigator (la app completa con las 4 pestañas)
 *
 * Cada rama tiene su propio NavigationContainer para evitar errores de
 * "navigator is not mounted" al transicionar entre stacks.
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';

import { useAuthContext } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import AppTabNavigator from './AppTabNavigator';
import BusinessSetupScreen from '../screens/onboarding/BusinessSetupScreen';
import { colors } from '../theme/colors';

export default function AppNavigator() {
  const { user, userData, loading } = useAuthContext();

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
