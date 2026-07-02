import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

export default function AppButton({
  children,
  onPress,
  mode = 'contained',
  loading = false,
  disabled = false,
  style,
  ...rest
}) {
  return (
    <Button
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled || loading}
      contentStyle={styles.content}
      labelStyle={styles.label}
      style={[styles.button, style]}
      {...rest}
    >
      {children}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 50,
  },
  content: {
    height: 54,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
