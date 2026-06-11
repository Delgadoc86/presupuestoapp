import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, Surface, Dialog, Portal, Button, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import AppLoader from '../../components/common/AppLoader';
import {
  activateUserProWithDuration,
  setUserDemo,
  suspendUser,
  reactivateUser,
  updateUserQuoteLimit,
} from '../../services/admin.service';
import {
  getPlanStatus,
  getDaysUntilExpiry,
  formatExpiryDate,
} from '../../utils/planStatus';
import { colors } from '../../theme/colors';

function formatDate(ts) {
  if (!ts) return null;
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return null;
  }
}

function shortUid(uid) {
  return uid ? uid.slice(0, 8) : '—';
}

const PRO_DURATIONS = [
  { label: '30 días', days: 30 },
  { label: '180 días', days: 180 },
  { label: '365 días', days: 365 },
];

export default function AdminUsersScreen({ navigation }) {
  const { users, loading } = useAdminUsers();
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [limitDialog, setLimitDialog] = useState(null);
  const [limitValue, setLimitValue] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(u =>
      (u.email ?? '').toLowerCase().includes(term) ||
      (u.businessName ?? '').toLowerCase().includes(term) ||
      (u.id ?? '').toLowerCase().includes(term)
    );
  }, [users, search]);

  async function runAction(fn) {
    setActionLoading(true);
    try {
      await fn();
    } catch {
      Alert.alert('Error', 'No se pudo completar la acción. Revisá tu conexión.');
    } finally {
      setActionLoading(false);
    }
  }

  function openLimitDialog(u) {
    setLimitValue(String(u.quoteLimit ?? 3));
    setLimitDialog({ uid: u.id });
  }

  async function saveLimit() {
    const n = parseInt(limitValue, 10);
    if (isNaN(n) || n < 1) return;
    const uid = limitDialog.uid;
    setLimitDialog(null);
    await runAction(() => updateUserQuoteLimit(uid, n));
  }

  function renderUser({ item: u }) {
    const status = getPlanStatus(u);
    const isSuspended = status === 'suspended';
    const isProActive = status === 'pro_active';
    const isProExpired = status === 'pro_expired';
    const isDemo = status === 'demo';

    const days = getDaysUntilExpiry(u);
    const expiryDate = formatExpiryDate(u);
    const createdAt = formatDate(u.createdAt);
    const lastAccess = formatDate(u.lastAccessAt);

    const badgeLabel = isSuspended
      ? 'SUSPENDIDO'
      : isProActive
        ? 'PRO'
        : isProExpired
          ? 'PRO VENCIDO'
          : 'DEMO';
    const badgeColor = isSuspended
      ? colors.error
      : isProActive
        ? '#2F9E44'
        : isProExpired
          ? '#ADB5BD'
          : colors.warning;

    return (
      <Surface style={styles.userCard} elevation={1}>
        {/* Encabezado */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyLarge" style={styles.businessName} numberOfLines={1}>
              {u.businessName || 'Sin nombre de negocio'}
            </Text>
            <Text variant="bodySmall" style={styles.email} numberOfLines={1}>
              {u.email}
            </Text>
          </View>
          <View style={[styles.planBadge, { backgroundColor: badgeColor }]}>
            <Text style={styles.planBadgeText}>{badgeLabel}</Text>
          </View>
        </View>

        {/* ID corto */}
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="identifier" size={14} color={colors.textSecondary} />
          <Text variant="bodySmall" style={styles.metaText}>ID: {shortUid(u.id)}</Text>
        </View>

        {/* Vencimiento Pro */}
        {isProActive && expiryDate && days !== null && (
          <View style={styles.expiryRow}>
            <MaterialCommunityIcons name="clock-outline" size={14} color='#2F9E44' />
            <Text variant="bodySmall" style={styles.expiryActive}>
              Vence: {expiryDate} · Restan: {days} día{days !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
        {isProExpired && expiryDate && days !== null && (
          <View style={styles.expiryRow}>
            <MaterialCommunityIcons name="clock-alert-outline" size={14} color={colors.error} />
            <Text variant="bodySmall" style={styles.expiryExpired}>
              Venció el {expiryDate} · Hace {Math.abs(days)} día{Math.abs(days) !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Este mes</Text>
            <Text style={styles.statValue}>
              {u.quotesThisMonth ?? 0} / {isProActive ? '∞' : (u.quoteLimit ?? 3)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{u.totalQuotes ?? 0}</Text>
          </View>
          {createdAt && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Alta</Text>
                <Text style={styles.statValue}>{createdAt}</Text>
              </View>
            </>
          )}
          {lastAccess && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Último acceso</Text>
                <Text style={styles.statValue}>{lastAccess}</Text>
              </View>
            </>
          )}
        </View>

        {/* Acciones */}
        <View style={styles.actions}>
          {/* Botones Pro con duración (para demo, pro_expired y pro_active) */}
          {!isSuspended && (
            <View style={styles.proGroup}>
              <Text style={styles.proGroupLabel}>
                {isProActive ? 'Extender Pro:' : 'Activar Pro:'}
              </Text>
              <View style={styles.proGroupBtns}>
                {PRO_DURATIONS.map(({ label, days: d }) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.actionBtn, styles.btnPro]}
                    onPress={() => runAction(() => activateUserProWithDuration(u.id, d))}
                  >
                    <Text style={styles.actionBtnText}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Pasar a Demo (solo si es Pro activo) */}
          {isProActive && !isSuspended && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.warning }]}
              onPress={() => runAction(() => setUserDemo(u.id))}
            >
              <Text style={styles.actionBtnText}>Pasar a Demo</Text>
            </TouchableOpacity>
          )}

          {/* Cambiar límite (solo Demo o Pro vencido) */}
          {(isDemo || isProExpired) && !isSuspended && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={() => openLimitDialog(u)}
            >
              <Text style={styles.actionBtnText}>Cambiar límite</Text>
            </TouchableOpacity>
          )}

          {/* Suspender */}
          {!isSuspended && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.error }]}
              onPress={() =>
                Alert.alert(
                  'Suspender usuario',
                  `¿Suspender a ${u.email}?`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Suspender',
                      style: 'destructive',
                      onPress: () => runAction(() => suspendUser(u.id)),
                    },
                  ]
                )
              }
            >
              <Text style={styles.actionBtnText}>Suspender</Text>
            </TouchableOpacity>
          )}

          {/* Reactivar */}
          {isSuspended && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#2F9E44' }]}
              onPress={() => runAction(() => reactivateUser(u.id))}
            >
              <Text style={styles.actionBtnText}>Reactivar</Text>
            </TouchableOpacity>
          )}
        </View>
      </Surface>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppLoader visible={actionLoading || loading} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="titleLarge" style={styles.headerTitle}>
          Usuarios ({filtered.length}{search ? ` de ${users.length}` : ''})
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchWrapper}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          mode="outlined"
          dense
          placeholder="Buscar por email, negocio o ID..."
          left={<TextInput.Icon icon="magnify" color={colors.textSecondary} />}
          right={
            search
              ? <TextInput.Icon icon="close" onPress={() => setSearch('')} color={colors.textSecondary} />
              : null
          }
          style={styles.searchInput}
          outlineStyle={styles.searchOutline}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={u => u.id}
        contentContainerStyle={styles.list}
        renderItem={renderUser}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-search-outline" size={48} color={colors.border} />
            <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
              {search ? 'Sin resultados para esa búsqueda' : 'No hay usuarios todavía'}
            </Text>
          </View>
        }
      />

      <Portal>
        <Dialog
          visible={!!limitDialog}
          onDismiss={() => setLimitDialog(null)}
          style={styles.dialog}
        >
          <Dialog.Title>Cambiar límite mensual</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Presupuestos por mes"
              value={limitValue}
              onChangeText={setLimitValue}
              keyboardType="numeric"
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLimitDialog(null)}>Cancelar</Button>
            <Button onPress={saveLimit}>Guardar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontWeight: '700', color: colors.text },
  searchWrapper: { paddingHorizontal: 20, paddingBottom: 12 },
  searchInput: { backgroundColor: colors.surface, fontSize: 14 },
  searchOutline: { borderRadius: 12 },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 12, flexGrow: 1 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  userCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  businessName: { fontWeight: '700', color: colors.text },
  email: { color: colors.textSecondary, marginTop: 2 },
  planBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  planBadgeText: { color: '#fff', fontWeight: '700', fontSize: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: colors.textSecondary, fontFamily: 'monospace' },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  expiryActive: { color: '#2F9E44', fontWeight: '600' },
  expiryExpired: { color: colors.error, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: colors.surfaceVariant,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statItem: { alignItems: 'center', flex: 1, minWidth: 70, gap: 2 },
  statLabel: { color: colors.textSecondary, fontSize: 10, textAlign: 'center' },
  statValue: { color: colors.text, fontWeight: '700', textAlign: 'center', fontSize: 14 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
  actions: { gap: 8 },
  proGroup: { gap: 6 },
  proGroupLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  proGroupBtns: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' },
  btnPro: { backgroundColor: '#2F9E44' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  dialog: { borderRadius: 20 },
});
