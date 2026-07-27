/**
 * ClientPickerSheet — selector de cliente para QuoteFormScreen.
 *
 * Tres caminos, todos sin salir del presupuesto (todo ocurre en este modal):
 *   - Elegir un cliente activo ya guardado (con búsqueda).
 *   - "Crear cliente rápido": guarda un cliente nuevo (solo nombre + teléfono)
 *     y lo selecciona.
 *   - "Usar cliente ocasional": NO crea ningún documento en clients — solo
 *     devuelve los datos sueltos para el snapshot del presupuesto (clientId: null).
 *
 * Usa un backdrop hermano (no un TouchableOpacity que envuelve la hoja) a
 * propósito: la hoja tiene inputs de texto reales (crear rápido / ocasional),
 * y con el patrón "TouchableOpacity que envuelve todo" (como el selector de
 * plantillas de este mismo formulario) cualquier toque en el espacio vacío
 * entre campos cierra el modal y se pierde lo tipeado. Con el backdrop como
 * hermano absolutamente posicionado, los toques dentro de la hoja nunca le
 * llegan (mismo patrón ya usado en el modal de filtros de HistoryScreen).
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  FlatList,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppInput from '../common/AppInput';
import { useClients } from '../../hooks/useClients';
import { createClient } from '../../services/clients.service';
import { useAuthContext } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { matchesClientSearch } from '../../utils/searchUtils';
import { logError } from '../../utils/errorUtils';
import { colors } from '../../theme/colors';

const EMPTY_OCCASIONAL = { name: '', phone: '', email: '', address: '' };

export default function ClientPickerSheet({ visible, onClose, onSelect }) {
  const { user } = useAuthContext();
  const { clients } = useClients();
  const { showSnackbar } = useAppContext();

  const [mode, setMode] = useState('list'); // 'list' | 'quickCreate' | 'occasional'
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickNameError, setQuickNameError] = useState(null);

  const [occasional, setOccasional] = useState(EMPTY_OCCASIONAL);
  const [occNameError, setOccNameError] = useState(null);

  useEffect(() => {
    if (visible) {
      setMode('list');
      setSearch('');
      setQuickName('');
      setQuickPhone('');
      setQuickNameError(null);
      setOccasional(EMPTY_OCCASIONAL);
      setOccNameError(null);
    }
  }, [visible]);

  const activeClients = useMemo(() => clients.filter(c => !c.archived), [clients]);
  const filtered = useMemo(() => {
    const term = search.trim();
    return term ? activeClients.filter(c => matchesClientSearch(c, term)) : activeClients;
  }, [activeClients, search]);

  function selectExisting(client) {
    onSelect({
      id: client.id,
      name: client.name,
      phone: client.phone ?? null,
      email: client.email ?? null,
      address: client.address ?? null,
    });
  }

  function useOccasionalClient() {
    if (!occasional.name.trim()) {
      setOccNameError('Ingresá el nombre del cliente');
      return;
    }
    onSelect({
      id: null,
      name: occasional.name.trim(),
      phone: occasional.phone.trim() || null,
      email: occasional.email.trim() || null,
      address: occasional.address.trim() || null,
    });
  }

  async function saveQuickClient() {
    if (!quickName.trim()) {
      setQuickNameError('Ingresá el nombre del cliente');
      return;
    }
    setSaving(true);
    try {
      const id = await createClient(user.uid, { name: quickName, phone: quickPhone });
      onSelect({ id, name: quickName.trim(), phone: quickPhone.trim() || null, email: null, address: null });
      showSnackbar('Cliente creado', 'success');
    } catch (error) {
      logError('ClientPickerSheet.saveQuickClient', error);
      showSnackbar('No se pudo crear el cliente. Revisá tu conexión.', 'error');
    } finally {
      setSaving(false);
    }
  }

  function goBackToList() {
    setMode('list');
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kbWrapper}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />

            {mode === 'list' && (
              <>
                <Text variant="titleMedium" style={styles.title}>Elegí un cliente</Text>
                <AppInput
                  label="Buscar por nombre o teléfono"
                  value={search}
                  onChangeText={setSearch}
                  style={styles.searchField}
                />

                <TouchableOpacity style={styles.actionRow} onPress={() => setMode('quickCreate')} activeOpacity={0.7}>
                  <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
                    <MaterialCommunityIcons name="account-plus-outline" size={19} color={colors.primary} />
                  </View>
                  <Text style={styles.actionRowText}>Crear cliente rápido</Text>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionRow} onPress={() => setMode('occasional')} activeOpacity={0.7}>
                  <View style={[styles.actionIcon, { backgroundColor: colors.warningLight }]}>
                    <MaterialCommunityIcons name="account-clock-outline" size={19} color={colors.warning} />
                  </View>
                  <Text style={styles.actionRowText}>Usar cliente ocasional</Text>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
                </TouchableOpacity>

                <FlatList
                  data={filtered}
                  keyExtractor={c => c.id}
                  style={styles.list}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      {activeClients.length === 0 ? 'Todavía no tenés clientes guardados' : 'Sin coincidencias'}
                    </Text>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.clientOption} onPress={() => selectExisting(item)} activeOpacity={0.7}>
                      <View style={styles.clientAvatar}>
                        <Text style={styles.clientAvatarText}>
                          {(item.name ?? '?').trim().charAt(0).toUpperCase() || '?'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyLarge" style={styles.clientName} numberOfLines={1}>{item.name}</Text>
                        {!!item.phone && (
                          <Text variant="bodySmall" style={styles.clientPhone} numberOfLines={1}>{item.phone}</Text>
                        )}
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                />
                <Button onPress={onClose} style={styles.cancelBtn}>Cancelar</Button>
              </>
            )}

            {mode === 'quickCreate' && (
              <>
                <View style={styles.modeHeader}>
                  <TouchableOpacity onPress={goBackToList} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
                  </TouchableOpacity>
                  <Text variant="titleMedium" style={styles.title}>Crear cliente rápido</Text>
                  <View style={{ width: 22 }} />
                </View>
                <ScrollView
                  style={styles.formScroll}
                  contentContainerStyle={styles.formContent}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  showsVerticalScrollIndicator={false}
                  automaticallyAdjustKeyboardInsets
                >
                  <AppInput
                    label="Nombre *"
                    value={quickName}
                    onChangeText={t => { setQuickName(t); setQuickNameError(null); }}
                    error={quickNameError}
                    autoCapitalize="words"
                    autoFocus
                  />
                  <AppInput
                    label="Teléfono / WhatsApp (opcional)"
                    value={quickPhone}
                    onChangeText={setQuickPhone}
                    keyboardType="phone-pad"
                    placeholder="Ej. 261 6565656"
                  />
                  <Text variant="bodySmall" style={styles.hint}>
                    Email, dirección y notas se pueden completar después desde la ficha del cliente.
                  </Text>
                  <Button mode="contained" onPress={saveQuickClient} loading={saving} disabled={saving} style={styles.saveBtn}>
                    Guardar y usar
                  </Button>
                </ScrollView>
              </>
            )}

            {mode === 'occasional' && (
              <>
                <View style={styles.modeHeader}>
                  <TouchableOpacity onPress={goBackToList} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
                  </TouchableOpacity>
                  <Text variant="titleMedium" style={styles.title}>Cliente ocasional</Text>
                  <View style={{ width: 22 }} />
                </View>
                <ScrollView
                  style={styles.formScroll}
                  contentContainerStyle={styles.formContent}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  showsVerticalScrollIndicator={false}
                  automaticallyAdjustKeyboardInsets
                >
                  <Text variant="bodySmall" style={styles.hint}>
                    Estos datos quedan solo en este presupuesto — no se crea una ficha de cliente.
                  </Text>
                  <AppInput
                    label="Nombre *"
                    value={occasional.name}
                    onChangeText={t => { setOccasional(p => ({ ...p, name: t })); setOccNameError(null); }}
                    error={occNameError}
                    autoCapitalize="words"
                    autoFocus
                  />
                  <AppInput
                    label="Teléfono / WhatsApp (opcional)"
                    value={occasional.phone}
                    onChangeText={t => setOccasional(p => ({ ...p, phone: t }))}
                    keyboardType="phone-pad"
                    placeholder="Ej. 261 6565656"
                  />
                  <AppInput
                    label="Email (opcional)"
                    value={occasional.email}
                    onChangeText={t => setOccasional(p => ({ ...p, email: t }))}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <AppInput
                    label="Dirección (opcional)"
                    value={occasional.address}
                    onChangeText={t => setOccasional(p => ({ ...p, address: t }))}
                    autoCapitalize="sentences"
                  />
                  <Button mode="contained" onPress={useOccasionalClient} style={styles.saveBtn}>
                    Usar este cliente
                  </Button>
                </ScrollView>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  kbWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    height: '86%',
    maxHeight: '86%',
    gap: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
  },
  title: {
    fontWeight: '700',
    color: colors.text,
  },
  searchField: {
    marginBottom: 0,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },

  list: {
    flex: 1,
    minHeight: 0,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingVertical: 20,
  },
  clientOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  clientAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
  },
  clientAvatarText: {
    fontWeight: '700',
    color: colors.primary,
  },
  clientName: {
    fontWeight: '600',
    color: colors.text,
  },
  clientPhone: {
    color: colors.textSecondary,
    marginTop: 1,
  },
  cancelBtn: {
    marginTop: 4,
  },

  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  hint: {
    color: colors.textSecondary,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    flexGrow: 1,
    gap: 12,
    paddingBottom: 12,
  },
  saveBtn: {
    marginTop: 8,
  },
});
