import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppInput from './AppInput';
import { SECTOR_OPTIONS } from '../../utils/constants';
import { colors } from '../../theme/colors';

const PREDEFINED = SECTOR_OPTIONS.filter(o => o !== 'Otro');

/**
 * Selector de rubro con lista precargada + opción "Otro" para texto libre.
 *
 * Props:
 *   value     {string}   — valor actual (form.sector)
 *   onChange  {function} — callback al cambiar (v => updateField('sector', v))
 *   error     {string}   — mensaje de error de validación
 */
export default function SectorPickerField({ value, onChange, error }) {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [isOther, setIsOther] = useState(false);

  // Inicialización en modo edición: cuando value llega desde Firestore
  // determinamos si es un rubro de la lista o un valor personalizado.
  const initialized = useRef(false);
  useEffect(() => {
    if (!value || initialized.current) return;
    initialized.current = true;
    setIsOther(!PREDEFINED.includes(value));
  }, [value]);

  function handleSelect(option) {
    setModalVisible(false);
    if (option === 'Otro') {
      setIsOther(true);
      onChange('');
    } else {
      setIsOther(false);
      onChange(option);
    }
  }

  const displayLabel = isOther ? 'Otro' : value || null;
  const hasError = !!error;

  return (
    <View style={styles.wrapper}>
      {/* Botón selector */}
      <TouchableOpacity
        style={[styles.selector, hasError && styles.selectorError]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.selectorText, !displayLabel && styles.placeholder]}
          numberOfLines={1}
        >
          {displayLabel ?? 'Seleccioná tu rubro *'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
      {hasError && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Campo libre cuando elige "Otro" */}
      {isOther && (
        <AppInput
          label="Ingresá tu rubro *"
          value={value}
          onChangeText={onChange}
          autoCapitalize="sentences"
          returnKeyType="done"
        />
      )}

      {/* Modal bottom sheet con lista de rubros */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text variant="titleMedium" style={styles.sheetTitle}>
              Seleccioná tu rubro
            </Text>
            <FlatList
              data={SECTOR_OPTIONS}
              keyExtractor={item => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = isOther ? item === 'Otro' : item === value;
                return (
                  <TouchableOpacity
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.7}
                  >
                    <Text
                      variant="bodyLarge"
                      style={[styles.optionText, isSelected && { color: theme.colors.primary, fontWeight: '700' }]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
            <Button onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
              Cancelar
            </Button>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectorError: {
    borderColor: colors.error,
  },
  selectorText: {
    color: colors.text,
    fontSize: 16,
    flex: 1,
  },
  placeholder: {
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginLeft: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
    gap: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetTitle: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSelected: {
    backgroundColor: `${colors.primary}08`,
  },
  optionText: {
    color: colors.text,
  },
  cancelBtn: {
    marginTop: 4,
  },
});
