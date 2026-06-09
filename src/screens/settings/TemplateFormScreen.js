import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Dialog,
  Portal,
  Button,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import AppLoader from '../../components/common/AppLoader';
import TemplateItemRow from '../../components/templates/TemplateItemRow';
import { createTemplate, updateTemplate } from '../../services/templates.service';
import { useAuthContext } from '../../context/AuthContext';
import { useBusinessContext } from '../../context/BusinessContext';
import { useAppContext } from '../../context/AppContext';
import { colors } from '../../theme/colors';

function generateItemId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

const EMPTY_ITEM_FORM = { name: '', defaultPrice: '', unit: '' };

export default function TemplateFormScreen({ navigation, route }) {
  const theme = useTheme();
  const { user } = useAuthContext();
  const { business } = useBusinessContext();
  const { showSnackbar } = useAppContext();

  const existingTemplate = route.params?.template ?? null;
  const isEditing = !!existingTemplate;

  // Estado del formulario de la plantilla
  const [name, setName] = useState(existingTemplate?.name ?? '');
  const [sector, setSector] = useState(
    existingTemplate?.sector ?? business?.sector ?? ''
  );
  const [nameError, setNameError] = useState(null);
  const [items, setItems] = useState(existingTemplate?.items ?? []);
  const [loading, setLoading] = useState(false);

  // Estado del diálogo para agregar/editar ítems
  const [itemDialog, setItemDialog] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM_FORM);
  const [itemNameError, setItemNameError] = useState(null);

  // ── Gestión de ítems ──────────────────────────────────────

  function openAddItem() {
    setEditingItemId(null);
    setItemForm(EMPTY_ITEM_FORM);
    setItemNameError(null);
    setItemDialog(true);
  }

  function openEditItem(item) {
    setEditingItemId(item.id);
    setItemForm({
      name: item.name,
      defaultPrice: item.defaultPrice != null ? String(item.defaultPrice) : '',
      unit: item.unit ?? '',
    });
    setItemNameError(null);
    setItemDialog(true);
  }

  function closeItemDialog() {
    setItemDialog(false);
    setItemNameError(null);
  }

  function saveItem() {
    if (!itemForm.name.trim()) {
      setItemNameError('Ingresá el nombre del ítem');
      return;
    }
    const parsed = {
      name: itemForm.name.trim(),
      defaultPrice: itemForm.defaultPrice !== '' ? Number(itemForm.defaultPrice) : null,
      unit: itemForm.unit.trim() || 'unidad',
    };

    if (editingItemId) {
      setItems(prev =>
        prev.map(item =>
          item.id === editingItemId ? { ...item, ...parsed } : item
        )
      );
    } else {
      setItems(prev => [
        ...prev,
        { id: generateItemId(), ...parsed, order: prev.length },
      ]);
    }
    closeItemDialog();
  }

  function deleteItem(itemId) {
    setItems(prev =>
      prev
        .filter(item => item.id !== itemId)
        .map((item, index) => ({ ...item, order: index }))
    );
  }

  function moveItem(index, direction) {
    const next = [...items];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next.map((item, i) => ({ ...item, order: i })));
  }

  // ── Guardar plantilla ─────────────────────────────────────

  async function handleSave() {
    if (!name.trim()) {
      setNameError('Ingresá el nombre de la plantilla');
      return;
    }
    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        sector: sector.trim(),
        items: items.map((item, index) => ({ ...item, order: index })),
      };
      if (isEditing) {
        await updateTemplate(existingTemplate.id, data);
      } else {
        await createTemplate(user.uid, data);
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error guardando plantilla:', error);
      showSnackbar('No se pudo guardar la plantilla. Revisá tu conexión.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppLoader visible={loading} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="titleLarge" style={styles.headerTitle}>
          {isEditing ? 'Editar plantilla' : 'Nueva plantilla'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Datos de la plantilla */}
        <View style={styles.section}>
          <Text variant="labelMedium" style={styles.sectionLabel}>
            DATOS DE LA PLANTILLA
          </Text>
          <AppInput
            label="Nombre de la plantilla *"
            value={name}
            onChangeText={t => { setName(t); setNameError(null); }}
            error={nameError}
            autoCapitalize="words"
            returnKeyType="next"
            placeholder="Ej: Costurera, Mecánico General..."
          />
          <AppInput
            label="Rubro (opcional)"
            value={sector}
            onChangeText={setSector}
            autoCapitalize="sentences"
            returnKeyType="done"
            placeholder="Ej: Costura, Mecánica..."
          />
        </View>

        {/* Ítems */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text variant="labelMedium" style={styles.sectionLabel}>
              ÍTEMS ({items.length})
            </Text>
            <TouchableOpacity
              onPress={openAddItem}
              style={styles.addItemBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <MaterialCommunityIcons name="plus" size={18} color={theme.colors.primary} />
              <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                Agregar ítem
              </Text>
            </TouchableOpacity>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyItems}>
              <MaterialCommunityIcons
                name="format-list-bulleted"
                size={40}
                color={colors.border}
              />
              <Text variant="bodyMedium" style={styles.emptyItemsText}>
                Todavía no hay ítems.{'\n'}Tocá "Agregar ítem" para empezar.
              </Text>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {items.map((item, index) => (
                <TemplateItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  totalItems={items.length}
                  onEdit={() => openEditItem(item)}
                  onDelete={() => deleteItem(item.id)}
                  onMoveUp={() => moveItem(index, 'up')}
                  onMoveDown={() => moveItem(index, 'down')}
                />
              ))}
            </View>
          )}
        </View>

        {/* Botón guardar */}
        <AppButton onPress={handleSave} loading={loading}>
          {isEditing ? 'Guardar cambios' : 'Guardar plantilla'}
        </AppButton>
      </ScrollView>

      {/* Diálogo: agregar / editar ítem */}
      <Portal>
        <Dialog
          visible={itemDialog}
          onDismiss={closeItemDialog}
          style={styles.dialog}
        >
          <Dialog.Title>
            {editingItemId ? 'Editar ítem' : 'Agregar ítem'}
          </Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <AppInput
              label="Nombre del ítem *"
              value={itemForm.name}
              onChangeText={t => {
                setItemForm(p => ({ ...p, name: t }));
                setItemNameError(null);
              }}
              error={itemNameError}
              autoCapitalize="sentences"
              returnKeyType="next"
            />
            <AppInput
              label="Precio por defecto"
              value={itemForm.defaultPrice}
              onChangeText={t => setItemForm(p => ({ ...p, defaultPrice: t }))}
              keyboardType="numeric"
              returnKeyType="next"
              placeholder="Dejalo vacío si el precio varía"
            />
            <AppInput
              label="Unidad"
              value={itemForm.unit}
              onChangeText={t => setItemForm(p => ({ ...p, unit: t }))}
              returnKeyType="done"
              onSubmitEditing={saveItem}
              placeholder="unidad, hora, m2, kg..."
              autoCapitalize="none"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeItemDialog}>Cancelar</Button>
            <Button onPress={saveItem}>
              {editingItemId ? 'Guardar' : 'Agregar'}
            </Button>
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
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  emptyItems: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyItemsText: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  itemsList: {
    gap: 8,
  },
  dialog: {
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  dialogContent: {
    gap: 12,
    paddingTop: 8,
  },
});
