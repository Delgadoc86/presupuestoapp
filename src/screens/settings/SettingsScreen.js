import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { colors } from '../../theme/colors';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { openSupportEmail, openUpgradeEmail } from '../../utils/contactHelper';
import { useAuthContext } from '../../context/AuthContext';
import { APP_CONFIG } from '../../config/appConfig';

const SettingRow = ({ icon, label, description, onPress, iconColor }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <Surface style={styles.row} elevation={0}>
      <View style={[styles.rowIcon, { backgroundColor: `${iconColor}18` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description && (
          <Text style={styles.rowDesc}>{description}</Text>
        )}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
    </Surface>
  </TouchableOpacity>
);

export default function SettingsScreen({ navigation }) {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { user } = useAuthContext();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Ajustes</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MI NEGOCIO</Text>
          <Surface style={styles.card} elevation={1}>
            <SettingRow
              icon="store-outline"
              label="Perfil del negocio"
              description="Logo, nombre, rubro, contacto"
              iconColor={colors.primary}
              onPress={() => navigation.navigate('BusinessProfile')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="file-document-multiple-outline"
              label="Mis plantillas"
              description="Ítems predefinidos por tipo de trabajo"
              iconColor={colors.warning}
              onPress={() => navigation.navigate('TemplateList')}
            />
          </Surface>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MI CUENTA</Text>
          <Surface style={styles.card} elevation={1}>
            <SettingRow
              icon="account-outline"
              label="Cuenta"
              description="Email y contraseña"
              iconColor={colors.sent}
              onPress={() => navigation.navigate('Account')}
            />
          </Surface>
        </View>

        {!adminLoading && isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ADMINISTRACIÓN</Text>
            <Surface style={[styles.card, styles.adminCard]} elevation={1}>
              <SettingRow
                icon="shield-account-outline"
                label="Panel Admin"
                description="Gestionar usuarios y planes"
                iconColor="#DC2626"
                onPress={() => navigation.navigate('AdminDashboard')}
              />
            </Surface>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SOPORTE</Text>
          <Surface style={styles.card} elevation={1}>
            <SettingRow
              icon="crown-outline"
              label="Activar Plan Pro"
              description="Presupuestos ilimitados"
              iconColor={colors.success}
              onPress={() => openUpgradeEmail(user?.email)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="help-circle-outline"
              label="Contactar soporte"
              description={APP_CONFIG.supportEmail}
              iconColor={colors.primary}
              onPress={() => openSupportEmail(
                `Consulta sobre ${APP_CONFIG.appName}`,
                `Hola Cristian, mi cuenta es: ${user?.email ?? ''}\n\nMi consulta:\n`
              )}
            />
          </Surface>
        </View>

        <Text style={styles.version}>
          Versión de la app: {Application.nativeApplicationVersion ?? APP_CONFIG.version}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  section: {
    gap: 8,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  adminCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    backgroundColor: 'transparent',
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  rowDesc: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 74,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
    paddingBottom: 8,
  },
});
