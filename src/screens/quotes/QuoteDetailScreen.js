import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  AppState,
} from 'react-native';
import { Text, Surface, Button, Dialog, Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppLoader from '../../components/common/AppLoader';
import QuoteStatusBadge from '../../components/quotes/QuoteStatusBadge';
import { updateQuoteStatus, deleteQuote } from '../../services/quotes.service';
import { shareQuotePdf, shareQuotePdfToWhatsApp, printQuotePdf } from '../../services/pdf.service';
import { isValidWhatsAppPhone } from '../../utils/whatsappMessage';
import { shouldPromptAfterWhatsAppReturn } from '../../utils/whatsappFollowUp';
import { getStatusActions } from '../../utils/quoteStatus';
import { useQuotes } from '../../hooks/useQuotes';
import { useAppContext } from '../../context/AppContext';
import { QUOTE_STATUS_LABEL, DISCOUNT_TYPE } from '../../utils/constants';
import { formatCurrency, formatDate, formatQuoteNumber } from '../../utils/formatters';
import { colors } from '../../theme/colors';

export default function QuoteDetailScreen({ navigation, route }) {
  const { quoteId } = route.params;
  const { quotes } = useQuotes();
  const { showSnackbar } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { to, label, message } | null

  const awaitingWhatsAppReturnRef = useRef(false);
  const previousAppStateRef = useRef(AppState.currentState);

  const quote = quotes.find(q => q.id === quoteId) ?? null;

  // Al volver del segundo plano (ej. después de abrir WhatsApp), preguntar
  // si corresponde marcar como enviado — nunca se marca solo.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (shouldPromptAfterWhatsAppReturn(previousAppStateRef.current, nextState, awaitingWhatsAppReturnRef.current)) {
        awaitingWhatsAppReturnRef.current = false;
        Alert.alert(
          '¿Pudiste enviar el presupuesto?',
          'Si WhatsApp abrió el chat con el PDF adjunto y ya lo enviaste, marcalo como enviado.',
          [
            { text: 'Todavía no', style: 'cancel' },
            { text: 'Sí, marcar como enviado', onPress: () => runStatusChange('sent') },
          ]
        );
      }
      previousAppStateRef.current = nextState;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId]);

  if (!quote) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text variant="titleLarge" style={styles.headerTitle}>Presupuesto</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centered}>
          <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
            Presupuesto no encontrado
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Cambio de estado ──────────────────────────────────────
  async function runStatusChange(newStatus) {
    setLoading(true);
    try {
      await updateQuoteStatus(quoteId, newStatus);
      showSnackbar(`Estado actualizado a ${QUOTE_STATUS_LABEL[newStatus]}`, 'success');
    } catch (error) {
      if (error?.code === 'invalid_status_transition') {
        showSnackbar('El estado cambió mientras tanto — actualizá la pantalla e intentá de nuevo.', 'error');
      } else {
        showSnackbar('No se pudo actualizar el estado', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  function requestStatusChange(action) {
    setConfirmAction(action);
  }

  async function confirmStatusChange() {
    const action = confirmAction;
    setConfirmAction(null);
    if (action) await runStatusChange(action.to);
  }

  // ── PDF ───────────────────────────────────────────────────
  async function handleSharePDF() {
    setLoading(true);
    try {
      await shareQuotePdf(quote, quote.business);
    } catch (e) {
      showSnackbar('No se pudo compartir el PDF', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handlePrintPDF() {
    setLoading(true);
    try {
      await printQuotePdf(quote, quote.business);
    } catch (e) {
      showSnackbar('No se pudo imprimir el PDF', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ── WhatsApp — genera el archivo y lo dirige al número del cliente ──
  async function handleSendWhatsAppPdf() {
    if (!isValidWhatsAppPhone(quote.client?.phone)) {
      showSnackbar('El teléfono del cliente no parece válido para WhatsApp', 'error');
      return;
    }

    setLoading(true);
    try {
      awaitingWhatsAppReturnRef.current = true;
      const result = await shareQuotePdfToWhatsApp(quote, quote.business, quote.client.phone);
      if (result?.directToClient === false) {
        awaitingWhatsAppReturnRef.current = false;
        showSnackbar('Elegí WhatsApp y el contacto del cliente para enviar el PDF', 'info');
      }
    } catch (error) {
      awaitingWhatsAppReturnRef.current = false;
      if (error?.code === 'whatsapp_not_installed') {
        showSnackbar('No encontramos WhatsApp ni WhatsApp Business instalados', 'error');
      } else if (error?.code === 'native_share_unavailable') {
        showSnackbar('Instalá la versión 1.0.9 para enviar el PDF directo por WhatsApp', 'error');
      } else {
        showSnackbar('No se pudo adjuntar el PDF en WhatsApp', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Eliminación ───────────────────────────────────────────
  function handleDelete() {
    Alert.alert(
      'Eliminar presupuesto',
      `¿Eliminar ${formatQuoteNumber(quote.quoteNumber)}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteQuote(quoteId);
              showSnackbar('Presupuesto eliminado', 'success');
              navigation.goBack();
            } catch {
              showSnackbar('No se pudo eliminar', 'error');
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  // ── Cálculos de totales ───────────────────────────────────
  const discountAmount =
    quote.discountType === DISCOUNT_TYPE.PERCENT
      ? (quote.subtotal ?? 0) * ((quote.discount ?? 0) / 100)
      : (quote.discount ?? 0);
  const total = Math.max(0, (quote.subtotal ?? 0) - discountAmount);
  const advance = quote.advance ?? 0;
  const saldo = Math.max(0, total - advance);

  const lastChangeDate = quote.statusUpdatedAt ?? quote.updatedAt ?? quote.createdAt;
  const availableActions = getStatusActions(quote.status);

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
          {formatQuoteNumber(quote.quoteNumber)}
        </Text>
        <TouchableOpacity
          onPress={handleDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Sección: Estado + fechas */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.statusRow}>
            <View style={{ gap: 4 }}>
              <Text variant="bodySmall" style={styles.metaLabel}>Estado</Text>
              <QuoteStatusBadge status={quote.status} />
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text variant="bodySmall" style={styles.metaLabel}>Último cambio</Text>
              <Text variant="bodyMedium" style={styles.metaValue}>
                {formatDate(lastChangeDate) || '—'}
              </Text>
            </View>
          </View>

          {availableActions.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.actionsWrap}>
                {availableActions.map(action => (
                  <Button
                    key={action.to}
                    mode={action.muted ? 'text' : 'outlined'}
                    compact
                    textColor={action.muted ? colors.textSecondary : colors.primary}
                    onPress={() => requestStatusChange(action)}
                    style={styles.statusActionBtn}
                  >
                    {action.label}
                  </Button>
                ))}
              </View>
            </>
          )}

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <View style={{ flex: 1 }}>
              <Text variant="bodySmall" style={styles.metaLabel}>Fecha</Text>
              <Text variant="bodyMedium" style={styles.metaValue}>
                {formatDate(quote.createdAt)}
              </Text>
            </View>
            {quote.validUntil && (
              <View style={{ flex: 1 }}>
                <Text variant="bodySmall" style={styles.metaLabel}>Válido hasta</Text>
                <Text variant="bodyMedium" style={styles.metaValue}>
                  {formatDate(quote.validUntil)}
                </Text>
              </View>
            )}
          </View>
        </Surface>

        {/* Sección: Cliente */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.clientHeaderRow}>
            <Text variant="labelMedium" style={styles.sectionTitle}>CLIENTE</Text>
            {!!quote.clientId && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Clients', {
                  screen: 'ClientDetail',
                  params: { clientId: quote.clientId },
                })}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={styles.clientLink}>Ver ficha del cliente</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text variant="titleMedium" style={styles.boldText}>
            {quote.client?.name ?? '—'}
          </Text>
          {!!quote.client?.phone && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="phone-outline" size={16} color={colors.textSecondary} />
              <Text variant="bodyMedium" style={styles.infoText}>{quote.client.phone}</Text>
            </View>
          )}
          {!!quote.client?.email && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="email-outline" size={16} color={colors.textSecondary} />
              <Text variant="bodyMedium" style={styles.infoText}>{quote.client.email}</Text>
            </View>
          )}
          {!!quote.client?.address && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.textSecondary} />
              <Text variant="bodyMedium" style={styles.infoText}>{quote.client.address}</Text>
            </View>
          )}
        </Surface>

        {/* Sección: Ítems */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="labelMedium" style={styles.sectionTitle}>
            ÍTEMS ({quote.items?.length ?? 0})
          </Text>
          {(quote.items ?? []).map((item, index) => (
            <View key={index}>
              {index > 0 && <View style={styles.itemDivider} />}
              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" style={styles.itemDescription}>
                    {item.description}
                  </Text>
                  <Text variant="bodySmall" style={styles.itemDetail}>
                    {item.quantity} × {formatCurrency(item.unitPrice)}
                  </Text>
                </View>
                <Text variant="bodyMedium" style={styles.itemSubtotal}>
                  {formatCurrency(item.subtotal ?? item.quantity * item.unitPrice)}
                </Text>
              </View>
            </View>
          ))}
        </Surface>

        {/* Sección: Totales */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="labelMedium" style={styles.sectionTitle}>TOTALES</Text>

          <View style={styles.totalLine}>
            <Text variant="bodyMedium" style={styles.totalLabel}>Subtotal</Text>
            <Text variant="bodyMedium">{formatCurrency(quote.subtotal ?? 0)}</Text>
          </View>

          {(quote.discount ?? 0) > 0 && (
            <View style={styles.totalLine}>
              <Text variant="bodyMedium" style={styles.totalLabel}>
                Descuento{quote.discountType === DISCOUNT_TYPE.PERCENT ? ` (${quote.discount}%)` : ''}
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.error }}>
                -{formatCurrency(discountAmount)}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.totalLine}>
            <Text variant="titleMedium" style={{ fontWeight: '700', color: colors.text }}>TOTAL</Text>
            <Text variant="titleMedium" style={{ fontWeight: '700', color: colors.primary }}>
              {formatCurrency(total)}
            </Text>
          </View>

          {advance > 0 && (
            <>
              <View style={styles.totalLine}>
                <Text variant="bodyMedium" style={styles.totalLabel}>Anticipo</Text>
                <Text variant="bodyMedium" style={{ color: colors.error }}>
                  -{formatCurrency(advance)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.totalLine}>
                <Text variant="titleSmall" style={{ fontWeight: '700', color: colors.text }}>
                  Saldo pendiente
                </Text>
                <Text variant="titleSmall" style={{ fontWeight: '700', color: colors.sent }}>
                  {formatCurrency(saldo)}
                </Text>
              </View>
            </>
          )}
        </Surface>

        {/* Sección: Negocio (snapshot) */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="labelMedium" style={styles.sectionTitle}>EMISOR</Text>
          <Text variant="titleSmall" style={styles.boldText}>
            {quote.business?.businessName ?? '—'}
          </Text>
          {!!quote.business?.whatsapp && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="whatsapp" size={16} color={colors.textSecondary} />
              <Text variant="bodySmall" style={styles.infoText}>{quote.business.whatsapp}</Text>
            </View>
          )}
          {!!quote.business?.email && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="email-outline" size={16} color={colors.textSecondary} />
              <Text variant="bodySmall" style={styles.infoText}>{quote.business.email}</Text>
            </View>
          )}
          {!!quote.business?.address && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.textSecondary} />
              <Text variant="bodySmall" style={styles.infoText}>{quote.business.address}</Text>
            </View>
          )}
          {!!quote.business?.cuit && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="card-account-details-outline" size={16} color={colors.textSecondary} />
              <Text variant="bodySmall" style={styles.infoText}>CUIT: {quote.business.cuit}</Text>
            </View>
          )}
        </Surface>

        {/* Sección: Notas */}
        {!!quote.notes && (
          <Surface style={styles.card} elevation={1}>
            <Text variant="labelMedium" style={styles.sectionTitle}>NOTAS</Text>
            <Text variant="bodyMedium" style={{ color: colors.text, lineHeight: 22 }}>
              {quote.notes}
            </Text>
          </Surface>
        )}

        {/* Botones de acción */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            icon="pencil-outline"
            onPress={() => navigation.navigate('QuoteForm', { quote })}
            style={styles.actionBtn}
          >
            Editar
          </Button>
          <Button
            mode="contained"
            icon="file-pdf-box"
            onPress={handleSharePDF}
            style={styles.actionBtn}
          >
            Compartir PDF
          </Button>
        </View>

        <Button
          mode="outlined"
          icon="printer-outline"
          onPress={handlePrintPDF}
          style={styles.downloadBtn}
        >
          Imprimir / Guardar PDF
        </Button>

        {!!quote.client?.phone && (
          <View style={styles.whatsappAction}>
            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={handleSendWhatsAppPdf}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="file-pdf-box" size={22} color="#fff" />
              <MaterialCommunityIcons name="whatsapp" size={22} color="#fff" />
              <Text variant="labelLarge" style={styles.whatsappLabel}>
                Enviar PDF por WhatsApp
              </Text>
            </TouchableOpacity>
            <Text variant="bodySmall" style={styles.whatsappHint}>
              Se abrirá el chat de {quote.client.name} ({quote.client.phone}) con el PDF adjunto.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Dialog: confirmación de cambio de estado */}
      <Portal>
        <Dialog
          visible={!!confirmAction}
          onDismiss={() => setConfirmAction(null)}
          style={styles.dialog}
        >
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  clientHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientLink: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  boldText: {
    fontWeight: '600',
    color: colors.text,
  },
  // Estado
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metaLabel: {
    color: colors.textSecondary,
    marginBottom: 2,
  },
  metaValue: {
    color: colors.text,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  actionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusActionBtn: {
    borderRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  // Información
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: colors.textSecondary,
    flex: 1,
  },
  // Ítems
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  itemDescription: {
    color: colors.text,
    fontWeight: '500',
  },
  itemDetail: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemSubtotal: {
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  // Totales
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: colors.text,
  },
  // Acciones
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
  },
  downloadBtn: {
    borderRadius: 12,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 14,
  },
  whatsappAction: {
    gap: 6,
  },
  whatsappLabel: {
    color: '#fff',
    fontWeight: '700',
  },
  whatsappHint: {
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  // Dialog
  dialog: {
    borderRadius: 20,
  },
});
