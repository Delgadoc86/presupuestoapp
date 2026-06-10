import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthContext } from '../../context/AuthContext';
import { useBusinessContext } from '../../context/BusinessContext';
import { colors } from '../../theme/colors';

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  const { user } = useAuthContext();
  const { business } = useBusinessContext();

  const quickActions = [
    {
      icon: 'plus-circle-outline',
      label: 'Nuevo presupuesto',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('NewQuote', { screen: 'QuoteForm' }),
    },
    {
      icon: 'clipboard-list-outline',
      label: 'Ver historial',
      color: colors.secondary,
      onPress: () => navigation.navigate('History'),
    },
    {
      icon: 'file-document-outline',
      label: 'Mis plantillas',
      color: colors.warning,
      onPress: () => navigation.navigate('Settings', { screen: 'TemplateList' }),
    },
    {
      icon: 'store-outline',
      label: 'Mi negocio',
      color: colors.statusSent,
      onPress: () => navigation.navigate('Settings', { screen: 'BusinessProfile' }),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Encabezado */}
        <View style={styles.header}>
          <View>
            <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
              Bienvenido
            </Text>
            <Text variant="headlineSmall" style={styles.businessName}>
              {business?.businessName ?? 'Tu negocio'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings', { screen: 'Account' })}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={[styles.avatarCircle, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialCommunityIcons
                name="account-outline"
                size={28}
                color={theme.colors.primary}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Acciones rápidas */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          ¿Qué querés hacer?
        </Text>

        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <Surface
              key={action.label}
              style={styles.actionCard}
              elevation={1}
              onTouchEnd={action.onPress}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}18` }]}>
                <MaterialCommunityIcons name={action.icon} size={28} color={action.color} />
              </View>
              <Text variant="labelLarge" style={[styles.actionLabel, { color: colors.text }]}>
                {action.label}
              </Text>
            </Surface>
          ))}
        </View>

      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  businessName: {
    fontWeight: '700',
    color: colors.text,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '600',
    color: colors.text,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    alignItems: 'flex-start',
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontWeight: '600',
    lineHeight: 20,
  },
});
