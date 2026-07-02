import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_COLOR, QUOTE_STATUS_BG_COLOR } from '../../utils/constants';

export default function QuoteStatusBadge({ status }) {
  const label = QUOTE_STATUS_LABEL[status] ?? status;
  const color = QUOTE_STATUS_COLOR[status]    ?? '#64748B';
  const bg    = QUOTE_STATUS_BG_COLOR[status] ?? `${color}20`;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text variant="labelSmall" style={[styles.label, { color }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontWeight: '600',
  },
});
