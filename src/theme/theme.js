import { MD3LightTheme } from 'react-native-paper';
import { colors } from './colors';

export const theme = {
  ...MD3LightTheme,
  roundness: 4,
  colors: {
    ...MD3LightTheme.colors,
    primary:            colors.primary,
    primaryContainer:   colors.primaryLight,
    onPrimaryContainer: colors.primaryDark,
    secondary:          colors.success,
    secondaryContainer: colors.successLight,
    error:              colors.error,
    background:         colors.background,
    surface:            colors.surface,
    surfaceVariant:     colors.surfaceVariant,
    onPrimary:          colors.white,
    onSecondary:        colors.white,
    onBackground:       colors.text,
    onSurface:          colors.text,
    onSurfaceVariant:   colors.textSecondary,
    outline:            colors.border,
  },
};
