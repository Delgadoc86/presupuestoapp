import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Surface, Button, Dialog, Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppLoader from '../../components/common/AppLoader';
import QuoteCard from '../../components/quotes/QuoteCard';
import { useClients } from '../../hooks/useClients';
import { useClientQuotes } from '../../hooks/useClientQuotes';
import { archiveClient, restoreClient } from '../../services/clients.service';
import { useAppContext } from '../../context/AppContext';
import { colors } from '../../theme/colors';

export default function ClientDetailScreen({ navigation, route }) {
  const { clientId } = route.params;
  const { clients } = useClients();
  const { quotes, loading: quotesLoading } = useClientQuotes(clientId);
  const { showSnackbar } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [archiveDialogVisible, setArchiveDialogVisible] = useState(false);

  const client = clients.find(c => c.id === clientId) ?? null;

  if (!client) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text variant="titleLarge" style={styles.headerTitle}>Cliente</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centered}>
          <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
            Cliente no encontrado
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  async function handleArchive() {
    setArchiveDialogVisible(false);
    setLoading(true);
    try {
      await archiveClient(client.id);
      showSnackbar('Cliente archivado', 'success');
      navigation.goBack();
    } catch {
      showSnackbar('No se pudo archivar el cliente', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    setLoading(true);
    try {
      await restoreClient(client.id);
      showSnackbar('Cliente restaurado', 'success');
    } catch {
      showSnackbar('No se pudo restaurar el cliente', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleNewQuoteForClient() {
    navigation.navigate('NewQuote', {
      screen: 'QuoteForm',
      params: {
        presetClient: {
          id: client.id,
          name: client.name,
          phone: client.phone,
          email: client.email,
          address: client.address,
        },
      },
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppLoader visible={loading} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="titleLarge" style={styles.headerTitle} numberOfLines={1}>
          {client.name}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('ClientForm', { client })}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {client.archived && (
          <View style={styles.archivedBanner}>
            <MaterialCommunityIcons name="archive-outline" size={16} color="#fff" />
            <Text style={styles.archivedBannerText}>Cliente archivado</Text>
          </View>
        )}

        {/* Ficha */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="labelMedium" style={styles.sectionTitle}>DATOS</Text>
          {!!client.phone && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="phone-outline" size={16} color={colors.textSecondary} />
              <Text variant="bodyMedium" style={styles.infoText}>{client.phone}</Text>
            </View>
          )}
          {!!client.email && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="email-outline" size={16} color={colors.textSecondary} />
              <Text variant="bodyMedium" style={styles.infoText}>{client.email}</Text>
            </View>
          )}
          {!!client.address && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.textSecondary} />
              <Text variant="bodyMedium" style={styles.infoText}>{client.address}</Text>
            </View>
          )}
          {!client.phone && !client.email && !client.address && (
            <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
              Sin más datos de contacto cargados.
            </Text>
          )}
        </Surface>

        {!!client.notes && (
          <Surface style={styles.card} elevation={1}>
            <Text variant="labelMedium" style={styles.sectionTitle}>NOTAS</Text>
            <Text variant="bodyMedium" style={{ color: colors.text, lineHeight: 22 }}>
              {client.notes}
            </Text>
          </Surface>
        )}

        {/* Acciones */}
        {!client.archived ? (
          <>
            <Button
              mode="contained"
              icon="plus-circle-outline"
              onPress={handleNewQuoteForClient}
              style={styles.actionBtn}
            >
              Nuevo presupuesto para este cliente
            </Button>
            <Button
              mode="outlined"
              icon="archive-outline"
              textColor={colors.warning}
              onPress={() => setArchiveDialogVisible(true)}
              style={styles.actionBtn}
            >
              Archivar cliente
            </Button>
          </>
        ) : (
          <Button
            mode="contained"
            icon="backup-restore"
            onPress={handleRestore}
            style={styles.actionBtn}
          >
            Restaurar cliente
          </Button>
        )}

        {/* Historial */}
        <View style={styles.historySection}>
          <Text variant="labelMedium" style={styles.sectionTitle}>
            HISTORIAL DE PRESUPUESTOS {quotesLoading ? '' : `(${quotes.length})`}
          </Text>
          {quotesLoading ? null : quotes.length === 0 ? (
            <Surface style={styles.emptyHistory} elevation={0}>
              <MaterialCommunityIcons name="clipboard-text-off-outline" size={40} color={colors.border} />
              <Text variant="bodyMedium" style={{ color: colors.textSecondary, textAlign: 'center' }}>
                Este cliente todavía no tiene presupuestos.
              </Text>
            </Surface>
          ) : (
            <View style={{ gap: 8 }}>
              {quotes.map(quote => (
                <QuoteCard
                  key={quote.id}
                  quote={quote}
                  onPress={() => navigation.navigate('QuoteDetailClients', { quoteId: quote.id })}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={archiveDialogVisible} onDismiss={() => setArchiveDialogVisible(false)} style={styles.dialog}>
          <Dialog.Title>Archivar cliente</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
              {quotes.length > 0
                ? `Este cliente tiene ${quotes.length} presupuesto${quotes.length !== 1 ? 's' : ''}. Al archivarlo, esos presupuestos conservan todos sus datos, pero el cliente ya no va a aparecer en el selector para nuevos presupuestos. Podés restaurarlo cuando quieras.`
                : 'El cliente ya no va a aparecer en el selector para nuevos presupuestos. Podés restaurarlo cuando quieras.'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setArchiveDialogVisible(false)}>Cancelar</Button>
            <Button textColor={colors.warning} onPress={handleArchive}>Archivar</Button>
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
    paddingBottom: 12,
    gap: 12,
  },
  headerTitle: { flex: 1, fontWeight: '700', color: colors.text, textAlign: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },

  archivedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.warning,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  archivedBannerText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  sectionTitle: { color: colors.textSecondary, letterSpacing: 0.8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { color: colors.text, flex: 1 },

  actionBtn: { borderRadius: 12 },

  historySection: { gap: 10 },
  emptyHistory: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },

  dialog: { borderRadius: 16 },
});
