/**
 * AppTabNavigator — navegación principal de la app (post-onboarding).
 *
 * Estructura: BottomTabNavigator con 4 pestañas.
 * Cada pestaña tiene su propio StackNavigator para manejar navegación
 * interna sin perder el estado de las otras pestañas.
 *
 * Árbol de navegación:
 *
 *  BottomTab
 *  ├── Home          → HomeScreen
 *  ├── NewQuote      → QuoteNavigator
 *  │     ├── QuoteForm    (pantalla principal de la pestaña)
 *  │     └── QuoteDetail
 *  ├── History       → HistoryNavigator
 *  │     ├── HistoryList       (pantalla principal)
 *  │     ├── QuoteDetailHistory (detalle desde historial)
 *  │     └── QuoteForm         (edición desde historial)
 *  └── Settings      → SettingsNavigator
 *        ├── SettingsMenu    (pantalla principal)
 *        ├── BusinessProfile
 *        ├── TemplateList
 *        ├── TemplateForm
 *        └── Account
 *
 * Por qué QuoteDetailScreen aparece en dos stacks (NewQuote e History):
 *   React Navigation no permite compartir una pantalla entre stacks distintos.
 *   QuoteDetailHistory es el mismo componente con nombre diferente para que
 *   el botón "volver" lleve al historial y no al formulario.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/home/HomeScreen';
import QuoteFormScreen from '../screens/quotes/QuoteFormScreen';
import QuoteDetailScreen from '../screens/quotes/QuoteDetailScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import BusinessProfileScreen from '../screens/settings/BusinessProfileScreen';
import TemplateListScreen from '../screens/settings/TemplateListScreen';
import TemplateFormScreen from '../screens/settings/TemplateFormScreen';
import AccountScreen from '../screens/settings/AccountScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminUpdateConfigScreen from '../screens/admin/AdminUpdateConfigScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const QuoteStack = createStackNavigator();
const HistoryStack = createStackNavigator();
const SettingsStack = createStackNavigator();

function TabIcon({ name, color, focused }) {
  return (
    <View style={styles.tabIconWrapper}>
      <MaterialCommunityIcons name={name} size={24} color={color} />
      {focused && <View style={styles.tabIndicator} />}
    </View>
  );
}

function QuoteNavigator() {
  return (
    <QuoteStack.Navigator screenOptions={{ headerShown: false }}>
      <QuoteStack.Screen name="QuoteForm" component={QuoteFormScreen} />
      <QuoteStack.Screen name="QuoteDetail" component={QuoteDetailScreen} />
    </QuoteStack.Navigator>
  );
}

function HistoryNavigator() {
  return (
    <HistoryStack.Navigator screenOptions={{ headerShown: false }}>
      <HistoryStack.Screen name="HistoryList" component={HistoryScreen} />
      <HistoryStack.Screen name="QuoteDetailHistory" component={QuoteDetailScreen} />
      <HistoryStack.Screen name="QuoteForm" component={QuoteFormScreen} />
    </HistoryStack.Navigator>
  );
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsMenu" component={SettingsScreen} />
      <SettingsStack.Screen name="BusinessProfile" component={BusinessProfileScreen} />
      <SettingsStack.Screen name="TemplateList" component={TemplateListScreen} />
      <SettingsStack.Screen name="TemplateForm" component={TemplateFormScreen} />
      <SettingsStack.Screen name="Account" component={AccountScreen} />
      <SettingsStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <SettingsStack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <SettingsStack.Screen name="AdminUpdateConfig" component={AdminUpdateConfigScreen} />
    </SettingsStack.Navigator>
  );
}

export default function AppTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          height: 64 + (insets.bottom > 0 ? insets.bottom : 0),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="NewQuote"
        component={QuoteNavigator}
        options={{
          tabBarLabel: 'Presupuesto',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="plus-circle-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryNavigator}
        options={{
          tabBarLabel: 'Historial',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="clipboard-list-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          tabBarLabel: 'Ajustes',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="cog-outline" color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconWrapper: {
    alignItems: 'center',
    gap: 3,
  },
  tabIndicator: {
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
