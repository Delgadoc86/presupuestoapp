import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, Surface, Button, Dialog, Portal, RadioButton, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppLoader from '../../components/common/AppLoader';
import QuoteCard from '../../components/quotes/QuoteCard';
import { openUpgradeEmail, openSuspendedEmail } from '../../utils/contactHelper';
import {
  deleteQuote,
  duplicateQuote,
  updateQuoteStatus,
} from '../../services/quotes.service';
import { useQuotes } from '../../hooks/useQuotes';
import { useAuthContext } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import {
  QUOTE_STATUS,
  QUOTE_STATUS_LABEL,
  QUOTE_STATUS_COLOR,
} from '../../utils/constants';
import { formatQuoteNumber } from '../../utils/formatters';
import { colors } from '../../theme/colors';

const STATUS_FILTERS = [
  { key: null, label: 'Todos' },
  { key: QUOTE_STATUS.DRAFT, label: 'Borrador' },
  { key: QUOTE_STATUS.SENT, label: 'Enviados' },
  { key: QUOTE_STATUS.ACCEPTED, label: 'Aceptados' },
  { key: QUOTE_STATUS.REJECTED, label: 'Rechazados' },
  { key: QUOTE_STATUS.PAID, label: 'Pagados' },
];

const STATUS_ORDER = [
  QUOTE_STATUS.DRAFT,
  QUOTE_STATUS.SENT,
  QUOTE_STATUS.ACCEPTED,
  QUOTE_STATUS.REJECTED,
  QUOTE_STATUS.PAID,
];

export default function HistoryScreen({ navigation }) {
  const { user } = useAuthContext();
  const { quotes, loading: quotesLoading } = useQuotes();
  const { showSnackbar } = useAppContext();

  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Menú de acciones de la card
  const [menuQuote, setMenuQuote] = useState(null);

  // Dialog cambio de estado
  const [statusDialogQuote, setStatusDialogQuote] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');

  // ── Lista filtrada y buscada ──────────────────────────────
  const filteredQuotes = useMemo(() => {
    let result = quotes;

    if (filterStatus) {
      result = result.filter(q => q.status === filterStatus);
    }

    if (searchText.trim()) {
      const term = searchText.trim().toLowerCase();
      result = result.filter(
        q =>
          q.client?.name?.toLowerCase().includes(term) ||
          formatQuoteNumber(q.quoteNumber).toLowerCase().includes(term)
      );
    }

    return result;
  }, [quotes, filterStatus, searchText]);

  // ── Acciones ──────────────────────────────────────────────
  function openMenu(quote) {
    setMenuQuote(quote);
  }

  function closeMenu() {
    setMenuQuote(null);
  }

  function handleEdit() {
    const q = menuQuote;
    closeMenu();
    navigation.navigate('QuoteForm', { quote: q });
  }

  async function handleDuplicate() {
    const q = menuQuote;
    closeMenu();
    setActionLoading(true);
    try {
      const newId = await duplicateQuote(user.uid, q);
      showSnackbar('Presupuesto duplicado', 'success');
      navigation.navigate('QuoteDetailHistory', { quoteId: newId });
    } catch (error) {
      if (error.code === 'account_suspended') {
        Alert.alert(
          'Cuenta suspendida',
          'Tu cuenta está suspendida. Contactá al soporte para reactivarla.',
          [
            { text: 'Contactar soporte', onPress: () => openSuspendedEmail(user.email) },
            { text: 'Cancelar', style: 'cancel' },
          ]
        );
      } else if (error.code === 'demo_limit_reached') {
        Alert.alert(
          'Límite alcanzado',
          'Alcanzaste el límite de presupuestos del plan Demo este mes. Activá PresúFácil Pro para presupuestos ilimitados.',
          [
            { text: 'Activar Pro', onPress: () => openUpgradeEmail(user.email) },
            { text: 'Cancelar', style: 'cancel' },
          ]
        );
      } else {
        showSnackbar('No se pudo duplicar', 'error');
      }
    } finally {
      setActionLoading(false);
    }
  }

  function handleOpenStatusDialog() {
    const q = menuQuote;
    closeMenu();
    setSelectedStatus(q.status);
    setStatusDialogQuote(q);
  }

  async function handleStatusChange() {
    if (selectedStatus === statusDialogQuote.status) {
      setStatusDialogQuote(null);
      return;
    }
    setActionLoading(true);
    setStatusDialogQuote(null);
    try {
      await updateQuoteStatus(statusDialogQuote.id, selectedStatus);
      showSnackbar(`Estado cambiado a ${QUOTE_STATUS_LABEL[selectedStatus]}`, 'success');
    } catch {
      showSnackbar('No se pudo actualizar el estado', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  function handleDelete() {
    const q = menuQuote;
    closeMenu();
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

  // ── Render ────────────────────────────────────────────────
  function renderEmpty() {
    if (quotesLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="clipboard-text-off-outline"
          size={56}
          color={colors.border}
        />
        <Text variant="bodyLarge" style={styles.emptyTitle}>
          {searchText || filterStatus ? 'Sin resultados' : 'Todavía no hay presupuestos'}
        </Text>
        <Text variant="bodySmall" style={styles.emptySubtitle}>
          {searchText || filterStatus
            ? 'Probá cambiando el filtro o la búsqueda'
            : 'Creá tu primer presupuesto desde la pestaña +'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppLoader visible={actionLoading} />

      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Historial
        </Text>
        <Text variant="bodySmall" style={styles.count}>
          {filteredQuotes.length} presupuesto{filteredQuotes.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Buscador */}
      <View style={styles.searchWrapper}>
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          mode="outlined"
          dense
          placeholder="Buscar por cliente o número..."
          left={<TextInput.Icon icon="magnify" color={colors.textSecondary} />}
          right={
            searchText
              ? <TextInput.Icon icon="close" onPress={() => setSearchText('')} color={colors.textSecondary} />
              : null
          }
          style={styles.searchInput}
          outlineStyle={styles.searchOutline}
        />
      </View>

      {/* Chips de filtro */}
      <View style={styles.filtersRow}>
        {STATUS_FILTERS.map(f => {
          const active = filterStatus === f.key;
          const chipColor = f.key ? QUOTE_STATUS_COLOR[f.key] : colors.primary;
          return (
            <TouchableOpacity
              key={String(f.key)}
              onPress={() => setFilterStatus(active ? null : f.key)}
              style={[
                styles.chip,
                active && { backgroundColor: chipColor, borderColor: chipColor },
              ]}
              activeOpacity={0.7}
            >
              {f.key && (
                <View
                  style={[
                    styles.chipDot,
                    { backgroundColor: active ? '#fff' : chipColor },
                  ]}
                />
              )}
              <Text
                variant="labelMedium"
                style={[styles.chipLabel, active && { color: '#fff' }]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Lista */}
      <FlatList
        data={filteredQuotes}
        keyExtractor={q => q.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        renderItem={({ item: q }) => (
          <QuoteCard
            quote={q}
            onPress={() => navigation.navigate('QuoteDetailHistory', { quoteId: q.id })}
            onOptions={() => openMenu(q)}
          />
        )}
      />

      {/* Dialog: menú de acciones */}
      <Portal>
        <Dialog
          visible={!!menuQuote}
          onDismiss={closeMenu}
          style={styles.dialog}
        >
          <Dialog.Title>
            {menuQuote ? formatQuoteNumber(menuQuote.quoteNumber) : ''}
          </Dialog.Title>
          <Dialog.Content style={styles.menuContent}>
            <TouchableOpacity style={styles.menuOption} onPress={handleEdit} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: `${colors.primary}18` }]}>
                <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.primary} />
              </View>
              <Text variant="bodyLarge" style={styles.menuLabel}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOption} onPress={handleDuplicate} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: `${colors.secondary}18` }]}>
                <MaterialCommunityIcons name="content-copy" size={22} color={colors.secondary} />
              </View>
              <Text variant="bodyLarge" style={styles.menuLabel}>Duplicar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOption} onPress={handleOpenStatusDialog} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: `${colors.warning}18` }]}>
                <MaterialCommunityIcons name="tag-outline" size={22} color={colors.warning} />
              </View>
              <Text variant="bodyLarge" style={styles.menuLabel}>Cambiar estado</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOption} onPress={handleDelete} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: `${colors.error}18` }]}>
                <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.error} />
              </View>
              <Text variant="bodyLarge" style={[styles.menuLabel, { color: colors.error }]}>
                Eliminar
              </Text>
            </TouchableOpacity>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeMenu}>Cancelar</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Dialog: cambio de estado */}
        <Dialog
          visible={!!statusDialogQuote}
          onDismiss={() => setStatusDialogQuote(null)}
          style={styles.dialog}
        >
          <Dialog.Title>Cambiar estado</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={setSelectedStatus} value={selectedStatus}>
              {STATUS_ORDER.map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSelectedStatus(s)}
                  style={styles.radioOption}
                  activeOpacity={0.7}
                >
                  <RadioButton.Android value={s} color={QUOTE_STATUS_COLOR[s]} />
                  <View style={styles.radioLabel}>
                    <View style={[styles.statusDot, { backgroundColor: QUOTE_STATUS_COLOR[s] }]} />
                    <Text variant="bodyLarge" style={{ color: colors.text }}>
                      {QUOTE_STATUS_LABEL[s]}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setStatusDialogQuote(null)}>Cancelar</Button>
            <Button onPress={handleStatusChange}>Confirmar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontWeight: '700',
    color: colors.text,
  },
  count: {
    color: colors.textSecondary,
    marginBottom: 2,
  },
  // Búsqueda
  searchWrapper: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: colors.surface,
    fontSize: 14,
  },
  searchOutline: {
    borderRadius: 12,
  },
  // Chips
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  chipLabel: {
    color: colors.text,
    fontWeight: '500',
  },
  // Lista
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
    flexGrow: 1,
  },
  // Estado vacío
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 18,
  },
  // Dialog acciones
  dialog: {
    borderRadius: 20,
  },
  menuContent: {
    gap: 4,
    paddingTop: 8,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    color: colors.text,
    fontWeight: '500',
  },
  // Dialog estado
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  radioLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
