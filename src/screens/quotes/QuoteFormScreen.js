import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Text, Surface, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import AppLoader from '../../components/common/AppLoader';
import QuoteItemRow from '../../components/quotes/QuoteItemRow';
import QuoteTotalsCard from '../../components/quotes/QuoteTotalsCard';
import { createQuote, updateQuote, calcValidUntil } from '../../services/quotes.service';
import { useAuthContext } from '../../context/AuthContext';
import { useBusinessContext } from '../../context/BusinessContext';
import { useAppContext } from '../../context/AppContext';
import { useTemplates } from '../../hooks/useTemplates';
import { DISCOUNT_TYPE } from '../../utils/constants';
import { colors } from '../../theme/colors';

function generateItemId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

const EMPTY_CLIENT = { name: '', phone: '', email: '' };

export default function QuoteFormScreen({ navigation, route }) {
  const theme = useTheme();
  const { user } = useAuthContext();
  const { business } = useBusinessContext();
  const { showSnackbar } = useAppContext();
  const { templates } = useTemplates();

  const existingQuote = route.params?.quote ?? null;
  const isEditing = !!existingQuote;

  // ── Estado del formulario ─────────────────────────────────
  const [client, setClient] = useState(EMPTY_CLIENT);
  const [clientErrors, setClientErrors] = useState({});
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState('0');
  const [discountType, setDiscountType] = useState(DISCOUNT_TYPE.FIXED);
  const [advance, setAdvance] = useState('0');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);

  // Pre-cargar datos al editar
  useEffect(() => {
    if (existingQuote) {
      setClient({
        name: existingQuote.client?.name ?? '',
        phone: existingQuote.client?.phone ?? '',
        email: existingQuote.client?.email ?? '',
      });
      setItems(
        (existingQuote.items ?? []).map(item => ({
          id: generateItemId(),
          description: item.description ?? '',
          quantity: String(item.quantity ?? 1),
          unitPrice: String(item.unitPrice ?? 0),
          subtotal: item.subtotal ?? 0,
        }))
      );
      setDiscount(String(existingQuote.discount ?? 0));
      setDiscountType(existingQuote.discountType ?? DISCOUNT_TYPE.FIXED);
      setAdvance(String(existingQuote.advance ?? 0));
      setNotes(existingQuote.notes ?? '');
    }
  }, []);

  // ── Cálculos ──────────────────────────────────────────────
  const subtotal = items.reduce((sum, item) => sum + (item.subtotal ?? 0), 0);
  const discountAmount =
    discountType === DISCOUNT_TYPE.PERCENT
      ? subtotal * ((parseFloat(discount) || 0) / 100)
      : parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - discountAmount);

  // ── Gestión de ítems ──────────────────────────────────────
  function addEmptyItem() {
    setItems(prev => [
      ...prev,
      { id: generateItemId(), description: '', quantity: '1', unitPrice: '0', subtotal: 0 },
    ]);
  }

  function changeItem(id, field, value) {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        updated.subtotal =
          (parseFloat(updated.quantity) || 0) * (parseFloat(updated.unitPrice) || 0);
        return updated;
      })
    );
  }

  function deleteItem(id) {
    setItems(prev => prev.filter(item => item.id !== id));
  }

  // ── Aplicar plantilla ─────────────────────────────────────
  function applyTemplate(template) {
    const templateItems = (template.items ?? []).map(item => ({
      id: generateItemId(),
      description: item.name,
      quantity: '1',
      unitPrice: String(item.defaultPrice ?? 0),
      subtotal: item.defaultPrice ?? 0,
    }));
    setItems(templateItems);
    setTemplateModalVisible(false);
    showSnackbar(`Plantilla "${template.name}" aplicada`, 'success');
  }

  // ── Validación y guardado ─────────────────────────────────
  function validate() {
    const errs = {};
    if (!client.name.trim()) errs.name = 'Ingresá el nombre del cliente';
    if (!client.phone.trim()) errs.phone = 'Ingresá el teléfono';
    setClientErrors(errs);
    if (Object.keys(errs).length > 0) return false;
    if (items.length === 0) {
      showSnackbar('Agregá al menos un ítem al presupuesto', 'error');
      return false;
    }
    return true;
  }

  async function handleSave() {
    if (!validate()) return;
    setLoading(true);
    try {
      const quoteData = {
        client: {
          name: client.name.trim(),
          phone: client.phone.trim(),
          email: client.email.trim() || null,
        },
        // Snapshot del negocio al momento de crear (inmutable en el historial)
        business: {
          businessName: business?.businessName ?? '',
          whatsapp: business?.whatsapp ?? '',
          email: business?.email ?? '',
          address: business?.address ?? '',
          cuit: business?.cuit ?? null,
          logoUrl: business?.logoUrl ?? null,
          generalConditions: business?.generalConditions ?? '',
        },
        items: items.map(({ description, quantity, unitPrice, subtotal }) => ({
          description,
          quantity: parseFloat(quantity) || 0,
          unitPrice: parseFloat(unitPrice) || 0,
          subtotal: subtotal ?? 0,
        })),
        subtotal,
        discount: parseFloat(discount) || 0,
        discountType,
        discountAmount,
        advance: parseFloat(advance) || 0,
        total,
        notes: notes.trim() || null,
        validUntil: calcValidUntil(business?.validityDays ?? 30),
      };

      if (isEditing) {
        await updateQuote(existingQuote.id, quoteData);
        showSnackbar('Presupuesto actualizado', 'success');
        navigation.goBack();
      } else {
        const quoteId = await createQuote(user.uid, quoteData);
        showSnackbar('Presupuesto creado', 'success');
        navigation.replace('QuoteDetail', { quoteId });
      }
    } catch (error) {
      console.error('Error guardando presupuesto:', error);
      showSnackbar('No se pudo guardar. Revisá tu conexión.', 'error');
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
          {isEditing ? 'Editar presupuesto' : 'Nuevo presupuesto'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Sección: Cliente */}
          <View style={styles.section}>
            <Text variant="labelMedium" style={styles.sectionLabel}>
              DATOS DEL CLIENTE
            </Text>
            <AppInput
              label="Nombre *"
              value={client.name}
              onChangeText={v => { setClient(p => ({ ...p, name: v })); setClientErrors(p => ({ ...p, name: null })); }}
              error={clientErrors.name}
              autoCapitalize="words"
              returnKeyType="next"
            />
            <AppInput
              label="Teléfono *"
              value={client.phone}
              onChangeText={v => { setClient(p => ({ ...p, phone: v })); setClientErrors(p => ({ ...p, phone: null })); }}
              error={clientErrors.phone}
              keyboardType="phone-pad"
              returnKeyType="next"
            />
            <AppInput
              label="Email (opcional)"
              value={client.email}
              onChangeText={v => setClient(p => ({ ...p, email: v }))}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
            />
          </View>

          {/* Sección: Ítems */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text variant="labelMedium" style={styles.sectionLabel}>
                ÍTEMS ({items.length})
              </Text>
              {templates.length > 0 && (
                <TouchableOpacity
                  onPress={() => setTemplateModalVisible(true)}
                  style={styles.templateBtn}
                >
                  <MaterialCommunityIcons name="file-document-outline" size={16} color={theme.colors.primary} />
                  <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                    Usar plantilla
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {items.map((item, index) => (
              <QuoteItemRow
                key={item.id}
                item={item}
                index={index}
                onChange={(field, value) => changeItem(item.id, field, value)}
                onDelete={() => deleteItem(item.id)}
              />
            ))}

            <TouchableOpacity style={styles.addItemBtn} onPress={addEmptyItem}>
              <MaterialCommunityIcons name="plus-circle-outline" size={22} color={theme.colors.primary} />
              <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
                Agregar ítem
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sección: Totales */}
          {items.length > 0 && (
            <View style={styles.section}>
              <Text variant="labelMedium" style={styles.sectionLabel}>
                TOTALES
              </Text>
              <QuoteTotalsCard
                subtotal={subtotal}
                discount={discount}
                discountType={discountType}
                onDiscountChange={setDiscount}
                onDiscountTypeChange={setDiscountType}
                advance={advance}
                onAdvanceChange={setAdvance}
              />
            </View>
          )}

          {/* Sección: Notas */}
          <View style={styles.section}>
            <Text variant="labelMedium" style={styles.sectionLabel}>
              NOTAS (OPCIONAL)
            </Text>
            <AppInput
              label="Aclaraciones para el cliente"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoCapitalize="sentences"
            />
          </View>

          <AppButton onPress={handleSave} loading={loading}>
            {isEditing ? 'Guardar cambios' : 'Crear presupuesto'}
          </AppButton>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal selector de plantillas */}
      <Modal
        visible={templateModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTemplateModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTemplateModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text variant="titleMedium" style={styles.modalTitle}>
              Seleccioná una plantilla
            </Text>
            <FlatList
              data={templates}
              keyExtractor={t => t.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: t }) => (
                <TouchableOpacity
                  style={styles.templateOption}
                  onPress={() => applyTemplate(t)}
                  activeOpacity={0.7}
                >
                  <View style={styles.templateOptionIcon}>
                    <MaterialCommunityIcons
                      name="file-document-outline"
                      size={22}
                      color={colors.warning}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyLarge" style={{ fontWeight: '600' }}>
                      {t.name}
                    </Text>
                    <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                      {t.items?.length ?? 0} ítems
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            />
            <Button onPress={() => setTemplateModalVisible(false)} style={styles.modalCancel}>
              Cancelar
            </Button>
          </View>
        </TouchableOpacity>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 4,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
  },
  // Modal bottom sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '60%',
    gap: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
  },
  modalTitle: {
    fontWeight: '700',
    color: colors.text,
  },
  templateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  templateOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${colors.warning}18`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancel: {
    marginTop: 4,
  },
});
