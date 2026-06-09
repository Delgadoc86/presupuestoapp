import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCurrency } from '../../utils/formatters';
import { colors } from '../../theme/colors';

export default function TemplateItemRow({
  item,
  index,
  totalItems,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}) {
  return (
    <Surface style={styles.row} elevation={0}>
      {/* Orden y nombre */}
      <View style={styles.left}>
        <Text variant="labelSmall" style={styles.order}>
          {index + 1}
        </Text>
        <View style={styles.info}>
          <Text variant="bodyMedium" style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text variant="bodySmall" style={styles.meta}>
            {item.defaultPrice != null
              ? `${formatCurrency(item.defaultPrice)} · ${item.unit || 'unidad'}`
              : item.unit || 'unidad'}
          </Text>
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onMoveUp}
          disabled={index === 0}
          style={[styles.iconBtn, index === 0 && styles.disabled]}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <MaterialCommunityIcons
            name="chevron-up"
            size={20}
            color={index === 0 ? colors.border : colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onMoveDown}
          disabled={index === totalItems - 1}
          style={[styles.iconBtn, index === totalItems - 1 && styles.disabled]}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <MaterialCommunityIcons
            name="chevron-down"
            size={20}
            color={index === totalItems - 1 ? colors.border : colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onEdit}
          style={styles.iconBtn}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onDelete}
          style={styles.iconBtn}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  order: {
    width: 20,
    textAlign: 'center',
    color: colors.textSecondary,
    fontWeight: '600',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: '500',
    color: colors.text,
  },
  meta: {
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 4,
  },
  disabled: {
    opacity: 0.3,
  },
});
