import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthContext } from '../../context/AuthContext';
import { useBusinessContext } from '../../context/BusinessContext';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { colors } from '../../theme/colors';
import { openUpgradeEmail, openSuspendedEmail } from '../../utils/contactHelper';
import {
  getPlanStatus,
  getDaysUntilExpiry,
  formatExpiryDate,
} from '../../utils/planStatus';

function _currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function PlanBanner({ userData, userEmail }) {
  if (!userData) return null;

  const status = getPlanStatus(userData);

  if (status === 'suspended') {
    return (
      <TouchableOpacity
        style={[styles.banner, styles.bannerSuspended]}
        onPress={() => openSuspendedEmail(userEmail)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#fff" />
        <Text variant="bodySmall" style={styles.bannerText}>
          Cuenta suspendida — Tocá para contactar soporte
        </Text>
      </TouchableOpacity>
    );
  }

  if (status === 'pro_active') {
    const expiryDate = formatExpiryDate(userData);
    const days = getDaysUntilExpiry(userData);
    return (
      <View style={[styles.banner, styles.bannerPro]}>
        <MaterialCommunityIcons name="crown" size={16} color="#2F9E44" />
        <Text variant="bodySmall" style={styles.bannerTextPro}>
          Plan Pro activo
          {expiryDate ? ` · Vence el ${expiryDate}` : ''}
          {days !== null && days <= 30 ? ` (${days} día${days !== 1 ? 's' : ''})` : ''}
        </Text>
      </View>
    );
  }

  if (status === 'pro_expired') {
    const days = getDaysUntilExpiry(userData);
    const overdue = Math.abs(days ?? 0);
    return (
      <TouchableOpacity
        style={[styles.banner, styles.bannerDemo]}
        onPress={() => openUpgradeEmail(userEmail)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="crown-off-outline" size={16} color="#fff" />
        <Text variant="bodySmall" style={styles.bannerText}>
          Tu Pro venció hace {overdue} día{overdue !== 1 ? 's' : ''} — Renovar
        </Text>
      </TouchableOpacity>
    );
  }

  // demo
  const currentMonth = _currentYearMonth();
  const used =
    (userData.quoteMonth ?? '') === currentMonth ? (userData.quotesThisMonth ?? 0) : 0;
  const limit = userData.quoteLimit ?? 3;
  const remaining = Math.max(0, limit - used);
  return (
    <TouchableOpacity
      style={[styles.banner, styles.bannerDemo]}
      onPress={() => openUpgradeEmail(userEmail)}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons name="star-outline" size={16} color="#fff" />
      <Text variant="bodySmall" style={styles.bannerText}>
        Plan Demo · {remaining} presupuesto{remaining !== 1 ? 's' : ''} restante{remaining !== 1 ? 's' : ''} este mes — Activar Pro
      </Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  const { user, userData } = useAuthContext();
  const { business } = useBusinessContext();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

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

        {/* Banner de plan */}
        <PlanBanner userData={userData} userEmail={user?.email} />

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

        {!adminLoading && isAdmin && (
          <View>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Administración
            </Text>
            <Surface
              style={styles.adminCard}
              elevation={1}
              onTouchEnd={() => navigation.navigate('Settings', { screen: 'AdminDashboard' })}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E0312118' }]}>
                <MaterialCommunityIcons name="shield-account-outline" size={28} color="#E03121" />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="labelLarge" style={[styles.actionLabel, { color: colors.text }]}>
                  Panel Admin
                </Text>
                <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 2 }}>
                  Gestionar usuarios y planes
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </Surface>
          </View>
        )}

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
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0312130',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bannerSuspended: {
    backgroundColor: colors.error,
  },
  bannerDemo: {
    backgroundColor: colors.warning,
  },
  bannerPro: {
    backgroundColor: '#EBFBEE',
    borderWidth: 1,
    borderColor: '#B2F2BB',
  },
  bannerText: {
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
  bannerTextPro: {
    color: '#2F9E44',
    fontWeight: '600',
    flex: 1,
  },
});
