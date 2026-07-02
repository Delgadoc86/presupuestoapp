import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QuoteStatusBadge from './QuoteStatusBadge';
import { formatCurrency, formatDate, formatQuoteNumber } from '../../utils/formatters';
import { colors } from '../../theme/colors';
import { QUOTE_STATUS_COLOR, QUOTE_STATUS_BG_COLOR } from '../../utils/constants';

function ClientAvatar({ name, status }) {
  const initial  = (name ?? '?')[0].toUpperCase();
  const color    = QUOTE_STATUS_COLOR[status]    ?? colors.primary;
  const bg       = QUOTE_STATUS_BG_COLOR[status] ?? colors.primaryLight;
  return (
    <View style={[styles.avatar, { backgroundColor: bg }]}>
      <Text style={[styles.avatarText, { color }]}>{initial}</Text>
    </View>
  );
}

export default function QuoteCard({ quote, onPress, onOptions }) {
  const clientName = quote.client?.name ?? 'Sin cliente';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <Surface style={styles.card} elevation={1}>
        <View style={styles.row}>
          <ClientAvatar name={clientName} status={quote.status} />

          <View style={styles.content}>
            <Text style={styles.clientName} numberOfLines={1}>{clientName}</Text>
            <Text style={styles.meta}>
              {formatQuoteNumber(quote.quoteNumber)} · {formatDate(quote.createdAt)}
            </Text>
          </View>

          <View style={styles.rightCol}>
            <Text style={styles.total}>{formatCurrency(quote.total ?? 0)}</Text>
            <QuoteStatusBadge status={quote.status} />
          </View>

          {!!onOptions && (
            <TouchableOpacity
              onPress={onOptions}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.optionsBtn}
            >
              <MaterialCommunityIcons name="dots-vertical" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </Surface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },
  optionsBtn: {
    padding: 4,
  },
});
