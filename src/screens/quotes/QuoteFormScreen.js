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
  Alert,
} from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import AppLoader from '../../components/common/AppLoader';
import QuoteItemRow from '../../components/quotes/QuoteItemRow';
import QuoteTotalsCard from '../../components/quotes/QuoteTotalsCard';
import ClientPickerSheet from '../../components/clients/ClientPickerSheet';
import { createQuote, updateQuote, calcValidUntil } from '../../services/quotes.service';
import { useAuthContext } from '../../context/AuthContext';
import { useBusinessContext } from '../../context/BusinessContext';
import { useAppContext } from '../../context/AppContext';
import { useTemplates } from '../../hooks/useTemplates';
import { DISCOUNT_TYPE, PAYMENT_METHOD, PAYMENT_METHOD_LABEL } from '../../utils/constants';
import { colors } from '../../theme/colors';
import { openUpgradeEmail, openSuspendedEmail } from '../../utils/contactHelper';
import { logError } from '../../utils/errorUtils';

function generateItemId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

export default function QuoteFormScreen({ navigation, route }) {
  const theme = useTheme();
  const { user } = useAuthContext();
  const { business } = useBusinessContext();
  const { showSnackbar } = useAppContext();
  const { templates } = useTemplates();

  const existingQuote = route.params?.quote ?? null;
  const presetClient = route.params?.presetClient ?? null;
  const isEditing = !!existingQuote;

  // ── Estado del formulario ─────────────────────────────────
  // client: null (todavía sin elegir) | { id: string|null, name, phone, email, address }
  // id === null significa "cliente ocasional" — no está guardado en la
  // colección clients, solo vive como snapshot dentro de este presupuesto.
  const [client, setClient] = useState(presetClient ?? null);
  const [clientPickerVisible, setClientPickerVisible] = useState(false);
  const [clientError, setClientError] = useState(null);
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState('');
  const [discountType, setDiscountType] = useState(DISCOUNT_TYPE.FIXED);
  const [advance, setAdvance] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);

  // Pre-cargar datos al editar.
  // Un presupuesto sin clientId (ocasional, o de antes de que existiera esta
  // fase) se pre-carga igual que uno vinculado: el picker/tarjeta no
  // distingue entre ambos casos, "Cambiar" siempre reabre el selector.
  useEffect(() => {
    if (existingQuote) {
      setClient({
        id: existingQuote.clientId ?? null,
        name: existingQuote.client?.name ?? '',
        phone: existingQuote.client?.phone ?? null,
        email: existingQuote.client?.email ?? null,
        address: existingQuote.client?.address ?? null,
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
      setDiscount(existingQuote.discount ? String(existingQuote.discount) : '');
      setDiscountType(existingQuote.discountType ?? DISCOUNT_TYPE.FIXED);
      setAdvance(existingQuote.advance ? String(existingQuote.advance) : '');
      setPaymentMethod(existingQuote.paymentMethod ?? null);
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
      { id: generateItemId(), description: '', quantity: '1', unitPrice: '', subtotal: 0 },
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
    if (!client) {
      setClientError('Elegí o creá un cliente para este presupuesto');
      showSnackbar('Elegí o creá un cliente para este presupuesto', 'error');
      return false;
    }
    setClientError(null);
    if (items.length === 0) {
      showSnackbar('Agregá al menos un ítem al presupuesto', 'error');
      return false;
    }
    if (items.length > 50) {
      showSnackbar('El presupuesto no puede tener más de 50 ítems', 'error');
      return false;
    }
    if (items.some(item => !item.description.trim())) {
      showSnackbar('Todos los ítems deben tener una descripción', 'error');
      return false;
    }
    if (items.some(item => (parseFloat(item.quantity) || 0) <= 0)) {
      showSnackbar('La cantidad de cada ítem debe ser mayor a 0', 'error');
      return false;
    }
    if (items.some(item => (parseFloat(item.unitPrice) || 0) < 0)) {
      showSnackbar('El precio no puede ser negativo', 'error');
      return false;
    }
    return true;
  }

  async function handleSave() {
    if (!validate()) return;
    setLoading(true);
    try {
      const quoteData = {
        // clientId: null = cliente ocasional, sin ficha guardada.
        clientId: client.id ?? null,
        // Snapshot inmutable del cliente al momento de crear — igual criterio
        // que el snapshot del negocio de abajo: si el cliente se edita o se
        // archiva después, este presupuesto sigue mostrando estos datos.
        client: {
          name: client.name.trim(),
          phone: client.phone?.trim() || null,
          email: client.email?.trim() || null,
          address: client.address?.trim() || null,
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
        paymentMethod: paymentMethod || null,
        notes: notes.trim() || null,
        validUntil: calcValidUntil(business?.validityDays ?? 30),
      };

      if (isEditing) {
        await updateQuote(existingQuote.id, quoteData);
        showSnackbar('Presupuesto actualizado', 'success');
        navigation.goBack();
      } else {
        const quoteId = await createQuote(user.uid, quoteData);
        // Reset form before navigating so pressing back shows a blank form
        setClient(null);
        setClientError(null);
        setItems([]);
        setDiscount('');
        setDiscountType(DISCOUNT_TYPE.FIXED);
        setAdvance('');
        setPaymentMethod(null);
        setNotes('');
        showSnackbar('Presupuesto creado', 'success');
        navigation.navigate('QuoteDetail', { quoteId });
      }
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
        logError('QuoteFormScreen', error);
        showSnackbar('No se pudo guardar. Revisá tu conexión.', 'error');
      }
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
        <Text style={styles.headerTitle}>
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
            <Text style={styles.sectionLabel}>CLIENTE</Text>
            {client ? (
              <TouchableOpacity
                style={styles.clientCard}
                onPress={() => setClientPickerVisible(true)}
                activeOpacity={0.75}
              >
                <View style={styles.clientCardAvatar}>
                  <Text style={styles.clientCardAvatarText}>
                    {client.name.trim().charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.clientCardNameRow}>
                    <Text style={styles.clientCardName} numberOfLines={1}>{client.name}</Text>
                    {!client.id && (
                      <View style={styles.occasionalTag}>
                        <Text style={styles.occasionalTagText}>Ocasional</Text>
                      </View>
                    )}
                  </View>
                  {!!client.phone && (
                    <Text style={styles.clientCardMeta} numberOfLines={1}>{client.phone}</Text>
                  )}
                </View>
                <Text style={styles.changeClientText}>Cambiar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.chooseClientBtn}
                onPress={() => setClientPickerVisible(true)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="account-plus-outline" size={20} color={colors.primary} />
                <Text style={styles.chooseClientText}>Elegí o creá un cliente</Text>
              </TouchableOpacity>
            )}
            {!!clientError && <Text style={styles.clientErrorText}>{clientError}</Text>}
          </View>

          {/* Sección: Ítems */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <View style={styles.sectionLabelRow}>
                <Text style={styles.sectionLabel}>ÍTEMS</Text>
                {items.length > 0 && (
                  <View style={styles.itemsBadge}>
                    <Text style={styles.itemsBadgeText}>{items.length}</Text>
                  </View>
                )}
              </View>
              {templates.length > 0 && (
                <TouchableOpacity
                  onPress={() => setTemplateModalVisible(true)}
                  style={styles.templateBtn}
                >
                  <MaterialCommunityIcons name="file-document-outline" size={15} color={colors.primary} />
                  <Text style={styles.templateBtnText}>Usar plantilla</Text>
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

            <TouchableOpacity style={styles.addItemBtn} onPress={addEmptyItem} activeOpacity={0.7}>
              <MaterialCommunityIcons name="plus-circle-outline" size={22} color={colors.primary} />
              <Text style={styles.addItemText}>Agregar ítem</Text>
            </TouchableOpacity>
          </View>

          {/* Sección: Totales */}
          {items.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TOTALES</Text>
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

          {/* Sección: Método de pago */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>MÉTODO DE PAGO (OPCIONAL)</Text>
            <View style={styles.paymentMethodsRow}>
              {Object.values(PAYMENT_METHOD).map(method => {
                const active = paymentMethod === method;
                return (
                  <TouchableOpacity
                    key={method}
                    style={[styles.paymentChip, active && styles.paymentChipActive]}
                    onPress={() => setPaymentMethod(active ? null : method)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.paymentChipText, active && styles.paymentChipTextActive]}>
                      {PAYMENT_METHOD_LABEL[method]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Sección: Notas */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NOTAS (OPCIONAL)</Text>
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
            {isEditing ? 'Guardar cambios' : 'Crear presupuesto →'}
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

      {/* Selector de cliente: guardado / rápido / ocasional */}
      <ClientPickerSheet
        visible={clientPickerVisible}
        onClose={() => setClientPickerVisible(false)}
        onSelect={(selected) => {
          setClient(selected);
          setClientError(null);
          setClientPickerVisible(false);
        }}
      />
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Selector de cliente
  chooseClientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.primaryLight,
  },
  chooseClientText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clientCardAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    flexShrink: 0,
  },
  clientCardAvatarText: {
    fontWeight: '700',
    color: colors.primary,
    fontSize: 16,
  },
  clientCardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  occasionalTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: colors.warningLight,
  },
  occasionalTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.warning,
  },
  clientCardMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  changeClientText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  clientErrorText: {
    fontSize: 12,
    color: colors.error,
    marginLeft: 4,
  },
  // Selector de método de pago
  paymentMethodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  paymentChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  paymentChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  paymentChipTextActive: {
    color: colors.primary,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemsBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  itemsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  templateBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.primaryLight,
  },
  addItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
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
