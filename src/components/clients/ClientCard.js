import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default function ClientCard({ client, onPress, onOptions, archived = false }) {
  const initial = (client.name ?? '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <Surface style={[styles.card, archived && styles.cardArchived]} elevation={1}>
        <View style={styles.row}>
          <View style={[styles.avatar, archived && styles.avatarArchived]}>
            <Text style={[styles.avatarText, archived && styles.avatarTextArchived]}>{initial}</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.name} numberOfLines={1}>{client.name}</Text>
            {!!client.phone && (
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="phone-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.meta} numberOfLines={1}>{client.phone}</Text>
              </View>
            )}
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
  cardArchived: {
    opacity: 0.7,
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
    backgroundColor: colors.primaryLight,
  },
  avatarArchived: {
    backgroundColor: colors.surfaceVariant,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  avatarTextArchived: {
    color: colors.textMuted,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  optionsBtn: {
    padding: 4,
  },
});
