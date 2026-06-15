import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, Surface, Dialog, Portal, Button, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import AppLoader from '../../components/common/AppLoader';
import {
  activateUserProWithDuration,
  restoreProFromSavedDays,
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
  const [actionDialog, setActionDialog] = useState(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(u =>
      (u.email ?? '').toLowerCase().includes(term) ||
      (u.ownerName ?? '').toLowerCase().includes(term) ||
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

  function getDemoDowngradeRemainingDays(user) {
    const now = new Date();
    const isPro = user.pro === true || user.planType === 'pro';
    if (!isPro || !user.proExpiresAt) return 0;
    const expiresAt = user.proExpiresAt.toDate
      ? user.proExpiresAt.toDate()
      : new Date(user.proExpiresAt);
    if (expiresAt <= now) return 0;
    return Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
  }

  function previewExpiryForRestore(user) {
    const remaining = user.proRemainingDays ?? 0;
    const d = new Date();
    d.setTime(d.getTime() + remaining * 24 * 60 * 60 * 1000);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function previewExpiryForNewPeriod(user, days) {
    const now = new Date();
    const isPro = user.pro === true || user.planType === 'pro';
    let base = now;
    if (isPro && user.proExpiresAt) {
      const exp = user.proExpiresAt.toDate
        ? user.proExpiresAt.toDate()
        : new Date(user.proExpiresAt);
      if (exp > now) base = exp;
    }
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function handleProPress(user, days) {
    const savedDays = user.proRemainingDays ?? 0;
    if (savedDays > 0) {
      setActionDialog({ type: 'activate_restore_or_new', user });
    } else {
      setActionDialog({ type: 'activate_confirm', user, days });
    }
  }

  function handleDemoPress(user) {
    const remainingDays = getDemoDowngradeRemainingDays(user);
    setActionDialog({ type: 'downgrade_confirm', user, remainingDays });
  }

  function handleReactivatePress(user) {
    setActionDialog({ type: 'reactivate_confirm', user });
  }

  function renderActionDialog() {
    if (!actionDialog) return null;
    const { type, user, days, remainingDays } = actionDialog;

    if (type === 'activate_restore_or_new') {
      const savedDays = user.proRemainingDays ?? 0;
      const restoreDate = previewExpiryForRestore(user);
      return (
        <Dialog visible onDismiss={() => setActionDialog(null)} style={styles.dialog}>
          <Dialog.Title>Activar Pro</Dialog.Title>
          <Dialog.Content style={{ gap: 8 }}>
            <Text variant="bodyMedium" style={{ color: colors.text }}>{user.email}</Text>
            <Text variant="bodySmall" style={{ color: colors.warning, fontWeight: '700', marginTop: 4 }}>
              Este usuario tiene {savedDays} días Pro guardados.
            </Text>
            <Text variant="bodySmall" style={{ color: colors.textSecondary, marginBottom: 4 }}>
              Elegí cómo activar:
            </Text>
            <TouchableOpacity
              style={[styles.dialogOption, { borderColor: colors.warning }]}
              onPress={() => { setActionDialog(null); runAction(() => restoreProFromSavedDays(user.id)); }}
            >
              <Text style={[styles.dialogOptionTitle, { color: colors.warning }]}>
                Restaurar {savedDays} días
              </Text>
              <Text style={styles.dialogOptionSubtitle}>Vence el {restoreDate}</Text>
            </TouchableOpacity>
            {PRO_DURATIONS.map(({ label, days: d }) => (
              <TouchableOpacity
                key={d}
                style={styles.dialogOption}
                onPress={() => { setActionDialog(null); runAction(() => activateUserProWithDuration(user.id, d)); }}
              >
                <Text style={styles.dialogOptionTitle}>Nuevo período: {label}</Text>
                <Text style={styles.dialogOptionSubtitle}>Vence el {previewExpiryForNewPeriod(user, d)}</Text>
              </TouchableOpacity>
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setActionDialog(null)}>Cancelar</Button>
          </Dialog.Actions>
        </Dialog>
      );
    }

    if (type === 'activate_confirm') {
      const isExtension = getPlanStatus(user) === 'pro_active';
      const expiry = previewExpiryForNewPeriod(user, days);
      const durationLabel = PRO_DURATIONS.find(p => p.days === days)?.label ?? `${days} días`;
      return (
        <Dialog visible onDismiss={() => setActionDialog(null)} style={styles.dialog}>
          <Dialog.Title>{isExtension ? 'Extender Pro' : 'Activar Pro'}</Dialog.Title>
          <Dialog.Content style={{ gap: 4 }}>
            <Text variant="bodyMedium" style={{ color: colors.text }}>{user.email}</Text>
            <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 6 }}>
              {isExtension ? 'Extensión desde vencimiento actual:' : 'Nueva activación:'} {durationLabel}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
              Vence el: {expiry}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setActionDialog(null)}>Cancelar</Button>
            <Button
              mode="contained"
              buttonColor='#2F9E44'
              onPress={() => { setActionDialog(null); runAction(() => activateUserProWithDuration(user.id, days)); }}
            >
              {isExtension ? 'Extender' : 'Activar'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      );
    }

    if (type === 'downgrade_confirm') {
      return (
        <Dialog visible onDismiss={() => setActionDialog(null)} style={styles.dialog}>
          <Dialog.Title>Pasar a Demo</Dialog.Title>
          <Dialog.Content style={{ gap: 4 }}>
            <Text variant="bodyMedium" style={{ color: colors.text }}>{user.email}</Text>
            {remainingDays > 0 ? (
              <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 6 }}>
                {'Este usuario tiene '}
                <Text style={{ fontWeight: '700', color: colors.warning }}>
                  {remainingDays} días Pro restantes
                </Text>
                {'. Quedarán guardados para poder restaurarlos.'}
              </Text>
            ) : (
              <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 6 }}>
                El usuario pasará al plan Demo.
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setActionDialog(null)}>Cancelar</Button>
            <Button
              mode="contained"
              buttonColor={colors.warning}
              onPress={() => { setActionDialog(null); runAction(() => setUserDemo(user.id)); }}
            >
              Pasar a Demo
            </Button>
          </Dialog.Actions>
        </Dialog>
      );
    }

    if (type === 'reactivate_confirm') {
      return (
        <Dialog visible onDismiss={() => setActionDialog(null)} style={styles.dialog}>
          <Dialog.Title>Reactivar cuenta</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: colors.text }}>{user.email}</Text>
            <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 6 }}>
              La cuenta quedará activa con el plan actual.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setActionDialog(null)}>Cancelar</Button>
            <Button
              mode="contained"
              buttonColor='#2F9E44'
              onPress={() => { setActionDialog(null); runAction(() => reactivateUser(user.id)); }}
            >
              Reactivar
            </Button>
          </Dialog.Actions>
        </Dialog>
      );
    }

    return null;
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
              {u.businessName || u.ownerName || 'Sin nombre'}
            </Text>
            {u.ownerName && u.businessName ? (
              <Text variant="bodySmall" style={styles.ownerName} numberOfLines={1}>
                {u.ownerName}
              </Text>
            ) : null}
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

        {/* Días Pro guardados (visible solo en Demo cuando hay días pendientes) */}
        {isDemo && (u.proRemainingDays ?? 0) > 0 && (
          <View style={styles.savedDaysRow}>
            <MaterialCommunityIcons name="clock-check-outline" size={14} color={colors.warning} />
            <Text variant="bodySmall" style={styles.savedDaysText}>
              {u.proRemainingDays} días Pro guardados
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
                    onPress={() => handleProPress(u, d)}
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
              onPress={() => handleDemoPress(u)}
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
              onPress={() => handleReactivatePress(u)}
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
        {renderActionDialog()}
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
  ownerName: { color: colors.text, fontWeight: '500', marginTop: 2 },
  email: { color: colors.textSecondary, marginTop: 1 },
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
  savedDaysRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  savedDaysText: { color: colors.warning, fontWeight: '600' },
  dialogOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 2,
  },
  dialogOptionTitle: { color: colors.text, fontWeight: '600', fontSize: 14 },
  dialogOptionSubtitle: { color: colors.textSecondary, fontSize: 12 },
});
