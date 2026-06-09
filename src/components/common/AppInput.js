import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Text, useTheme } from 'react-native-paper';

export default function AppInput({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry,
  style,
  ...rest
}) {
  const theme = useTheme();
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
        outlineStyle={styles.outline}
        right={
          secureTextEntry ? (
            <TextInput.Icon
              icon={secure ? 'eye-off-outline' : 'eye-outline'}
              onPress={() => setSecure(s => !s)}
            />
          ) : undefined
        }
        {...rest}
      />
      {error ? (
        <Text
          variant="bodySmall"
          style={[styles.errorText, { color: theme.colors.error }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outline: {
    borderRadius: 12,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 12,
  },
});
