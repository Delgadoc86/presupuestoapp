import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, SegmentedButtons, ActivityIndicator, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import AppLoader from '../../components/common/AppLoader';
import { useBusinessForm } from '../../hooks/useBusiness';
import { useBusinessContext } from '../../context/BusinessContext';
import { colors } from '../../theme/colors';
import { VALIDITY_DAYS_OPTIONS } from '../../utils/constants';

export default function BusinessProfileScreen({ navigation }) {
  const theme = useTheme();
  const { loading: businessLoading } = useBusinessContext();
  const { form, updateField, logoUri, pickLogo, deleteLogo, errors, loading, save } =
    useBusinessForm(false);

  async function handleSave() {
    const ok = await save();
    if (ok) navigation.goBack();
  }

  if (businessLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
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
          Mi negocio
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
          {/* Logo */}
          <View style={styles.logoArea}>
            <TouchableOpacity onPress={pickLogo} activeOpacity={0.75} style={styles.logoTouchable}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoImage} />
              ) : (
                <View style={[styles.logoPlaceholder, { borderColor: theme.colors.primary }]}>
                  <MaterialCommunityIcons
                    name="camera-plus-outline"
                    size={36}
                    color={theme.colors.primary}
                  />
                </View>
              )}
              <Text
                variant="labelLarge"
                style={{ color: theme.colors.primary, marginTop: 10 }}
              >
                {logoUri ? 'Cambiar logo' : 'Agregar logo (opcional)'}
              </Text>
            </TouchableOpacity>

            {logoUri ? (
              <TouchableOpacity
                style={styles.deleteLogoBtn}
                onPress={() =>
                  Alert.alert(
                    'Eliminar logo',
                    '¿Querés eliminar el logo del negocio? Esta acción no puede deshacerse.',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Eliminar', style: 'destructive', onPress: deleteLogo },
                    ]
                  )
                }
              >
                <MaterialCommunityIcons name="trash-can-outline" size={15} color={colors.error} />
                <Text variant="labelMedium" style={styles.deleteLogoText}>
                  Eliminar logo
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Sección: Datos básicos */}
          <View style={styles.section}>
            <Text variant="labelMedium" style={styles.sectionLabel}>
              TU NEGOCIO
            </Text>

            <AppInput
              label="Nombre del negocio *"
              value={form.businessName}
              onChangeText={v => updateField('businessName', v)}
              error={errors.businessName}
              autoCapitalize="words"
              returnKeyType="next"
            />
            <AppInput
              label="Rubro / actividad *"
              value={form.sector}
              onChangeText={v => updateField('sector', v)}
              error={errors.sector}
              placeholder="Ej: Costurera, Mecánico, Electricista..."
              autoCapitalize="sentences"
              returnKeyType="next"
            />
          </View>

          {/* Sección: Contacto */}
          <View style={styles.section}>
            <Text variant="labelMedium" style={styles.sectionLabel}>
              CONTACTO
            </Text>

            <AppInput
              label="WhatsApp *"
              value={form.whatsapp}
              onChangeText={v => updateField('whatsapp', v)}
              error={errors.whatsapp}
              keyboardType="phone-pad"
              returnKeyType="next"
            />
            <AppInput
              label="Email del negocio"
              value={form.email}
              onChangeText={v => updateField('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
            <AppInput
              label="Dirección"
              value={form.address}
              onChangeText={v => updateField('address', v)}
              autoCapitalize="sentences"
              returnKeyType="next"
            />
            <AppInput
              label="CUIT (opcional)"
              value={form.cuit}
              onChangeText={v => updateField('cuit', v)}
              keyboardType="numeric"
              returnKeyType="next"
            />
          </View>

          {/* Sección: Presupuestos */}
          <View style={styles.section}>
            <Text variant="labelMedium" style={styles.sectionLabel}>
              PRESUPUESTOS
            </Text>

            <View style={styles.validityContainer}>
              <Text variant="bodyMedium" style={styles.validityLabel}>
                Validez del presupuesto
              </Text>
              <SegmentedButtons
                value={String(form.validityDays)}
                onValueChange={v => updateField('validityDays', Number(v))}
                buttons={VALIDITY_DAYS_OPTIONS.map(d => ({
                  value: String(d),
                  label: `${d} días`,
                }))}
                style={styles.segmented}
              />
            </View>

            <AppInput
              label="Condiciones generales"
              value={form.generalConditions}
              onChangeText={v => updateField('generalConditions', v)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Ej: Presupuesto válido sujeto a disponibilidad de materiales."
              autoCapitalize="sentences"
            />
          </View>

          {/* Botón guardar */}
          <AppButton onPress={handleSave} loading={loading}>
            Guardar cambios
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontWeight: '700',
    color: colors.text,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 24,
  },
  logoArea: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  logoTouchable: {
    alignItems: 'center',
  },
  deleteLogoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteLogoText: {
    color: colors.error,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  section: {
    gap: 14,
  },
  sectionLabel: {
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  validityContainer: {
    gap: 10,
  },
  validityLabel: {
    color: colors.text,
    fontWeight: '500',
  },
  segmented: {
    borderRadius: 12,
  },
});
