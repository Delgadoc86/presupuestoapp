import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import AppLoader from '../../components/common/AppLoader';
import { createClient, updateClient } from '../../services/clients.service';
import { useAuthContext } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { logError } from '../../utils/errorUtils';
import { colors } from '../../theme/colors';

export default function ClientFormScreen({ navigation, route }) {
  const { user } = useAuthContext();
  const { showSnackbar } = useAppContext();

  const existingClient = route.params?.client ?? null;
  const isEditing = !!existingClient;

  const [name, setName] = useState(existingClient?.name ?? '');
  const [phone, setPhone] = useState(existingClient?.phone ?? '');
  const [email, setEmail] = useState(existingClient?.email ?? '');
  const [address, setAddress] = useState(existingClient?.address ?? '');
  const [notes, setNotes] = useState(existingClient?.notes ?? '');
  const [nameError, setNameError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      setNameError('Ingresá el nombre del cliente');
      return;
    }
    setLoading(true);
    try {
      const data = { name, phone, email, address, notes };
      let clientId = existingClient?.id;
      if (isEditing) {
        await updateClient(existingClient.id, data);
        showSnackbar('Cliente actualizado', 'success');
      } else {
        clientId = await createClient(user.uid, data);
        showSnackbar('Cliente creado', 'success');
      }
      navigation.goBack();
    } catch (error) {
      logError('ClientFormScreen', error);
      showSnackbar('No se pudo guardar. Revisá tu conexión.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppLoader visible={loading} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="titleLarge" style={styles.headerTitle}>
          {isEditing ? 'Editar cliente' : 'Nuevo cliente'}
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
          <View style={styles.section}>
            <Text variant="labelMedium" style={styles.sectionLabel}>DATOS DEL CLIENTE</Text>
            <AppInput
              label="Nombre *"
              value={name}
              onChangeText={t => { setName(t); setNameError(null); }}
              error={nameError}
              autoCapitalize="words"
              returnKeyType="next"
            />
            <AppInput
              label="Teléfono / WhatsApp (opcional)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Ej. 261 6565656"
              returnKeyType="next"
            />
            <AppInput
              label="Email (opcional)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
            <AppInput
              label="Dirección (opcional)"
              value={address}
              onChangeText={setAddress}
              autoCapitalize="sentences"
              returnKeyType="next"
            />
            <AppInput
              label="Notas (opcional)"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoCapitalize="sentences"
            />
          </View>

          <AppButton onPress={handleSave} loading={loading}>
            {isEditing ? 'Guardar cambios' : 'Guardar cliente'}
          </AppButton>
        </ScrollView>
      </KeyboardAvoidingView>
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
});
