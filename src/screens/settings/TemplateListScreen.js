import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import {
  Text,
  Surface,
  FAB,
  Dialog,
  Portal,
  Button,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import EmptyState from '../../components/common/EmptyState';
import { useTemplates } from '../../hooks/useTemplates';
import { deleteTemplate, restoreDefaultTemplate } from '../../services/templates.service';
import { useAuthContext } from '../../context/AuthContext';
import { useBusinessContext } from '../../context/BusinessContext';
import { useAppContext } from '../../context/AppContext';
import { colors } from '../../theme/colors';

export default function TemplateListScreen({ navigation }) {
  const theme = useTheme();
  const { user } = useAuthContext();
  const { business } = useBusinessContext();
  const { showSnackbar } = useAppContext();
  const { templates, loading } = useTemplates();

  const [deleting, setDeleting] = useState(null);     // template a eliminar
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // ── Eliminar ──────────────────────────────────────────────

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteTemplate(deleting.id);
      showSnackbar('Plantilla eliminada', 'success');
    } catch {
      showSnackbar('No se pudo eliminar la plantilla', 'error');
    } finally {
      setDeleting(null);
    }
  }

  // ── Restaurar plantilla base ──────────────────────────────

  async function handleRestore() {
    setRestoreDialog(false);
    setRestoring(true);
    try {
      await restoreDefaultTemplate(user.uid, business?.sector ?? '');
      showSnackbar('Plantilla base restaurada', 'success');
    } catch (error) {
      console.error('Error restaurando plantilla base:', error);
      showSnackbar('No se pudo restaurar la plantilla', 'error');
    } finally {
      setRestoring(false);
    }
  }

  // ── Render ────────────────────────────────────────────────

  function renderTemplate({ item }) {
    return (
      <Surface style={styles.card} elevation={1}>
        <View style={styles.cardContent}>
          <View style={[styles.cardIcon, { backgroundColor: `${colors.warning}18` }]}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={24}
              color={colors.warning}
            />
          </View>
          <View style={styles.cardText}>
            <Text variant="titleSmall" style={styles.cardName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text variant="bodySmall" style={styles.cardMeta}>
              {item.items?.length ?? 0}{' '}
              {item.items?.length === 1 ? 'ítem' : 'ítems'}
              {item.sector ? ` · ${item.sector}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('TemplateForm', { template: item })}
            style={styles.actionBtn}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDeleting(item)}
            style={styles.actionBtn}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </Surface>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="titleLarge" style={styles.headerTitle}>
          Mis plantillas
        </Text>
        {/* Botón restaurar plantilla base */}
        <TouchableOpacity
          onPress={() => setRestoreDialog(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          disabled={restoring}
        >
          {restoring ? (
            <ActivityIndicator size={20} color={colors.primary} />
          ) : (
            <MaterialCommunityIcons name="backup-restore" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={item => item.id}
          renderItem={renderTemplate}
          contentContainerStyle={[
            styles.list,
            templates.length === 0 && styles.listEmpty,
          ]}
          ListEmptyComponent={
            <EmptyState
              icon="file-document-multiple-outline"
              title="Todavía no tenés plantillas"
              description="Las plantillas te permiten agregar ítems predefinidos a tus presupuestos en segundos."
              actionLabel="Crear primera plantilla"
              onAction={() => navigation.navigate('TemplateForm', {})}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB para crear nueva plantilla */}
      {!loading && (
        <FAB
          icon="plus"
          label="Nueva plantilla"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={colors.white}
          onPress={() => navigation.navigate('TemplateForm', {})}
        />
      )}

      {/* Diálogo: confirmar eliminación */}
      <Portal>
        <Dialog
          visible={!!deleting}
          onDismiss={() => setDeleting(null)}
          style={styles.dialog}
        >
          <Dialog.Title>Eliminar plantilla</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
              ¿Eliminar{' '}
              <Text style={{ fontWeight: '600', color: colors.text }}>
                {deleting?.name}
              </Text>
              ? Esta acción no se puede deshacer.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleting(null)}>Cancelar</Button>
            <Button textColor={colors.error} onPress={handleDelete}>
              Eliminar
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Diálogo: confirmar restaurar plantilla base */}
        <Dialog
          visible={restoreDialog}
          onDismiss={() => setRestoreDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Restaurar plantilla base</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
              Se va a restaurar la plantilla sugerida para{' '}
              <Text style={{ fontWeight: '600', color: colors.text }}>
                {business?.sector ?? 'tu rubro'}
              </Text>
              {' '}con precios en $0.{'\n\n'}
              Tus otras plantillas no se modifican.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRestoreDialog(false)}>Cancelar</Button>
            <Button onPress={handleRestore}>Restaurar</Button>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 10,
  },
  listEmpty: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    gap: 3,
  },
  cardName: {
    fontWeight: '600',
    color: colors.text,
  },
  cardMeta: {
    color: colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    borderRadius: 16,
  },
  dialog: {
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
});
