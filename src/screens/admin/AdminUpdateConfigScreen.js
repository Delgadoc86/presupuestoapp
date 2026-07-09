import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import AppLoader from '../../components/common/AppLoader';
import { useAppContext } from '../../context/AppContext';
import { getUpdateInfo, saveUpdateInfo } from '../../services/appUpdate.service';
import { colors } from '../../theme/colors';

export default function AdminUpdateConfigScreen({ navigation }) {
  const { showSnackbar } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNewDoc, setIsNewDoc] = useState(true);

  const [active, setActive] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getUpdateInfo().then((data) => {
      if (data) {
        setIsNewDoc(false);
        setActive(!!data.active);
        setLatestVersion(data.latestVersion ?? '');
        setTitle(data.title ?? '');
        setMessage(data.message ?? '');
        setDownloadUrl(data.downloadUrl ?? '');
      }
      setLoading(false);
    });
  }, []);

  function validate() {
    const next = {};
    if (!/^\d+\.\d+\.\d+$/.test(latestVersion.trim())) {
      next.latestVersion = 'Formato esperado: X.X.X (ej: 1.0.7)';
    }
    if (!title.trim()) next.title = 'El título es obligatorio';
    if (!message.trim()) next.message = 'El mensaje es obligatorio';
    if (!/^https?:\/\/.+/.test(downloadUrl.trim())) {
      next.downloadUrl = 'Debe ser una URL válida (http:// o https://)';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      await saveUpdateInfo(
        {
          active,
          latestVersion: latestVersion.trim(),
          title: title.trim(),
          message: message.trim(),
          downloadUrl: downloadUrl.trim(),
        },
        isNewDoc
      );
      setIsNewDoc(false);
      showSnackbar('Configuración de actualización guardada', 'success');
    } catch {
      showSnackbar('No se pudo guardar. Intentá de nuevo.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppLoader visible={loading || saving} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="titleLarge" style={styles.headerTitle}>Configurar actualización</Text>
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
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Aviso activo</Text>
              <Text style={styles.switchDesc}>
                Si está apagado, ningún usuario verá el aviso aunque haya una versión nueva.
              </Text>
            </View>
            <Switch value={active} onValueChange={setActive} color={colors.primary} />
          </View>

          <AppInput
            label="Última versión disponible (ej: 1.0.7)"
            value={latestVersion}
            onChangeText={setLatestVersion}
            error={errors.latestVersion}
            autoCapitalize="none"
            style={styles.field}
          />
          <AppInput
            label="Título del aviso"
            value={title}
            onChangeText={setTitle}
            error={errors.title}
            style={styles.field}
          />
          <AppInput
            label="Mensaje breve"
            value={message}
            onChangeText={setMessage}
            error={errors.message}
            multiline
            numberOfLines={3}
            style={styles.field}
          />
          <AppInput
            label="URL de descarga (tu web)"
            value={downloadUrl}
            onChangeText={setDownloadUrl}
            error={errors.downloadUrl}
            autoCapitalize="none"
            keyboardType="url"
            style={styles.field}
          />

          <AppButton onPress={handleSave} loading={saving} style={styles.saveBtn}>
            Guardar configuración
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  switchDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  field: {
    marginBottom: 14,
  },
  saveBtn: {
    marginTop: 8,
  },
});
