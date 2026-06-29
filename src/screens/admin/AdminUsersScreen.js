import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Text, Surface, Dialog, Portal, Button, TextInput } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { getPlanStatus } from '../../utils/planStatus';
import { formatDateAR, addDays, formatRelativeTime } from '../../utils/dateUtils';
import { APP_CONFIG } from '../../config/appConfig';
import { colors } from '../../theme/colors';

// ── Helpers ──────────────────────────────────────────────────────────────────

function shortUid(uid) {
  return uid ? uid.slice(0, 8) : '—';
}

const PRO_DURATIONS = [
  { label: '30 días',  days: APP_CONFIG.proDurations.monthly },
  { label: '180 días', days: APP_CONFIG.proDurations.halfYear },
  { label: '365 días', days: APP_CONFIG.proDurations.yearly },
];

// ── Badge de plan ─────────────────────────────────────────────────────────────

function PlanBadge({ isSuspended, isProActive, isProExpired }) {
  if (isSuspended) {
    return (
      <View style={[styles.planBadge, styles.badgeSuspended]}>
        <MaterialCommunityIcons name="alert-circle" size={13} color="#fff" />
        <Text style={styles.planBadgeText}>SUSPENDIDO</Text>
      </View>
    );
  }
  if (isProActive) {
    return (
      <View style={[styles.planBadge, styles.badgePro]}>
        <MaterialCommunityIcons name="crown" size={13} color="#fff" />
        <Text style={styles.planBadgeText}>PRO</Text>
      </View>
    );
  }
  if (isProExpired) {
    return (
      <View style={[styles.planBadge, styles.badgeExpired]}>
        <MaterialCommunityIcons name="crown-off-outline" size={13} color="#fff" />
        <Text style={styles.planBadgeText}>VENCIDO</Text>
      </View>
    );
  }
  return (
    <View style={[styles.planBadge, styles.badgeDemo]}>
      <MaterialCommunityIcons name="star-outline" size={13} color="#fff" />
      <Text style={styles.planBadgeText}>DEMO</Text>
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────

export default function AdminUsersScreen({ navigation }) {
  const { users, loading } = useAdminUsers();
  const insets = useSafeAreaInsets();

  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [limitDialog, setLimitDialog] = useState(null);
  const [limitValue, setLimitValue] = useState('');
  const [actionDialog, setActionDialog] = useState(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(u =>
      (u.email       ?? '').toLowerCase().includes(term) ||
      (u.ownerName   ?? '').toLowerCase().includes(term) ||
      (u.businessName ?? '').toLowerCase().includes(term) ||
      (u.id          ?? '').toLowerCase().includes(term)
    );
  }, [users, search]);

  // ── Acciones ────────────────────────────────────────────────────────────────

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
    setLimitValue(String(u.quoteLimit ?? APP_CONFIG.demoQuoteLimit));
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
    const { isProActive, remainingDays } = getPlanStatus(user);
    if (!isProActive) return 0;
    return Math.max(0, remainingDays ?? 0);
  }

  function previewExpiryForRestore(user) {
    const remaining = user.proRemainingDays ?? 0;
    return formatDateAR(addDays(new Date(), remaining)) ?? '—';
  }

  function previewExpiryForNewPeriod(user, days) {
    const { isProActive, expiresAt } = getPlanStatus(user);
    const now = new Date();
    const base = isProActive && expiresAt && expiresAt > now ? expiresAt : now;
    return formatDateAR(addDays(base, days)) ?? '—';
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

  // ── Diálogos de acción ───────────────────────────────────────────────────────

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
      // Usar .isProActive en lugar de comparar el objeto con string
      const isExtension = getPlanStatus(user).isProActive;
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
              buttonColor="#2F9E44"
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
              buttonColor="#2F9E44"
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

  // ── Tarjeta de usuario (compacta) ────────────────────────────────────────────

  function renderUser({ item: u }) {
    const {
      status,
      isSuspended,
      isProActive,
      remainingDays: days,
      expiryDateFormatted: expiryDate,
    } = getPlanStatus(u);
    const isProExpired = status === 'pro_expired';
    const isDemo       = status === 'demo';

    const createdAt  = formatDateAR(u.createdAt);
    // Preferir lastLoginAt (si existe), caer a lastAccessAt
    const lastLogin  = formatRelativeTime(u.lastLoginAt ?? u.lastAccessAt);

    return (
      <Surface style={styles.userCard} elevation={1}>

        {/* ── Header: nombre + badge ── */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyLarge" style={styles.businessName} numberOfLines={1}>
              {u.businessName || u.ownerName || 'Sin nombre'}
            </Text>
            {u.ownerName && u.businessName ? (
              <Text style={styles.ownerName} numberOfLines={1}>{u.ownerName}</Text>
            ) : null}
            <Text style={styles.email} numberOfLines={1}>{u.email}</Text>
          </View>
          <PlanBadge
            isSuspended={isSuspended}
            isProActive={isProActive}
            isProExpired={isProExpired}
          />
        </View>

        {/* ── Meta: ID + fecha de alta ── */}
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="identifier" size={13} color={colors.textSecondary} />
          <Text style={styles.metaText}>
            {shortUid(u.id)}{createdAt ? `  ·  Alta: ${createdAt}` : ''}
          </Text>
        </View>

        {/* ── Último acceso ── */}
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="clock-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.metaText}>Último acceso: {lastLogin}</Text>
        </View>

        {/* ── Vencimiento Pro activo ── */}
        {isProActive && expiryDate && days !== null && (
          <View style={styles.expiryRow}>
            <MaterialCommunityIcons name="calendar-check-outline" size={13} color="#2F9E44" />
            <Text style={styles.expiryActive}>
              Vence: {expiryDate} · Restan {days} día{days !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* ── Pro vencido ── */}
        {isProExpired && expiryDate && days !== null && (
          <View style={styles.expiryRow}>
            <MaterialCommunityIcons name="calendar-alert" size={13} color={colors.error} />
            <Text style={styles.expiryExpired}>
              Venció: {expiryDate} · Hace {Math.abs(days)} día{Math.abs(days) !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* ── Días Pro guardados (Demo con días pendientes) ── */}
        {isDemo && (u.proRemainingDays ?? 0) > 0 && (
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="clock-check-outline" size={13} color={colors.warning} />
            <Text style={[styles.metaText, { color: colors.warning, fontWeight: '600' }]}>
              {u.proRemainingDays} días Pro guardados
            </Text>
          </View>
        )}

        {/* ── Stats compactos ── */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Este mes</Text>
            <Text style={styles.statValue}>
              {u.quotesThisMonth ?? 0} / {isProActive ? '∞' : (u.quoteLimit ?? APP_CONFIG.demoQuoteLimit)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total creados</Text>
            <Text style={styles.statValue}>{u.totalQuotes ?? 0}</Text>
          </View>
        </View>

        {/* ── Acciones ── */}
        <View style={styles.actions}>
          {/* Botones Pro */}
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

          {/* Botones secundarios en fila horizontal */}
          <View style={styles.actionRow}>
            {isProActive && !isSuspended && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.warning }]}
                onPress={() => handleDemoPress(u)}
              >
                <Text style={styles.actionBtnText}>Pasar a Demo</Text>
              </TouchableOpacity>
            )}

            {(isDemo || isProExpired) && !isSuspended && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => openLimitDialog(u)}
              >
                <Text style={styles.actionBtnText}>Cambiar límite</Text>
              </TouchableOpacity>
            )}

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

            {isSuspended && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#2F9E44' }]}
                onPress={() => handleReactivatePress(u)}
              >
                <Text style={styles.actionBtnText}>Reactivar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

      </Surface>
    );
  }

  // ── Render principal ──────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <AppLoader visible={actionLoading || loading} />

      {/* Header */}
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

      {/* Barra de búsqueda */}
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

      {/* Lista de usuarios — optimizada para cientos de items */}
      <FlatList
        data={filtered}
        keyExtractor={u => u.id}
        renderItem={renderUser}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Math.max(40, insets.bottom + 24) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={8}
        maxToRenderPerBatch={5}
        windowSize={5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-search-outline" size={48} color={colors.border} />
            <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
              {search ? 'Sin resultados para esa búsqueda' : 'No hay usuarios todavía'}
            </Text>
          </View>
        }
        ListFooterComponent={
          filtered.length > 0 ? (
            <Text style={styles.footerText}>
              {filtered.length} usuario{filtered.length !== 1 ? 's' : ''} mostrado{filtered.length !== 1 ? 's' : ''}
            </Text>
          ) : null
        }
      />

      {/* Diálogos */}
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

// ── Estilos ────────────────────────────────────────────────────────────────────

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

  searchWrapper: { paddingHorizontal: 20, paddingBottom: 10 },
  searchInput: { backgroundColor: colors.surface, fontSize: 14 },
  searchOutline: { borderRadius: 12 },

  list: { paddingHorizontal: 16, gap: 10, flexGrow: 1 },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },

  footerText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 12,
    paddingVertical: 12,
  },

  // ── Tarjeta ──
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    gap: 7,
  },

  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  businessName: { fontWeight: '700', color: colors.text, fontSize: 15 },
  ownerName: { color: colors.text, fontWeight: '500', fontSize: 12, marginTop: 1 },
  email: { color: colors.textSecondary, fontSize: 12, marginTop: 1 },

  // ── Badge ──
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeSuspended: { backgroundColor: '#E03131' },
  badgePro:       { backgroundColor: '#2F9E44' },
  badgeExpired:   { backgroundColor: '#868E96' },
  badgeDemo:      { backgroundColor: '#F08C00' },
  planBadgeText: { color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },

  // ── Meta rows ──
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: colors.textSecondary, fontSize: 12 },

  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  expiryActive:  { color: '#2F9E44', fontWeight: '600', fontSize: 12 },
  expiryExpired: { color: colors.error, fontWeight: '600', fontSize: 12 },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  statItem: { alignItems: 'center', flex: 1, gap: 2 },
  statLabel: { color: colors.textSecondary, fontSize: 10, textAlign: 'center' },
  statValue: { color: colors.text, fontWeight: '700', textAlign: 'center', fontSize: 13 },
  statDivider: { width: 1, height: 24, backgroundColor: colors.border },

  // ── Acciones ──
  actions: { gap: 7 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  proGroup: { gap: 5 },
  proGroupLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  proGroupBtns:  { flexDirection: 'row', gap: 7, flexWrap: 'wrap' },
  actionBtn: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 8, alignSelf: 'flex-start' },
  btnPro: { backgroundColor: '#2F9E44' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  // ── Diálogos ──
  dialog: { borderRadius: 20 },
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
