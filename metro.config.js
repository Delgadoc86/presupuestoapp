const { getSentryExpoConfig } = require('@sentry/react-native/metro');

// Conserva la configuración estándar de Expo y agrega debug IDs para que los
// errores de producción puedan asociarse a sus source maps.
module.exports = getSentryExpoConfig(__dirname);
