import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput, Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCurrency } from '../../utils/formatters';
import { colors } from '../../theme/colors';

export default function QuoteItemRow({ item, index, onChange, onDelete }) {
  return (
    <Surface style={styles.card} elevation={0}>
      {/* Fila 1: descripción + eliminar */}
      <View style={styles.row1}>
        <TextInput
          value={item.description}
          onChangeText={v => onChange('description', v)}
          mode="outlined"
          dense
          placeholder={`Ítem ${index + 1}`}
          style={styles.descInput}
          outlineStyle={styles.outline}
          autoCapitalize="sentences"
        />
        <TouchableOpacity
          onPress={onDelete}
          style={styles.deleteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Fila 2: cantidad × precio = subtotal */}
      <View style={styles.row2}>
        <View style={styles.quantityWrapper}>
          <Text variant="bodySmall" style={styles.fieldLabel}>
            Cant.
          </Text>
          <TextInput
            value={String(item.quantity)}
            onChangeText={v => onChange('quantity', v)}
            mode="outlined"
            dense
            keyboardType="numeric"
            style={styles.smallInput}
            outlineStyle={styles.outline}
          />
        </View>

        <Text style={styles.operator}>×</Text>

        <View style={styles.priceWrapper}>
          <Text variant="bodySmall" style={styles.fieldLabel}>
            Precio unit.
          </Text>
          <TextInput
            value={String(item.unitPrice)}
            onChangeText={v => onChange('unitPrice', v)}
            mode="outlined"
            dense
            keyboardType="numeric"
            style={styles.priceInput}
            outlineStyle={styles.outline}
          />
        </View>

        <View style={styles.subtotalWrapper}>
          <Text variant="bodySmall" style={styles.fieldLabel}>
            Subtotal
          </Text>
          <Text variant="bodyMedium" style={styles.subtotal}>
            {formatCurrency(item.subtotal ?? 0)}
          </Text>
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  descInput: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  deleteBtn: {
    padding: 4,
    marginTop: 4,
  },
  row2: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  fieldLabel: {
    color: colors.textSecondary,
    marginBottom: 3,
  },
  quantityWrapper: {
    width: 64,
  },
  priceWrapper: {
    flex: 1,
  },
  subtotalWrapper: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  smallInput: {
    backgroundColor: colors.surface,
  },
  priceInput: {
    backgroundColor: colors.surface,
  },
  operator: {
    color: colors.textSecondary,
    fontSize: 18,
    marginBottom: 8,
  },
  subtotal: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  outline: {
    borderRadius: 8,
  },
});
