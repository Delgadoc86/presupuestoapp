/**
 * AppContext — estado global de la interfaz de usuario.
 *
 * Responsabilidad: gestionar el snackbar (toast) global que se muestra
 * desde cualquier pantalla sin necesidad de prop drilling.
 *
 * Expone:
 *   - snackbar        → { visible, message, type } estado actual del snackbar
 *   - showSnackbar(message, type) → muestra el snackbar ('info' | 'success' | 'error')
 *   - hideSnackbar()  → oculta el snackbar
 *
 * Consumidores: cualquier pantalla o hook que necesite mostrar feedback al usuario.
 * El componente AppSnackbar (en App.js) lo renderiza de forma global.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'info',
  });

  const showSnackbar = useCallback((message, type = 'info') => {
    setSnackbar({ visible: true, message, type });
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <AppContext.Provider value={{ snackbar, showSnackbar, hideSnackbar }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext debe usarse dentro de AppProvider');
  return ctx;
}
