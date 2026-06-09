/**
 * AuthNavigator — stack de autenticación.
 *
 * Pantallas disponibles:
 *   Login          → pantalla inicial (índice 0 del stack)
 *   Register       → registro de cuenta nueva
 *   ForgotPassword → recuperación de contraseña por email
 *
 * headerShown: false porque cada pantalla tiene su propio header visual.
 * Al iniciar sesión exitosamente, AuthContext detecta el cambio vía
 * onAuthStateChanged y AppNavigator transiciona automáticamente
 * al onboarding o a AppTabNavigator. No se usa navigation.navigate().
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

const Stack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
