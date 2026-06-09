import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QuoteStatusBadge from './QuoteStatusBadge';
import { formatCurrency, formatDate, formatQuoteNumber } from '../../utils/formatters';
import { colors } from '../../theme/colors';

export default function QuoteCard({ quote, onPress, onOptions }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <Surface style={styles.card} elevation={1}>
        {/* Fila superior: número + estado + opciones */}
        <View style={styles.topRow}>
          <Text variant="labelLarge" style={styles.number}>
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
          {quote.client?.name ?? 'Sin cliente'}
        </Text>

        {/* Fila inferior: fecha + total */}
        <View style={styles.bottomRow}>
          <Text variant="bodySmall" style={styles.date}>
            {formatDate(quote.createdAt)}
          </Text>
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
    borderRadius: 16,
    padding: 16,
    gap: 8,
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
  },
  number: {
    color: colors.textSecondary,
    fontWeight: '600',
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
  date: {
    color: colors.textSecondary,
  },
  total: {
    fontWeight: '700',
    color: colors.primary,
  },
});
