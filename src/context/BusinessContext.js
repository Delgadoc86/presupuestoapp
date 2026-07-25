/**
 * BusinessContext — perfil del negocio del usuario en tiempo real.
 *
 * Responsabilidad: proveer los datos de businessProfiles/{uid} a cualquier
 * pantalla que los necesite, manteniéndolos actualizados via onSnapshot.
 *
 * Expone:
 *   - business → datos del perfil (businessName, logoUrl, whatsapp, etc.) o null
 *   - loading  → true mientras se carga el perfil inicial
 *
 * Por qué onSnapshot y no getDocs:
 *   Cuando el usuario edita su perfil en BusinessProfileScreen, el cambio
 *   se refleja automáticamente en HomeScreen y en el formulario de presupuesto
 *   sin necesidad de refetch manual.
 *
 * Consumidores: HomeScreen (nombre del negocio), QuoteFormScreen (snapshot
 * del negocio que se guarda en cada presupuesto), BusinessProfileScreen (datos iniciales).
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { useAuthContext } from './AuthContext';
import { logError } from '../utils/errorUtils';

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const { user, emailVerified } = useAuthContext();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !emailVerified) {
      setBusiness(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'businessProfiles', user.uid),
      (snap) => {
        setBusiness(snap.exists() ? snap.data() : null);
        setLoading(false);
      },
      (error) => {
        logError('BusinessContext', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, emailVerified]);

  return (
    <BusinessContext.Provider value={{ business, loading }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessContext() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusinessContext debe usarse dentro de BusinessProvider');
  return ctx;
}
