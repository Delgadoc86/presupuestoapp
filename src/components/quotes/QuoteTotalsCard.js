import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, TextInput } from 'react-native-paper';
import { formatCurrency } from '../../utils/formatters';
import { DISCOUNT_TYPE } from '../../utils/constants';
import { colors } from '../../theme/colors';

function TotalRow({ label, value, bold, color, size }) {
  const textStyle = [
    styles.rowText,
    bold && styles.bold,
    color && { color },
    size && { fontSize: size },
  ];
  return (
    <View style={styles.totalRow}>
      <Text style={textStyle}>{label}</Text>
      <Text style={textStyle}>{value}</Text>
    </View>
  );
}

export default function QuoteTotalsCard({
  subtotal,
  discount,
  discountType,
  onDiscountChange,
  onDiscountTypeChange,
  advance,
  onAdvanceChange,
}) {
  const discountNum = parseFloat(discount) || 0;
  const advanceNum  = parseFloat(advance)  || 0;

  const discountAmount =
    discountType === DISCOUNT_TYPE.PERCENT
      ? subtotal * (discountNum / 100)
      : discountNum;

  const total  = Math.max(0, subtotal - discountAmount);
  const saldo  = Math.max(0, total - advanceNum);

  return (
    <Surface style={styles.card} elevation={1}>
      <TotalRow label="Subtotal" value={formatCurrency(subtotal)} />

      {/* Descuento */}
      <View style={styles.inputRow}>
        <Text style={styles.rowText}>Descuento</Text>
        <View style={styles.inputRight}>
          <View style={styles.inputWithToggle}>
            <TextInput
              value={discount}
              onChangeText={onDiscountChange}
              mode="outlined"
              dense
              keyboardType="numeric"
              selectTextOnFocus
              placeholder="0"
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              outlineStyle={styles.inputOutline}
              style={styles.numberInput}
            />
            <TouchableOpacity
              style={styles.typeToggle}
              onPress={() =>
                onDiscountTypeChange(
                  discountType === DISCOUNT_TYPE.FIXED
                    ? DISCOUNT_TYPE.PERCENT
                    : DISCOUNT_TYPE.FIXED
                )
              }
            >
              <Text style={styles.typeLabel}>
                {discountType === DISCOUNT_TYPE.FIXED ? '$' : '%'}
              </Text>
            </TouchableOpacity>
          </View>
          {discountAmount > 0 && (
            <Text style={styles.discountAmount}>−{formatCurrency(discountAmount)}</Text>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      <TotalRow
        label="TOTAL"
        value={formatCurrency(total)}
        bold
        color={colors.success}
        size={18}
      />

      {/* Anticipo */}
      <View style={styles.inputRow}>
        <Text style={styles.rowText}>Anticipo</Text>
        <View style={styles.inputRight}>
          <TextInput
            value={advance}
            onChangeText={onAdvanceChange}
            mode="outlined"
            dense
            keyboardType="numeric"
            selectTextOnFocus
            placeholder="0"
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            outlineStyle={styles.inputOutline}
            style={styles.numberInput}
          />
          {advanceNum > 0 && (
            <Text style={styles.discountAmount}>−{formatCurrency(advanceNum)}</Text>
          )}
        </View>
      </View>

      {/* Saldo pendiente */}
      {advanceNum > 0 && (
        <>
          <View style={styles.divider} />
          <TotalRow
            label="Saldo pendiente"
            value={formatCurrency(saldo)}
            bold
            color={colors.sent}
          />
        </>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowText: {
    fontSize: 14,
    color: colors.text,
  },
  bold: {
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  inputRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputWithToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  numberInput: {
    width: 90,
    backgroundColor: colors.surface,
  },
  inputOutline: {
    borderRadius: 8,
  },
  typeToggle: {
    width: 36,
    height: 36,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  discountAmount: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '600',
  },
});
