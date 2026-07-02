import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getDocs } from 'firebase/firestore';
import { useAuthContext } from '../../context/AuthContext';
import { useBusinessContext } from '../../context/BusinessContext';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { colors } from '../../theme/colors';
import { openUpgradeEmail, openSuspendedEmail } from '../../utils/contactHelper';
import { getPlanStatus } from '../../utils/planStatus';
import { buildHistoryQuery } from '../../services/quotes.service';
import { formatCurrency } from '../../utils/formatters';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

function PlanBanner({ userData, userEmail }) {
  if (!userData) return null;

  const { status, remainingDays, expiryDateFormatted, demoRemainingQuotes } = getPlanStatus(userData);

  if (status === 'suspended') {
    return (
      <Pressable
        style={[styles.banner, styles.bannerSuspended]}
        onPress={() => openSuspendedEmail(userEmail)}
      >
        <MaterialCommunityIcons name="alert-circle-outline" size={15} color="#fff" />
        <Text style={styles.bannerText}>Cuenta suspendida — Tocá para contactar soporte</Text>
      </Pressable>
    );
  }

  if (status === 'pro_active') {
    const daysNote =
      remainingDays !== null && remainingDays <= 30
        ? ` · ${remainingDays} día${remainingDays !== 1 ? 's' : ''}`
        : expiryDateFormatted
        ? ` · vence el ${expiryDateFormatted}`
        : '';
    return (
      <View style={[styles.banner, styles.bannerPro]}>
        <MaterialCommunityIcons name="crown" size={15} color={colors.success} />
        <Text style={styles.bannerTextPro}>Plan Pro{daysNote}</Text>
      </View>
    );
  }

  if (status === 'pro_expired') {
    const overdue = Math.abs(remainingDays ?? 0);
    return (
      <Pressable
        style={[styles.banner, styles.bannerExpired]}
        onPress={() => openUpgradeEmail(userEmail)}
      >
        <MaterialCommunityIcons name="crown-off-outline" size={15} color="#fff" />
        <Text style={styles.bannerText}>
          Pro vencido hace {overdue} día{overdue !== 1 ? 's' : ''} — Renovar
        </Text>
      </Pressable>
    );
  }

  // demo
  return (
    <Pressable
      style={[styles.banner, styles.bannerDemo]}
      onPress={() => openUpgradeEmail(userEmail)}
    >
      <MaterialCommunityIcons name="star-outline" size={15} color={colors.warning} />
      <Text style={styles.bannerTextDemo}>
        Plan Demo · {demoRemainingQuotes} presupuesto{demoRemainingQuotes !== 1 ? 's' : ''} restante{demoRemainingQuotes !== 1 ? 's' : ''} —{' '}
        <Text style={{ fontWeight: '700', color: colors.warning }}>Activar Pro</Text>
      </Text>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  useTheme(); // mantiene suscripción al tema de Paper
  const { user, userData } = useAuthContext();
  const { business } = useBusinessContext();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [monthStats, setMonthStats] = useState({ count: 0, total: 0, loading: true });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const q = buildHistoryQuery(user.uid, { dateFilter: 'month' });
        const snap = await getDocs(q);
        if (cancelled) return;
        let total = 0;
        snap.docs.forEach(d => { total += d.data().total ?? 0; });
        setMonthStats({ count: snap.docs.length, total, loading: false });
      } catch {
        if (!cancelled) setMonthStats({ count: 0, total: 0, loading: false });
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const greeting  = useMemo(() => getGreeting(), []);
  const ownerName = business?.ownerName ?? '';

  const quickActions = [
    {
      icon:      'plus-circle-outline',
      label:     'Nuevo\npresupuesto',
      bg:        colors.primaryLight,
      iconColor: colors.primary,
      onPress:   () => navigation.navigate('NewQuote', { screen: 'QuoteForm' }),
    },
    {
      icon:      'clipboard-list-outline',
      label:     'Ver\nhistorial',
      bg:        colors.successLight,
      iconColor: colors.success,
      onPress:   () => navigation.navigate('History'),
    },
    {
      icon:      'file-document-outline',
      label:     'Mis\nplantillas',
      bg:        colors.warningLight,
      iconColor: colors.warning,
      onPress:   () => navigation.navigate('Settings', { screen: 'TemplateList' }),
    },
    {
      icon:      'store-outline',
      label:     'Mi\nnegocio',
      bg:        colors.sentLight,
      iconColor: colors.sent,
      onPress:   () => navigation.navigate('Settings', { screen: 'BusinessProfile' }),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>
              {greeting}{ownerName ? `, ${ownerName}` : ''} 👋
            </Text>
            <Text style={styles.businessName}>
              {business?.businessName ?? business?.ownerName ?? 'Tu negocio'}
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('Settings', { screen: 'Account' })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons name="account-outline" size={24} color={colors.primary} />
            </View>
          </Pressable>
        </View>

        {/* Banner de plan */}
        <PlanBanner userData={userData} userEmail={user?.email} />

        {/* Acciones rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Acciones rápidas</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <Pressable
                key={action.label}
                onPress={action.onPress}
                style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
              >
                <View style={[styles.actionIconCircle, { backgroundColor: action.bg }]}>
                  <MaterialCommunityIcons name={action.icon} size={26} color={action.iconColor} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Este mes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Este mes</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {monthStats.loading ? '—' : monthStats.count}
              </Text>
              <Text style={styles.statLabel}>presupuestos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                {monthStats.loading ? '—' : formatCurrency(monthStats.total)}
              </Text>
              <Text style={styles.statLabel}>presupuestado</Text>
            </View>
          </View>
        </View>

        {/* Panel Admin */}
        {!adminLoading && isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Administración</Text>
            <Pressable
              onPress={() => navigation.navigate('Settings', { screen: 'AdminDashboard' })}
              style={({ pressed }) => [styles.adminCard, pressed && styles.actionCardPressed]}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <MaterialCommunityIcons name="shield-account-outline" size={24} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.adminLabel}>Panel Admin</Text>
                <Text style={styles.adminSub}>Gestionar usuarios y planes</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
            </Pressable>
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
  section: {
    gap: 10,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  businessName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Etiquetas de sección
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Grid de acciones rápidas
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    gap: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  actionCardPressed: {
    transform: [{ scale: 0.97 }],
  },
  actionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Stats "Este mes"
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.success,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Admin card
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  adminLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  adminSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Banners de plan
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bannerSuspended: { backgroundColor: '#DC2626' },
  bannerExpired:   { backgroundColor: colors.warning },
  bannerPro: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  bannerDemo: {
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  bannerText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    flex: 1,
  },
  bannerTextPro: {
    color: colors.success,
    fontWeight: '600',
    fontSize: 13,
    flex: 1,
  },
  bannerTextDemo: {
    color: colors.warning,
    fontWeight: '500',
    fontSize: 13,
    flex: 1,
  },
});
