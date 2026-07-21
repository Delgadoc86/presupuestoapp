import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import {
  Text,
  FAB,
  Dialog,
  Portal,
  Button,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import EmptyState from '../../components/common/EmptyState';
import AppLoader from '../../components/common/AppLoader';
import ClientCard from '../../components/clients/ClientCard';
import { useClients } from '../../hooks/useClients';
import { archiveClient, restoreClient } from '../../services/clients.service';
import { useAppContext } from '../../context/AppContext';
import { matchesClientSearch } from '../../utils/searchUtils';
import { colors } from '../../theme/colors';

export default function ClientListScreen({ navigation }) {
  const theme = useTheme();
  const { clients, loading } = useClients();
  const { showSnackbar } = useAppContext();

  const [search, setSearch] = useState('');
  const [view, setView] = useState('active'); // 'active' | 'archived'
  const [menuClient, setMenuClient] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const filtered = useMemo(() => {
    const byView = clients.filter(c => (view === 'archived' ? c.archived : !c.archived));
    const term = search.trim();
    return term ? byView.filter(c => matchesClientSearch(c, term)) : byView;
  }, [clients, view, search]);

  const activeCount = useMemo(() => clients.filter(c => !c.archived).length, [clients]);
  const archivedCount = useMemo(() => clients.filter(c => c.archived).length, [clients]);

  function openMenu(client) { setMenuClient(client); }
  function closeMenu() { setMenuClient(null); }

  function handleViewDetail(client) {
    navigation.navigate('ClientDetail', { clientId: client.id });
  }

  function handleEdit() {
    const c = menuClient; closeMenu();
    navigation.navigate('ClientForm', { client: c });
  }

  async function handleArchive() {
    const c = menuClient; closeMenu();
    setActionLoading(true);
    try {
      await archiveClient(c.id);
      showSnackbar('Cliente archivado', 'success');
    } catch {
      showSnackbar('No se pudo archivar el cliente', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRestore(client) {
    setActionLoading(true);
    try {
      await restoreClient(client.id);
      showSnackbar('Cliente restaurado', 'success');
    } catch {
      showSnackbar('No se pudo restaurar el cliente', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  function renderItem({ item }) {
    if (view === 'archived') {
      return (
        <View style={styles.archivedRow}>
          <View style={{ flex: 1 }}>
            <ClientCard client={item} onPress={() => handleViewDetail(item)} archived />
          </View>
          <TouchableOpacity
            style={styles.restoreBtn}
            onPress={() => handleRestore(item)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="backup-restore" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <ClientCard
        client={item}
        onPress={() => handleViewDetail(item)}
        onOptions={() => openMenu(item)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppLoader visible={actionLoading} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Clientes</Text>
      </View>

      {/* Buscador */}
      <View style={styles.searchWrapper}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          mode="outlined"
          dense
          placeholder="Buscar por nombre o teléfono..."
          left={<TextInput.Icon icon="magnify" color={colors.primary} />}
          right={
            search
              ? <TextInput.Icon icon="close" onPress={() => setSearch('')} color={colors.textSecondary} />
              : null
          }
          style={styles.searchInput}
          outlineStyle={styles.searchOutline}
        />
      </View>

      {/* Toggle Activos / Archivados */}
      <View style={styles.toggleBar}>
        <TouchableOpacity
          style={[styles.togglePill, view === 'active' && styles.togglePillActive]}
          onPress={() => setView('active')}
          activeOpacity={0.7}
        >
          <Text style={[styles.togglePillText, view === 'active' && styles.togglePillTextActive]}>
            Activos ({activeCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.togglePill, view === 'archived' && styles.togglePillActive]}
          onPress={() => setView('archived')}
          activeOpacity={0.7}
        >
          <Text style={[styles.togglePillText, view === 'archived' && styles.togglePillTextActive]}>
            Archivados ({archivedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, filtered.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            view === 'archived' ? (
              <EmptyState
                icon="archive-outline"
                title="No hay clientes archivados"
                description="Los clientes que archivés desde su ficha van a aparecer acá."
              />
            ) : (
              <EmptyState
                icon="account-multiple-outline"
                title={search ? 'Sin coincidencias' : 'Todavía no tenés clientes'}
                description={
                  search
                    ? 'Probá con otro nombre o teléfono.'
                    : 'Creá tu primer cliente para poder elegirlo al armar un presupuesto.'
                }
                actionLabel={search ? undefined : 'Nuevo cliente'}
                onAction={search ? undefined : () => navigation.navigate('ClientForm', {})}
              />
            )
          }
        />
      )}

      {/* FAB */}
      {!loading && view === 'active' && (
        <FAB
          icon="plus"
          label="Nuevo cliente"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={colors.white}
          onPress={() => navigation.navigate('ClientForm', {})}
        />
      )}

      {/* Diálogo: menú de acciones */}
      <Portal>
        <Dialog visible={!!menuClient} onDismiss={closeMenu} style={styles.dialog}>
          <Dialog.Title>{menuClient?.name}</Dialog.Title>
          <Dialog.Content style={styles.menuContent}>
            <MenuOption icon="pencil-outline" color={colors.primary} label="Editar" onPress={handleEdit} />
            <MenuOption icon="archive-outline" color={colors.warning} label="Archivar" onPress={handleArchive} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeMenu}>Cancelar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

function MenuOption({ icon, color, label, onPress }) {
  return (
    <TouchableOpacity style={styles.menuOption} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: `${color}18` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text variant="bodyLarge" style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },

  searchWrapper: { paddingHorizontal: 20, marginBottom: 10 },
  searchInput: { backgroundColor: colors.surface, fontSize: 14 },
  searchOutline: { borderRadius: 16, borderColor: colors.border },

  toggleBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  togglePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  togglePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  togglePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  togglePillTextActive: {
    color: '#fff',
  },

  loadingContainer: { flex: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 100, gap: 10 },
  listEmpty: { flexGrow: 1 },

  archivedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  restoreBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    borderRadius: 16,
  },

  dialog: { borderRadius: 20 },
  menuContent: { gap: 2, paddingTop: 8 },
  menuOption: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 9 },
  menuIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { color: colors.text, fontWeight: '500' },
});
