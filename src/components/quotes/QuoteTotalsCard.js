import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, TextInput } from 'react-native-paper';
import { formatCurrency } from '../../utils/formatters';
import { DISCOUNT_TYPE } from '../../utils/constants';
import { colors } from '../../theme/colors';

function TotalRow({ label, value, bold, color }) {
  return (
    <View style={styles.totalRow}>
      <Text
        variant={bold ? 'titleMedium' : 'bodyMedium'}
        style={[styles.totalLabel, bold && styles.bold, color && { color }]}
      >
        {label}
      </Text>
      <Text
        variant={bold ? 'titleMedium' : 'bodyMedium'}
        style={[styles.totalValue, bold && styles.bold, color && { color }]}
      >
        {value}
      </Text>
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
  const advanceNum = parseFloat(advance) || 0;

  const discountAmount =
    discountType === DISCOUNT_TYPE.PERCENT
      ? subtotal * (discountNum / 100)
      : discountNum;

  const total = Math.max(0, subtotal - discountAmount);
  const saldo = Math.max(0, total - advanceNum);

  return (
    <Surface style={styles.card} elevation={1}>
      <TotalRow label="Subtotal" value={formatCurrency(subtotal)} />

      {/* Descuento */}
      <View style={styles.discountRow}>
        <Text variant="bodyMedium" style={styles.totalLabel}>
          Descuento
        </Text>
        <View style={styles.discountRight}>
          <View style={styles.discountInputWrapper}>
            <TextInput
              value={discount}
              onChangeText={onDiscountChange}
              mode="outlined"
              dense
              keyboardType="numeric"
              style={styles.discountInput}
              outlineStyle={styles.inputOutline}
            />
            {/* Toggle $ / % */}
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
              <Text variant="labelMedium" style={styles.typeLabel}>
                {discountType === DISCOUNT_TYPE.FIXED ? '$' : '%'}
              </Text>
            </TouchableOpacity>
          </View>
          {discountAmount > 0 && (
            <Text variant="bodyMedium" style={styles.discountAmount}>
              -{formatCurrency(discountAmount)}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      <TotalRow
        label="TOTAL"
        value={formatCurrency(total)}
        bold
        color={colors.primary}
      />

      {/* Anticipo */}
      <View style={styles.discountRow}>
        <Text variant="bodyMedium" style={styles.totalLabel}>
          Anticipo
        </Text>
        <View style={styles.discountRight}>
          <TextInput
            value={advance}
            onChangeText={onAdvanceChange}
            mode="outlined"
            dense
            keyboardType="numeric"
            style={styles.discountInput}
            outlineStyle={styles.inputOutline}
          />
          {advanceNum > 0 && (
            <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
              -{formatCurrency(advanceNum)}
            </Text>
          )}
        </View>
      </View>

      {/* Saldo pendiente (solo si hay anticipo) */}
      {advanceNum > 0 && (
        <>
          <View style={styles.divider} />
          <TotalRow
            label="Saldo pendiente"
            value={formatCurrency(saldo)}
            bold
            color={colors.statusSent}
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
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: colors.text,
  },
  totalValue: {
    color: colors.text,
  },
  bold: {
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  discountRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  discountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  discountInput: {
    width: 90,
    backgroundColor: colors.surface,
  },
  inputOutline: {
    borderRadius: 8,
  },
  typeToggle: {
    width: 36,
    height: 36,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  typeLabel: {
    fontWeight: '700',
    color: colors.primary,
  },
  discountAmount: {
    color: colors.error,
    fontWeight: '500',
  },
});
