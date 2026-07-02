import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Text } from 'react-native-paper';
import { colors } from '../../theme/colors';

export default function AppInput({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry,
  style,
  ...rest
}) {
  const [secure, setSecure] = useState(secureTextEntry ?? false);

  return (
    <View style={style}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        mode="outlined"
        error={!!error}
        secureTextEntry={secure}
        outlineColor={colors.border}
        activeOutlineColor={colors.primary}
        outlineStyle={styles.outline}
        style={styles.input}
        right={
          secureTextEntry ? (
            <TextInput.Icon
              icon={secure ? 'eye-off-outline' : 'eye-outline'}
              onPress={() => setSecure(s => !s)}
              color={colors.textSecondary}
            />
          ) : undefined
        }
        {...rest}
      />
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    fontSize: 15,
    minHeight: 52,
  },
  outline: {
    borderRadius: 12,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 12,
    fontSize: 12,
    color: colors.error,
  },
});
