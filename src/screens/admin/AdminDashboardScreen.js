import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import AppLoader from '../../components/common/AppLoader';
import { getPlanStatus } from '../../utils/planStatus';
import { colors } from '../../theme/colors';

export default function AdminDashboardScreen({ navigation }) {
  const { users, loading } = useAdminUsers();

  const total = users.length;
  const suspended = users.filter(u => getPlanStatus(u) === 'suspended').length;
  const proActive = users.filter(u => getPlanStatus(u) === 'pro_active').length;
  const proExpired = users.filter(u => getPlanStatus(u) === 'pro_expired').length;
  const demo = users.filter(u => getPlanStatus(u) === 'demo').length;

  const stats = [
    { label: 'Total', value: total, icon: 'account-group-outline', color: colors.primary },
    { label: 'Demo', value: demo + proExpired, icon: 'star-outline', color: colors.warning },
    { label: 'Pro activo', value: proActive, icon: 'crown-outline', color: '#2F9E44' },
    { label: 'Suspendidos', value: suspended, icon: 'account-cancel-outline', color: colors.error },
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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
    paddingBottom: 40,
    gap: 20,
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
