import * as Sentry from '@sentry/react-native';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
const environment = process.env.EXPO_PUBLIC_APP_ENV?.trim()
  || (__DEV__ ? 'development' : 'production');

let initialized = false;

export function initMonitoring() {
  if (initialized) return;

  Sentry.init({
    dsn: sentryDsn,
    enabled: !__DEV__ && Boolean(sentryDsn),
    environment,
    sendDefaultPii: false,
    tracesSampleRate: 0,
  });
  initialized = true;
}
export function captureError(context, captured) {
  if (__DEV__ || !sentryDsn) return;

  const nestedError = captured?.error instanceof Error ? captured.error : null;
  const exception = nestedError
    || (captured instanceof Error ? captured : new Error(String(captured ?? 'Error desconocido')));

  Sentry.withScope((scope) => {
    scope.setTag('context', context);
    if (captured?.componentStack) {
      scope.setExtra('componentStack', captured.componentStack);
    }
    Sentry.captureException(exception);
  });
}
