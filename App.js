import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

import { theme } from './src/theme/theme';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/context/AuthContext';
import { BusinessProvider } from './src/context/BusinessContext';
import AppNavigator from './src/navigation/AppNavigator';
import AppSnackbar from './src/components/common/AppSnackbar';
import UpdateModal from './src/components/common/UpdateModal';
import ErrorBoundary from './src/components/common/ErrorBoundary';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <PaperProvider theme={theme}>
            <AppProvider>
              <AuthProvider>
                <BusinessProvider>
                  <StatusBar style="auto" />
                  <AppNavigator />
                  <AppSnackbar />
                  <UpdateModal />
                </BusinessProvider>
              </AuthProvider>
            </AppProvider>
          </PaperProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
