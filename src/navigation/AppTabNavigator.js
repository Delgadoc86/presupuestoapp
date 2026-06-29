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
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
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

const Tab = createBottomTabNavigator();
const QuoteStack = createStackNavigator();
const HistoryStack = createStackNavigator();
const SettingsStack = createStackNavigator();

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
    </SettingsStack.Navigator>
  );
}

export default function AppTabNavigator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#868E96',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#DEE2E6',
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          height: 64 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="NewQuote"
        component={QuoteNavigator}
        options={{
          tabBarLabel: 'Presupuesto',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="plus-circle-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryNavigator}
        options={{
          tabBarLabel: 'Historial',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-list-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          tabBarLabel: 'Ajustes',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
