import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { logError } from '../../utils/errorUtils';
import { colors } from '../../theme/colors';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logError('ErrorBoundary', { error, componentStack: info.componentStack });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="alert-circle-outline" size={56} color={colors.error} />
        <Text style={styles.title}>Algo salió mal</Text>
        <Text style={styles.body}>
          Ocurrió un error inesperado. Cerrá y volvé a abrir la app.
        </Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => this.setState({ hasError: false })}
        >
          <Text style={styles.btnText}>Intentar de nuevo</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 50,
  },
  btnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
});
