import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QuoteStatusBadge from './QuoteStatusBadge';
import { formatCurrency, formatDate, formatQuoteNumber } from '../../utils/formatters';
import { colors } from '../../theme/colors';

export default function QuoteCard({ quote, onPress, onOptions }) {
  const clientName = quote.client?.name ?? 'Sin cliente';
  const clientPhone = quote.client?.phone;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <Surface style={styles.card} elevation={1}>
        {/* Fila superior: número + badge + opciones */}
        <View style={styles.topRow}>
          <Text variant="labelMedium" style={styles.number}>
            {formatQuoteNumber(quote.quoteNumber)}
          </Text>
          <View style={styles.topRight}>
            <QuoteStatusBadge status={quote.status} />
            {!!onOptions && (
              <TouchableOpacity
                onPress={onOptions}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.optionsBtn}
              >
                <MaterialCommunityIcons
                  name="dots-vertical"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Nombre del cliente */}
        <Text variant="titleSmall" style={styles.clientName} numberOfLines={1}>
          {clientName}
        </Text>

        {/* Fila inferior: fecha (+ teléfono si existe) + total */}
        <View style={styles.bottomRow}>
          <View style={styles.metaLeft}>
            <Text variant="bodySmall" style={styles.date}>
              {formatDate(quote.createdAt)}
            </Text>
            {!!clientPhone && (
              <Text variant="bodySmall" style={styles.phone} numberOfLines={1}>
                · {clientPhone}
              </Text>
            )}
          </View>
          <Text variant="titleSmall" style={styles.total}>
            {formatCurrency(quote.total ?? 0)}
          </Text>
        </View>
      </Surface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  optionsBtn: {
    padding: 2,
    marginLeft: 2,
  },
  number: {
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  clientName: {
    fontWeight: '600',
    color: colors.text,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  date: {
    color: colors.textSecondary,
  },
  phone: {
    color: colors.textSecondary,
    flexShrink: 1,
  },
  total: {
    fontWeight: '700',
    color: colors.primary,
  },
});
