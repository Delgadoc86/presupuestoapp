import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import {
  Text,
  Button,
  Dialog,
  Portal,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppLoader from '../../components/common/AppLoader';
import QuoteCard from '../../components/quotes/QuoteCard';
import { openUpgradeEmail, openSuspendedEmail } from '../../utils/contactHelper';
import {
  deleteQuote,
  duplicateQuote,
  updateQuoteStatus,
} from '../../services/quotes.service';
import { getStatusActions, NEEDS_FOLLOWUP_STATUSES } from '../../utils/quoteStatus';
import { useHistoryQuotes } from '../../hooks/useHistoryQuotes';
import { useAuthContext } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import {
  QUOTE_STATUS,
  QUOTE_STATUS_LABEL,
  QUOTE_STATUS_COLOR,
} from '../../utils/constants';
import { formatQuoteNumber } from '../../utils/formatters';
import { timestampToDate } from '../../utils/dateUtils';
import { matchesSearch } from '../../utils/searchUtils';
import { colors } from '../../theme/colors';

// ── Opciones del modal ──────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { key: null,                  label: 'Todos' },
  { key: QUOTE_STATUS.DRAFT,    label: 'Borrador',   color: QUOTE_STATUS_COLOR.draft    },
  { key: QUOTE_STATUS.SENT,     label: 'Enviados',   color: QUOTE_STATUS_COLOR.sent     },
  { key: QUOTE_STATUS.ACCEPTED, label: 'Aceptados',  color: QUOTE_STATUS_COLOR.accepted },
  { key: QUOTE_STATUS.REJECTED, label: 'Rechazados', color: QUOTE_STATUS_COLOR.rejected },
  { key: QUOTE_STATUS.EXPIRED,  label: 'Vencidos',   color: QUOTE_STATUS_COLOR.expired  },
  { key: QUOTE_STATUS.PAID,     label: 'Pagados',    color: QUOTE_STATUS_COLOR.paid     },
];

const DATE_OPTIONS = [
  { key: null,     label: 'Todas las fechas'  },
  { key: 'today',  label: 'Hoy'               },
  { key: '7days',  label: 'Últimos 7 días'    },
  { key: 'month',  label: 'Este mes'           },
  { key: 'year',   label: 'Este año'           },
];

// ── Helpers de etiquetas para los pills de la barra ─────────────────────────

function getStatusPillLabel(key) {
  if (!key) return 'Todos';
  if (Array.isArray(key)) return 'Necesitan seguimiento';
  return QUOTE_STATUS_LABEL[key] ?? 'Todos';
}

function matchesStatusFilter(status, statusFilter) {
  if (!statusFilter) return true;
  return Array.isArray(statusFilter) ? statusFilter.includes(status) : status === statusFilter;
}

function getDatePillLabel(key) {
  const map = { today: 'Hoy', '7days': '7 días', month: 'Este mes', year: 'Este año' };
  return key ? (map[key] ?? 'Todas') : 'Todas';
}

// ── Agrupación temporal ─────────────────────────────────────────────────────

function getQuoteGroup(ts) {
  const d = timestampToDate(ts);
  if (!d) return 'Sin fecha';

  const now = new Date();
  const startOfToday     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfToday.getDate() - 1);
  const startOf7Days     = new Date(startOfToday); startOf7Days.setDate(startOfToday.getDate() - 6);
  const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1);

  const dDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (dDateOnly >= startOfToday)     return 'Hoy';
  if (dDateOnly >= startOfYesterday) return 'Ayer';
  if (dDateOnly >= startOf7Days)     return 'Esta semana';
  if (dDateOnly >= startOfMonth)     return 'Este mes';

  const raw = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function buildFlatList(quotes) {
  const result = [];
  let lastGroup = null;
  for (const q of quotes) {
    const group = getQuoteGroup(q.createdAt);
    if (group !== lastGroup) {
      result.push({ type: 'header', key: `__header_${group}`, label: group });
      lastGroup = group;
    }
    result.push({ type: 'item', key: q.id, quote: q });
  }
  return result;
}

// ── Componente principal ────────────────────────────────────────────────────

export default function HistoryScreen({ navigation }) {
  const { user } = useAuthContext();
  const { showSnackbar } = useAppContext();
  const insets = useSafeAreaInsets();

  // Filtros aplicados (los que alimentan la query Firestore)
  const [searchText,    setSearchText]    = useState('');
  const [statusFilter,  setStatusFilter]  = useState(null);
  const [dateFilter,    setDateFilter]    = useState(null);

  // Estado temporal del modal (se aplica solo al presionar "Aplicar")
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [tempStatus,  setTempStatus]  = useState(null);
  const [tempDate,    setTempDate]    = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [menuQuote,     setMenuQuote]     = useState(null);
  // { quote, to, label, message, muted? } | null — reemplaza el diálogo de
  // radio libre: cada acción viene del menú, ya sabe a qué estado va.
  const [confirmAction, setConfirmAction] = useState(null);

  const {
    quotes,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
    removeQuote,
    updateQuoteLocal,
  } = useHistoryQuotes({ statusFilter, dateFilter });

  const flatListRef = useRef(null);

  // Refresh al volver a esta pantalla
  const refreshRef = useRef(refresh);
  useEffect(() => { refreshRef.current = refresh; }, [refresh]);
  const isInitialFocusRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isInitialFocusRef.current) { isInitialFocusRef.current = false; return; }
      refreshRef.current();
    }, [])
  );

  // Scroll arriba al cambiar filtros aplicados
  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [statusFilter, dateFilter]);

  // ── Lista con búsqueda local ────────────────────────────────────────────

  const flatItems = useMemo(() => {
    const filtered = searchText.trim()
      ? quotes.filter(q => matchesSearch(q, searchText))
      : quotes;
    return buildFlatList(filtered);
  }, [quotes, searchText]);

  const visibleCount = useMemo(
    () => flatItems.filter(i => i.type === 'item').length,
    [flatItems]
  );

  const activeFilterCount = (statusFilter !== null ? 1 : 0) + (dateFilter !== null ? 1 : 0);
  const isNeedsFollowupActive = statusFilter === NEEDS_FOLLOWUP_STATUSES;

  function toggleNeedsFollowup() {
    setStatusFilter(prev => (prev === NEEDS_FOLLOWUP_STATUSES ? null : NEEDS_FOLLOWUP_STATUSES));
  }

  // ── Modal de filtros ────────────────────────────────────────────────────

  function openFilterModal() {
    setTempStatus(Array.isArray(statusFilter) ? null : statusFilter);
    setTempDate(dateFilter);
    setIsFilterModalVisible(true);
  }

  function closeFilterModal() {
    setIsFilterModalVisible(false);
  }

  function handleApplyFilters() {
    setStatusFilter(tempStatus);
    setDateFilter(tempDate);
    setIsFilterModalVisible(false);
    // useHistoryQuotes detecta el cambio y resetea + recarga automáticamente
  }

  function handleClearFilters() {
    setTempStatus(null);
    setTempDate(null);
    setStatusFilter(null);
    setDateFilter(null);
    setIsFilterModalVisible(false);
  }

  // ── Acciones de tarjeta ─────────────────────────────────────────────────

  function openMenu(quote) { setMenuQuote(quote); }
  function closeMenu()     { setMenuQuote(null);  }

  function handleViewDetail() {
    const q = menuQuote; closeMenu();
    navigation.navigate('QuoteDetailHistory', { quoteId: q.id });
  }

  function handleEdit() {
    const q = menuQuote; closeMenu();
    navigation.navigate('QuoteForm', { quote: q });
  }

  async function handleDuplicate() {
    const q = menuQuote; closeMenu();
    setActionLoading(true);
    try {
      const newId = await duplicateQuote(user.uid, q);
      await refresh();
      showSnackbar('Presupuesto duplicado', 'success');
      navigation.navigate('QuoteDetailHistory', { quoteId: newId });
    } catch (error) {
      if (error.code === 'account_suspended') {
        Alert.alert('Cuenta suspendida', 'Tu cuenta está suspendida. Contactá al soporte para reactivarla.', [
          { text: 'Contactar soporte', onPress: () => openSuspendedEmail(user.email) },
          { text: 'Cancelar', style: 'cancel' },
        ]);
      } else if (error.code === 'demo_limit_reached') {
        Alert.alert('Límite alcanzado', 'Alcanzaste el límite de presupuestos del plan Demo este mes. Activá PresúFácil Pro para presupuestos ilimitados.', [
          { text: 'Activar Pro', onPress: () => openUpgradeEmail(user.email) },
          { text: 'Cancelar', style: 'cancel' },
        ]);
      } else {
        showSnackbar('No se pudo duplicar', 'error');
      }
    } finally {
      setActionLoading(false);
    }
  }

  // Acciones disponibles para el presupuesto del menú abierto — mismo origen
  // (STATUS_ACTIONS en quoteStatus.js) que QuoteDetailScreen.
  const menuStatusActions = menuQuote ? getStatusActions(menuQuote.status) : [];

  function requestStatusChange(action) {
    const q = menuQuote; closeMenu();
    setConfirmAction({ ...action, quote: q });
  }

  async function confirmStatusChange() {
    const action = confirmAction;
    setConfirmAction(null);
    if (!action) return;
    setActionLoading(true);
    try {
      await updateQuoteStatus(action.quote.id, action.to);
      if (!matchesStatusFilter(action.to, statusFilter)) {
        removeQuote(action.quote.id);
      } else {
        updateQuoteLocal(action.quote.id, { status: action.to });
      }
      showSnackbar(`Estado actualizado a ${QUOTE_STATUS_LABEL[action.to]}`, 'success');
    } catch (error) {
      if (error?.code === 'invalid_status_transition') {
        showSnackbar('El estado cambió mientras tanto — actualizá la lista e intentá de nuevo.', 'error');
      } else {
        showSnackbar('No se pudo actualizar el estado', 'error');
      }
    } finally {
      setActionLoading(false);
    }
  }

  function handleDelete() {
    const q = menuQuote; closeMenu();
    Alert.alert(
      'Eliminar presupuesto',
      `¿Eliminar ${formatQuoteNumber(q.quoteNumber)}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await deleteQuote(q.id);
              removeQuote(q.id);
              showSnackbar('Presupuesto eliminado', 'success');
            } catch {
              showSnackbar('No se pudo eliminar', 'error');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }

  // ── Render helpers ──────────────────────────────────────────────────────

  function renderItem({ item }) {
    if (item.type === 'header') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{item.label}</Text>
        </View>
      );
    }
    return (
      <QuoteCard
        quote={item.quote}
        onPress={() => navigation.navigate('QuoteDetailHistory', { quoteId: item.quote.id })}
        onOptions={() => openMenu(item.quote)}
      />
    );
  }

  function renderEmpty() {
    if (loading) return null;

    let title = 'Todavía no tenés presupuestos';
    let sub   = '¡Creá el primero desde la pestaña Presupuesto!';

    if (searchText.trim()) {
      title = 'Sin coincidencias en los resultados cargados';
      sub   = 'Probá cargar más resultados o cambiar los filtros para ampliar la búsqueda.';
    } else if (activeFilterCount > 0) {
      const statusLabel = statusFilter ? getStatusPillLabel(statusFilter).toLowerCase() : null;
      title = statusLabel
        ? `No hay presupuestos ${statusLabel} en este período`
        : 'No hay presupuestos en este período';
      sub = 'Probá cambiando el filtro de estado o fecha';
    }

    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="clipboard-text-off-outline" size={56} color={colors.border} />
        <Text variant="bodyLarge"  style={styles.emptyTitle}>{title}</Text>
        <Text variant="bodySmall"  style={styles.emptySubtitle}>{sub}</Text>
      </View>
    );
  }

  function renderFooter() {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text variant="bodySmall" style={styles.footerText}>Cargando más...</Text>
        </View>
      );
    }
    if (hasMore) {
      return (
        <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore} activeOpacity={0.7}>
          <Text variant="labelLarge" style={styles.loadMoreText}>Cargar más</Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color={colors.primary} />
        </TouchableOpacity>
      );
    }
    if (visibleCount > 0) {
      return (
        <Text style={styles.noMoreText}>
          {visibleCount} presupuesto{visibleCount !== 1 ? 's' : ''} en total
        </Text>
      );
    }
    return null;
  }

  const countLabel = statusFilter
    ? `${visibleCount} ${getStatusPillLabel(statusFilter).toLowerCase()}`
    : `${visibleCount} presupuesto${visibleCount !== 1 ? 's' : ''}`;

  // ── JSX ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <AppLoader visible={actionLoading} />

      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>Historial</Text>
        {!loading && <Text variant="bodySmall" style={styles.count}>{countLabel}</Text>}
      </View>

      {/* Buscador */}
      <View style={styles.searchWrapper}>
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          mode="outlined"
          dense
          placeholder="Buscar cliente o monto..."
          left={<TextInput.Icon icon="magnify" color={colors.primary} />}
          right={
            searchText
              ? <TextInput.Icon icon="close" onPress={() => setSearchText('')} color={colors.textSecondary} />
              : null
          }
          style={styles.searchInput}
          outlineStyle={styles.searchOutline}
        />
      </View>

      {/* Barra de filtros compacta — scrollea horizontal si no entra */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        {/* Pill: Necesitan seguimiento (enviados + vencidos, atajo de un toque) */}
        <TouchableOpacity
          style={[styles.filterPill, styles.filterPillFixed, isNeedsFollowupActive && styles.filterPillActive]}
          onPress={toggleNeedsFollowup}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="clock-alert-outline"
            size={15}
            color={isNeedsFollowupActive ? '#fff' : colors.warning}
          />
          <Text
            style={[styles.filterPillText, isNeedsFollowupActive && styles.filterPillTextActive]}
            numberOfLines={1}
          >
            Necesitan seguimiento
          </Text>
        </TouchableOpacity>

        {/* Pill: Estado */}
        <TouchableOpacity
          style={[styles.filterPill, styles.filterPillFixed, statusFilter && !isNeedsFollowupActive && styles.filterPillActive]}
          onPress={openFilterModal}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.filterPillText, statusFilter && !isNeedsFollowupActive && styles.filterPillTextActive]}
            numberOfLines={1}
          >
            Estado: {isNeedsFollowupActive ? 'Todos' : getStatusPillLabel(statusFilter)}
          </Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={15}
            color={statusFilter && !isNeedsFollowupActive ? '#fff' : colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Pill: Fecha */}
        <TouchableOpacity
          style={[styles.filterPill, styles.filterPillFixed, dateFilter && styles.filterPillActive]}
          onPress={openFilterModal}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.filterPillText, dateFilter && styles.filterPillTextActive]}
            numberOfLines={1}
          >
            Fecha: {getDatePillLabel(dateFilter)}
          </Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={15}
            color={dateFilter ? '#fff' : colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Botón ícono con badge */}
        <TouchableOpacity style={styles.filterIconBtn} onPress={openFilterModal} activeOpacity={0.7}>
          <MaterialCommunityIcons
            name="tune-variant"
            size={20}
            color={activeFilterCount > 0 ? colors.primary : colors.textSecondary}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Lista */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodySmall" style={styles.footerText}>Cargando presupuestos...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={flatItems}
          keyExtractor={item => item.key}
          contentContainerStyle={[styles.list, flatItems.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={12}
          maxToRenderPerBatch={8}
          windowSize={5}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          renderItem={renderItem}
        />
      )}

      {/* ── Modal de filtros ── */}
      <Modal
        visible={isFilterModalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={closeFilterModal}
      >
        <View style={styles.modalOverlay}>
          {/* Fondo semitransparente: toca para cerrar sin aplicar */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeFilterModal}
          />

          {/* Panel inferior */}
          <View style={[
            styles.modalPanel,
            { paddingBottom: Math.max(insets.bottom + 8, 24) },
          ]}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Encabezado */}
            <View style={styles.modalHeader}>
              <Text variant="titleMedium" style={styles.modalTitle}>Filtros</Text>
              <TouchableOpacity
                onPress={closeFilterModal}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Opciones con scroll si la pantalla es pequeña */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Sección Estado */}
              <Text style={styles.modalSectionLabel}>ESTADO</Text>
              {STATUS_OPTIONS.map(opt => (
                <OptionRow
                  key={String(opt.key)}
                  label={opt.label}
                  dotColor={opt.color}
                  selected={tempStatus === opt.key}
                  onPress={() => setTempStatus(opt.key)}
                />
              ))}

              {/* Sección Fecha */}
              <Text style={[styles.modalSectionLabel, { marginTop: 20 }]}>FECHA</Text>
              {DATE_OPTIONS.map(opt => (
                <OptionRow
                  key={String(opt.key)}
                  label={opt.label}
                  selected={tempDate === opt.key}
                  onPress={() => setTempDate(opt.key)}
                />
              ))}
            </ScrollView>

            {/* Botones de acción */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearBtn} onPress={handleClearFilters} activeOpacity={0.7}>
                <Text style={styles.clearBtnText}>Limpiar todo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={handleApplyFilters} activeOpacity={0.7}>
                <Text style={styles.applyBtnText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Dialog: menú de acciones ── */}
      <Portal>
        <Dialog visible={!!menuQuote} onDismiss={closeMenu} style={styles.dialog}>
          <Dialog.Title>
            {menuQuote ? formatQuoteNumber(menuQuote.quoteNumber) : ''}
          </Dialog.Title>
          <Dialog.Content style={styles.menuContent}>
            <MenuOption icon="eye-outline"      color={colors.primary}   label="Ver detalle"    onPress={handleViewDetail}       />
            <MenuOption icon="file-pdf-box"     color="#E03131"          label="Compartir PDF"  onPress={handleViewDetail}       />
            <MenuOption icon="pencil-outline"   color={colors.primary}   label="Editar"         onPress={handleEdit}             />
            <MenuOption icon="content-copy"     color={colors.secondary} label="Duplicar"       onPress={handleDuplicate}        />
            {/* Acciones de estado contextuales — solo las transiciones válidas
                desde el estado actual (mismo origen que QuoteDetailScreen). */}
            {menuStatusActions.map(action => (
              <MenuOption
                key={action.to}
                icon="tag-outline"
                color={action.muted ? colors.textSecondary : colors.warning}
                label={action.label}
                onPress={() => requestStatusChange(action)}
              />
            ))}
            <MenuOption icon="trash-can-outline" color={colors.error}    label="Eliminar"       labelColor={colors.error} onPress={handleDelete} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeMenu}>Cancelar</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Dialog: confirmación de cambio de estado */}
        <Dialog visible={!!confirmAction} onDismiss={() => setConfirmAction(null)} style={styles.dialog}>
          <Dialog.Title>{confirmAction?.label}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
              {confirmAction?.message}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmAction(null)}>Cancelar</Button>
            <Button onPress={confirmStatusChange}>Confirmar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

// ── Subcomponentes ──────────────────────────────────────────────────────────

function OptionRow({ label, dotColor, selected, onPress }) {
  return (
    <TouchableOpacity style={styles.optionRow} onPress={onPress} activeOpacity={0.7}>
      {dotColor !== undefined && (
        <View style={[styles.optionDot, { backgroundColor: dotColor }]} />
      )}
      <Text style={[styles.optionLabel, selected && styles.optionLabelActive]}>
        {label}
      </Text>
      {selected && (
        <MaterialCommunityIcons name="check" size={18} color={colors.primary} />
      )}
    </TouchableOpacity>
  );
}

function MenuOption({ icon, color, label, labelColor, onPress }) {
  return (
    <TouchableOpacity style={styles.menuOption} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: `${color}18` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text variant="bodyLarge" style={[styles.menuLabel, labelColor && { color: labelColor }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: { fontWeight: '700', color: colors.text },
  count: { color: colors.textSecondary, marginBottom: 2 },

  // Búsqueda
  searchWrapper: { paddingHorizontal: 20, marginBottom: 10 },
  searchInput:   { backgroundColor: colors.surface, fontSize: 14 },
  searchOutline: { borderRadius: 16, borderColor: colors.border },

  // ── Barra de filtros compacta ──
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  // Ya no hay un ancho de fila fijo que repartir (la barra scrollea
  // horizontal) — cada pill toma su ancho natural y no se achica.
  filterPillFixed: {
    flexShrink: 0,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#fff',
  },
  filterIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  filterBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
  },

  // Lista
  list:      { paddingHorizontal: 20, paddingBottom: 24, gap: 8 },
  listEmpty: { flexGrow: 1 },

  // Encabezados de sección
  sectionHeader: { marginTop: 8, marginBottom: 4 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Loading / footer
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  footerLoader:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingVertical: 20 },
  footerText:       { color: colors.textSecondary },
  loadMoreBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  loadMoreText: { color: colors.primary, fontWeight: '600' },
  noMoreText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 12,
    paddingVertical: 16,
  },

  // Empty state
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle:     { fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
  emptySubtitle:  { color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 32, lineHeight: 18 },

  // ── Modal de filtros ──
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: '82%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontWeight: '700', color: colors.text },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 6,
  },

  // Filas de opciones dentro del modal
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.textSecondary,
  },
  optionLabelActive: {
    color: colors.text,
    fontWeight: '600',
  },

  // Botones del modal
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  clearBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  applyBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Dialog de acciones
  dialog: { borderRadius: 20 },
  menuContent: { gap: 2, paddingTop: 8 },
  menuOption: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 9 },
  menuIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { color: colors.text, fontWeight: '500' },
});
