import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import AppLoader from '../../components/common/AppLoader';
import { getPlanStatus } from '../../utils/planStatus';
import { colors } from '../../theme/colors';

export default function AdminDashboardScreen({ navigation }) {
  const { users, loading } = useAdminUsers();
  const insets = useSafeAreaInsets();

  // Calcular todos los contadores usando getPlanStatus().status — fuente única de verdad.
  // NUNCA usar user.pro directamente; getPlanStatus evalúa pro + expiresAt + enabled.
  const statusCounts = users.reduce((acc, u) => {
    const { status } = getPlanStatus(u);
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  const total      = users.length;
  const proActive  = statusCounts.pro_active  ?? 0;
  const proExpired = statusCounts.pro_expired ?? 0;
  const demo       = statusCounts.demo        ?? 0;
  const suspended  = statusCounts.suspended   ?? 0;
  const active     = total - suspended;

  const stats = [
    {
      label: 'Total',
      value: total,
      icon: 'account-group-outline',
      color: colors.primary,
    },
    {
      label: 'Pro activo',
      value: proActive,
      icon: 'crown-outline',
      color: '#2F9E44',
    },
    {
      label: 'Demo / Vencido',
      value: demo + proExpired,
      icon: 'star-outline',
      color: colors.warning,
    },
    {
      label: 'Suspendidos',
      value: suspended,
      icon: 'account-cancel-outline',
      color: colors.error,
    },
  ];

  const summary = [
    { label: 'Usuarios registrados', value: total },
    { label: 'Clientes activos', value: active },
    { label: 'Clientes suspendidos', value: suspended },
    ...(proExpired > 0 ? [{ label: 'Pro vencido (pendiente renovar)', value: proExpired }] : []),
  ];

  return (
    <SafeAreaView style={styles.container}>
      <AppLoader visible={loading} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="titleLarge" style={styles.headerTitle}>Panel Admin</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(32, insets.bottom + 20) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjetas de estadística */}
        <View style={styles.grid}>
          {stats.map(s => (
            <Surface key={s.label} style={styles.card} elevation={1}>
              <View style={[styles.iconBox, { backgroundColor: `${s.color}18` }]}>
                <MaterialCommunityIcons name={s.icon} size={24} color={s.color} />
              </View>
              <Text variant="headlineMedium" style={[styles.statValue, { color: s.color }]}>
                {s.value}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>{s.label}</Text>
            </Surface>
          ))}
        </View>

        {/* Resumen textual */}
        {!loading && (
          <Surface style={styles.summaryCard} elevation={0}>
            <Text style={styles.summaryTitle}>RESUMEN</Text>
            {summary.map(item => (
              <View key={item.label} style={styles.summaryRow}>
                <Text variant="bodyMedium" style={styles.summaryLabel}>{item.label}</Text>
                <Text variant="bodyMedium" style={styles.summaryValue}>{item.value}</Text>
              </View>
            ))}
          </Surface>
        )}

        {/* Botón de acceso a usuarios */}
        <TouchableOpacity
          style={styles.usersBtn}
          onPress={() => navigation.navigate('AdminUsers')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="account-group-outline" size={22} color="#fff" />
          <Text variant="labelLarge" style={styles.usersBtnText}>
            Ver todos los usuarios
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontWeight: '700',
    color: colors.text,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: colors.text,
  },
  summaryValue: {
    fontWeight: '700',
    color: colors.primary,
  },
  usersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  usersBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
