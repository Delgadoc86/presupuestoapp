import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCurrency } from '../../utils/formatters';
import { colors } from '../../theme/colors';

const inputOutlineStyle = { borderRadius: 8 };

export default function QuoteItemRow({ item, index, onChange, onDelete }) {
  return (
    <View style={styles.card}>
      {/* Fila 1: descripción + eliminar */}
      <View style={styles.row1}>
        <TextInput
          value={item.description}
          onChangeText={v => onChange('description', v)}
          mode="outlined"
          dense
          placeholder={`Descripción del ítem ${index + 1}`}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          outlineStyle={inputOutlineStyle}
          style={styles.descInput}
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
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Cant.</Text>
          <TextInput
            value={String(item.quantity)}
            onChangeText={v => onChange('quantity', v)}
            mode="outlined"
            dense
            keyboardType="numeric"
            selectTextOnFocus
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            outlineStyle={inputOutlineStyle}
            style={styles.smallInput}
          />
        </View>

        <Text style={styles.operator}>×</Text>

        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={styles.fieldLabel}>Precio unit.</Text>
          <TextInput
            value={String(item.unitPrice)}
            onChangeText={v => onChange('unitPrice', v)}
            mode="outlined"
            dense
            keyboardType="numeric"
            selectTextOnFocus
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            outlineStyle={inputOutlineStyle}
            style={styles.priceInput}
          />
        </View>

        <View style={styles.subtotalGroup}>
          <Text style={styles.fieldLabel}>Subtotal</Text>
          <Text style={styles.subtotalValue}>
            {formatCurrency(item.subtotal ?? 0)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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
  fieldGroup: {
    gap: 3,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 2,
  },
  smallInput: {
    width: 64,
    backgroundColor: colors.surface,
  },
  priceInput: {
    backgroundColor: colors.surface,
  },
  operator: {
    color: colors.textMuted,
    fontSize: 16,
    marginBottom: 10,
  },
  subtotalGroup: {
    alignItems: 'flex-end',
    gap: 3,
    minWidth: 88,
    paddingBottom: 2,
  },
  subtotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
    marginBottom: 8,
  },
});
