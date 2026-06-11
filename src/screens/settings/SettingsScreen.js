import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useIsAdmin } from '../../hooks/useIsAdmin';

const SettingRow = ({ icon, label, description, onPress, iconColor }) => {
  const theme = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Surface style={styles.row} elevation={0}>
        <View style={[styles.rowIcon, { backgroundColor: `${iconColor}18` }]}>
          <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
        </View>
        <View style={styles.rowText}>
          <Text variant="bodyLarge" style={{ fontWeight: '600', color: colors.text }}>
            {label}
          </Text>
          {description && (
            <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
              {description}
            </Text>
          )}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
      </Surface>
    </TouchableOpacity>
  );
};

export default function SettingsScreen({ navigation }) {
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text variant="headlineSmall" style={styles.title}>
          Ajustes
        </Text>

        <View style={styles.section}>
          <Text variant="labelMedium" style={styles.sectionLabel}>
            MI NEGOCIO
          </Text>
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
          <Text variant="labelMedium" style={styles.sectionLabel}>
            MI CUENTA
          </Text>
          <Surface style={styles.card} elevation={1}>
            <SettingRow
              icon="account-outline"
              label="Cuenta"
              description="Email y contraseña"
              iconColor={colors.statusSent}
              onPress={() => navigation.navigate('Account')}
            />
          </Surface>
        </View>

        {!adminLoading && isAdmin && (
          <View style={styles.section}>
            <Text variant="labelMedium" style={styles.sectionLabel}>
              ADMINISTRACIÓN
            </Text>
            <Surface style={styles.card} elevation={1}>
              <SettingRow
                icon="shield-account-outline"
                label="Panel Admin"
                description="Gestionar usuarios y planes"
                iconColor="#E03131"
                onPress={() => navigation.navigate('AdminDashboard')}
              />
            </Surface>
          </View>
        )}
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
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  section: {
    gap: 8,
    marginBottom: 8,
  },
  sectionLabel: {
    color: colors.textSecondary,
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 74,
  },
});
