import React from 'react';
import { Snackbar } from 'react-native-paper';
import { useAppContext } from '../../context/AppContext';
import { colors } from '../../theme/colors';

const TYPE_COLORS = {
  info: colors.text,
  success: colors.success,
  error: colors.error,
  warning: colors.warning,
};

export default function AppSnackbar() {
  const { snackbar, hideSnackbar } = useAppContext();

  return (
    <Snackbar
      visible={snackbar.visible}
      onDismiss={hideSnackbar}
      duration={3500}
      style={{ backgroundColor: TYPE_COLORS[snackbar.type] ?? colors.text }}
      action={{ label: 'OK', onPress: hideSnackbar, textColor: colors.white }}
    >
      {snackbar.message}
    </Snackbar>
  );
}
